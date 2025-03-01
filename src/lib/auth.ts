import { createClient } from '@supabase/supabase-js';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to generate a TOTP secret
export const generateTOTPSecret = async (userId: string, email: string) => {
  try {
    // Create a new TOTP object
    const totp = new OTPAuth.TOTP({
      issuer: 'Neural AI',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.generate(20)
    });

    // Get the secret in base32 format
    const secret = totp.secret.base32;

    // Store the secret in the database
    const { error } = await supabase
      .from('user_two_factor')
      .upsert({ 
        user_id: userId,
        secret: secret,
        is_enabled: false,
        updated_at: new Date()
      });

    if (error) throw error;

    // Generate QR code
    const uri = totp.toString();
    const qrCodeDataURL = await QRCode.toDataURL(uri);

    return {
      secret,
      qrCodeDataURL
    };
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    throw error;
  }
};

// Verify TOTP code
export const verifyTOTP = async (secret: string, token: string) => {
  try {
    // Create a TOTP object with the secret
    const totp = new OTPAuth.TOTP({
      issuer: 'Neural AI',
      label: 'user',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret
    });

    // Verify the token
    const delta = totp.validate({ token });
    
    // delta is null if the token is invalid
    // otherwise it's the time step difference
    return delta !== null;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
};

// Enable 2FA for a user
export const enable2FA = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_two_factor')
      .update({ is_enabled: true, updated_at: new Date() })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    throw error;
  }
};

// Disable 2FA for a user
export const disable2FA = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_two_factor')
      .update({ is_enabled: false, updated_at: new Date() })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    throw error;
  }
};

// Generate backup codes for a user
export const generateBackupCodes = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('generate_backup_codes', { user_uuid: userId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating backup codes:', error);
    throw error;
  }
};

// Verify a backup code
export const verifyBackupCode = async (userId: string, code: string) => {
  try {
    const { data, error } = await supabase
      .rpc('verify_backup_code', { 
        user_uuid: userId,
        input_code: code
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return false;
  }
};

// Create a verification token
export const createVerificationToken = async (userId: string, type: string, expiryHours = 24) => {
  try {
    const { data, error } = await supabase
      .rpc('create_verification_token', { 
        user_uuid: userId,
        token_type: type,
        expiry_hours: expiryHours
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating verification token:', error);
    throw error;
  }
};

// Verify a token
export const verifyToken = async (token: string, type: string) => {
  try {
    const { data, error } = await supabase
      .rpc('verify_token', { 
        input_token: token,
        token_type: type
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// Update user metadata
export const updateUserMetadata = async (userId: string, metadata: any) => {
  try {
    const { error } = await supabase
      .rpc('update_user_metadata', { 
        user_uuid: userId,
        metadata: metadata
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
};

// Send verification email
export const sendVerificationEmail = async (email: string, token: string, type: string) => {
  try {
    let subject = '';
    let content = '';

    switch (type) {
      case 'email_verification':
        subject = 'Verify your email address';
        content = `Please verify your email address by entering this code: ${token}`;
        break;
      case '2fa_setup':
        subject = 'Two-factor authentication setup';
        content = `Your verification code for setting up two-factor authentication is: ${token}`;
        break;
      case 'password_reset':
        subject = 'Reset your password';
        content = `Your verification code for resetting your password is: ${token}`;
        break;
      default:
        subject = 'Verification code';
        content = `Your verification code is: ${token}`;
    }

    // Use Supabase's built-in email functionality
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?token=${token}`,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};