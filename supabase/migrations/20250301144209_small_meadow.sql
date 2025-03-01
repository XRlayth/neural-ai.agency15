/*
  # Authentication System Upgrade

  1. New Tables
    - `user_two_factor` - Stores 2FA settings for users
      - `user_id` (uuid, primary key, references auth.users)
      - `is_enabled` (boolean)
      - `secret` (text, encrypted TOTP secret)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `backup_codes` - Stores backup recovery codes for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `code_hash` (text, hashed backup code)
      - `is_used` (boolean)
      - `created_at` (timestamp)
      - `used_at` (timestamp, nullable)
    
    - `verification_tokens` - Stores tokens for email verification
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, verification token)
      - `type` (text, token type: 'email', '2fa', 'password_reset')
      - `expires_at` (timestamp)
      - `created_at` (timestamp)
      - `is_used` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access only their own data
    - Add policies for authenticated users
*/

-- Create user_two_factor table
CREATE TABLE IF NOT EXISTS user_two_factor (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create backup_codes table
CREATE TABLE IF NOT EXISTS backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_used BOOLEAN DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);

-- Enable Row Level Security
ALTER TABLE user_two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_two_factor
CREATE POLICY "Users can view their own 2FA settings"
  ON user_two_factor
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
  ON user_two_factor
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
  ON user_two_factor
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for backup_codes
CREATE POLICY "Users can view their own backup codes"
  ON backup_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backup codes"
  ON backup_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup codes"
  ON backup_codes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for verification_tokens
CREATE POLICY "Users can view their own verification tokens"
  ON verification_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert verification tokens"
  ON verification_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification tokens"
  ON verification_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create functions for 2FA and backup code management
CREATE OR REPLACE FUNCTION generate_totp_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  random_bytes BYTEA;
  base32_secret TEXT;
BEGIN
  -- Generate 20 random bytes
  random_bytes := gen_random_bytes(20);
  
  -- Convert to base32 for TOTP
  base32_secret := encode(random_bytes, 'base64');
  
  RETURN base32_secret;
END;
$$;

CREATE OR REPLACE FUNCTION generate_backup_codes(user_uuid UUID, num_codes INTEGER DEFAULT 10)
RETURNS SETOF TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i INTEGER;
  new_code TEXT;
  code_bytes BYTEA;
BEGIN
  -- Delete any existing unused backup codes
  DELETE FROM backup_codes 
  WHERE user_id = user_uuid AND is_used = false;
  
  -- Generate new backup codes
  FOR i IN 1..num_codes LOOP
    -- Generate a random 8-character code
    code_bytes := gen_random_bytes(5);
    new_code := upper(encode(code_bytes, 'hex'));
    new_code := substring(new_code from 1 for 10);
    
    -- Insert the hashed code
    INSERT INTO backup_codes (user_id, code_hash)
    VALUES (user_uuid, crypt(new_code, gen_salt('bf')));
    
    -- Return the plaintext code to the user
    RETURN NEXT new_code;
  END LOOP;
  
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION verify_backup_code(user_uuid UUID, input_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record RECORD;
  found_valid_code BOOLEAN := false;
BEGIN
  -- Find a matching unused backup code
  SELECT * INTO code_record
  FROM backup_codes
  WHERE user_id = user_uuid 
    AND is_used = false
    AND code_hash = crypt(input_code, code_hash)
  LIMIT 1;
  
  -- If found, mark as used and return true
  IF FOUND THEN
    UPDATE backup_codes
    SET is_used = true, used_at = now()
    WHERE id = code_record.id;
    found_valid_code := true;
  END IF;
  
  RETURN found_valid_code;
END;
$$;

CREATE OR REPLACE FUNCTION create_verification_token(user_uuid UUID, token_type TEXT, expiry_hours INTEGER DEFAULT 24)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
  token_bytes BYTEA;
BEGIN
  -- Generate a random token
  token_bytes := gen_random_bytes(16);
  new_token := encode(token_bytes, 'hex');
  
  -- Insert the token with expiration
  INSERT INTO verification_tokens (user_id, token, type, expires_at)
  VALUES (user_uuid, new_token, token_type, now() + (expiry_hours * interval '1 hour'));
  
  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION verify_token(input_token TEXT, token_type TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Find and validate the token
  SELECT user_id INTO user_uuid
  FROM verification_tokens
  WHERE token = input_token
    AND type = token_type
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;
  
  -- If found, mark as used and return the user_id
  IF FOUND THEN
    UPDATE verification_tokens
    SET is_used = true
    WHERE token = input_token;
    
    RETURN user_uuid;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Create a function to handle rate limiting for verification attempts
CREATE OR REPLACE FUNCTION check_rate_limit(ip_address TEXT, action_type TEXT, max_attempts INTEGER DEFAULT 5, window_minutes INTEGER DEFAULT 15)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count recent attempts from this IP for this action
  SELECT COUNT(*) INTO attempt_count
  FROM (
    SELECT 1
    FROM verification_tokens
    WHERE created_at > now() - (window_minutes * interval '1 minute')
    AND metadata->>'ip_address' = ip_address
    AND metadata->>'action' = action_type
    LIMIT max_attempts + 1
  ) AS attempts;
  
  -- Return true if under the limit, false if rate limited
  RETURN attempt_count <= max_attempts;
END;
$$;

-- Add a function to update user metadata
CREATE OR REPLACE FUNCTION update_user_metadata(user_uuid UUID, metadata JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || metadata
  WHERE id = user_uuid;
END;
$$;