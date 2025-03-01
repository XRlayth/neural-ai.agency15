import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { verifyBackupCode } from '../lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      
      if (session?.user) {
        // Check if 2FA is enabled for this user
        const { data } = await supabase
          .from('user_two_factor')
          .select('is_enabled')
          .eq('user_id', session.user.id)
          .single();
        
        setIs2FAEnabled(data?.is_enabled || false);
      }
      
      setLoading(false);
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      
      if (session?.user) {
        // Check if 2FA is enabled for this user
        const { data } = await supabase
          .from('user_two_factor')
          .select('is_enabled')
          .eq('user_id', session.user.id)
          .single();
        
        setIs2FAEnabled(data?.is_enabled || false);
      } else {
        setIs2FAEnabled(false);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailOrUsername,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          password: password.substring(0, 3) + '•'.repeat(password.length - 3)
        },
        emailRedirectTo: `${window.location.origin}/verify`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPasswordWithEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const resetPasswordWithBackupCode = async (code: string) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    
    try {
      const isValid = await verifyBackupCode(user.id, code);
      
      if (isValid) {
        // If valid, we'll allow the user to reset their password
        // This would typically redirect to a password reset page
        return { error: null };
      } else {
        return { error: new Error('Invalid backup code') };
      }
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const updateUserProfile = async (data: any) => {
    const { error } = await supabase.auth.updateUser({
      data
    });
    return { error };
  };

  return {
    isAuthenticated,
    user,
    loading,
    is2FAEnabled,
    signIn,
    signUp,
    signOut,
    resetPasswordWithEmail,
    resetPasswordWithBackupCode,
    updatePassword,
    updateUserProfile
  };
}