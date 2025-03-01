import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Shield, Key } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import TwoFactorSetup from '../components/TwoFactorSetup';
import BackupCodes from '../components/BackupCodes';
import { supabase } from '../lib/supabase';
import { disable2FA } from '../lib/auth';

function Account() {
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const { user, is2FAEnabled, signOut, updatePassword, updateUserProfile } = useAuth();
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [isBackupCodesOpen, setIsBackupCodesOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.user_metadata?.username) {
      setUsername(user.user_metadata.username);
    }
  }, [user]);

  const handleEnable2FA = () => {
    setIs2FASetupOpen(true);
  };

  const handleDisable2FA = async () => {
    try {
      setIsLoading(true);
      await disable2FA(user.id);
      setIsLoading(false);
      window.location.reload(); // Refresh to update state
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError('Failed to disable 2FA. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGenerateBackupCodes = () => {
    setIsBackupCodesOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await updatePassword(newPassword);

      if (error) throw error;

      // Update the masked password in user metadata
      await updateUserProfile({
        password: newPassword.substring(0, 3) + '•'. repeat(newPassword.length - 3)
      });

      setIsChangingPassword(false);
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Error changing password. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl font-bold mb-12 tracking-wider text-center relative">
                <span className="relative inline-block">
                  ACCOUNT PANEL
                  <span className="absolute -inset-1 rounded-lg opacity-50 blur-xl bg-gradient-to-r from-[#00f7ff]/20 to-[#00f7ff]/5"></span>
                </span>
              </h1>
              
              <div className="grid grid-cols-12 gap-8">
                {/* Sidebar */}
                <div className="col-span-12 md:col-span-3">
                  <div className="border border-white/20 rounded-lg p-4 shadow-[0_0_15px_rgba(0,247,255,0.1)]">
                    <button
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 frame-hover ${
                        activeTab === 'info' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                      }`}
                      onClick={() => setActiveTab('info')}
                    >
                      Account Info
                    </button>
                    <button
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 frame-hover ${
                        activeTab === 'security' ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                      }`}
                      onClick={() => setActiveTab('security')}
                    >
                      Security
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="col-span-12 md:col-span-9">
                  <div className="border border-white/20 rounded-lg p-8 shadow-[0_0_15px_rgba(0,247,255,0.1)]">
                    {activeTab === 'info' ? (
                      <div>
                        <h2 className="text-2xl font-bold mb-6 relative inline-block">
                          Account Information
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#00f7ff] to-transparent"></span>
                        </h2>
                        
                        {success && (
                          <div className="mb-6 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                            {success}
                          </div>
                        )}
                        
                        <div className="space-y-6">
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <label className="block text-sm text-gray-400 mb-1">Username</label>
                            <p className="text-lg">{username || 'N/A'}</p>
                          </div>
                          
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <p className="text-lg">{user?.email || 'N/A'}</p>
                          </div>
                          
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <label className="block text-sm text-gray-400 mb-1">Password</label>
                            <div className="flex items-center space-x-4">
                              <p className="text-lg font-mono">{user?.user_metadata?.password || '•••••••'}</p>
                              <button
                                onClick={() => setIsChangingPassword(true)}
                                className="px-4 py-2 text-sm border border-white/20 rounded-lg frame-hover hover:bg-white hover:text-black transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,247,255,0.3)]"
                              >
                                Change Password
                              </button>
                            </div>
                          </div>

                          {isChangingPassword && (
                            <form onSubmit={handleChangePassword} className="mt-6 space-y-4 bg-white/5 p-6 rounded-lg border border-white/10">
                              <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                              
                              {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                                  {error}
                                </div>
                              )}
                              
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                                <input
                                  type="password"
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  className="w-full p-3 bg-black border border-white/20 rounded-lg focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] transition-all duration-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">New Password</label>
                                <input
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="w-full p-3 bg-black border border-white/20 rounded-lg focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] transition-all duration-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                                <input
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="w-full p-3 bg-black border border-white/20 rounded-lg focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] transition-all duration-300"
                                />
                              </div>
                              <div className="flex space-x-4">
                                <button
                                  type="submit"
                                  disabled={isLoading}
                                  className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <span className="flex items-center">
                                      <span className="w-4 h-4 mr-2 border-2 border-t-black border-black/30 rounded-full animate-spin"></span>
                                      Updating...
                                    </span>
                                  ) : (
                                    'Update Password'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsChangingPassword(false)}
                                  className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          <div className="mt-8 pt-8 border-t border-gray-800">
                            <button
                              onClick={handleSignOut}
                              className="px-6 py-3 bg-red-600 text-white rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors frame-hover"
                            >
                              <LogOut className="w-5 h-5" />
                              <span>Log Out</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-2xl font-bold mb-6 relative inline-block">
                          Security Settings
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#00f7ff] to-transparent"></span>
                        </h2>
                        
                        {error && (
                          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                            {error}
                          </div>
                        )}
                        
                        <div className="space-y-8">
                          <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <div className="flex items-start space-x-4">
                              <Shield className="w-8 h-8 text-[#00f7ff] flex-shrink-0" />
                              <div>
                                <h3 className="text-xl font-semibold mb-2">Two-Factor Authentication</h3>
                                <p className="text-gray-400 mb-4">
                                  Add an extra layer of security to your account by requiring a verification code 
                                  in addition to your password when signing in.
                                </p>
                                
                                {!is2FAEnabled ? (
                                  <button
                                    onClick={handleEnable2FA}
                                    className="px-6 py-2 rounded-lg border border-[#00f7ff] text-white hover:bg-[#00f7ff]/10 transition-all duration-300 shadow-[0_0_10px_rgba(0,247,255,0.2)]"
                                  >
                                    Enable 2FA
                                  </button>
                                ) : (
                                  <div className="flex items-center space-x-4">
                                    <span className="flex items-center text-green-400">
                                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                      2FA is enabled
                                    </span>
                                    <button
                                      className="px-4 py-2 border border-white/20 rounded-lg text-sm hover:bg-white/10 transition-all duration-300"
                                      onClick={handleDisable2FA}
                                      disabled={isLoading}
                                    >
                                      {isLoading ? (
                                        <span className="flex items-center">
                                          <span className="w-3 h-3 mr-2 border-2 border-t-white border-white/30 rounded-full animate-spin"></span>
                                          Disabling...
                                        </span>
                                      ) : (
                                        'Disable 2FA'
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <div className="flex items-start space-x-4">
                              <Key className="w-8 h-8 text-[#00f7ff] flex-shrink-0" />
                              <div>
                                <h3 className="text-xl font-semibold mb-2">Backup Codes</h3>
                                <p className="text-gray-400 mb-4">
                                  Generate backup codes to access your account if you lose your authentication device.
                                  Each code can only be used once.
                                </p>
                                
                                <button
                                  onClick={handleGenerateBackupCodes}
                                  disabled={!is2FAEnabled}
                                  className={`px-6 py-2 rounded-lg border ${
                                    is2FAEnabled 
                                      ? 'border-[#00f7ff] text-white hover:bg-[#00f7ff]/10 shadow-[0_0_10px_rgba(0,247,255,0.2)]' 
                                      : 'border-white/20 text-gray-400'
                                  } transition-all duration-300`}
                                >
                                  Generate New Backup Codes
                                </button>
                                
                                {!is2FAEnabled && (
                                  <p className="text-sm text-yellow-400 mt-2">
                                    You need to enable 2FA first to generate backup codes.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Modals */}
      <TwoFactorSetup 
        isOpen={is2FASetupOpen}
        onClose={() => setIs2FASetupOpen(false)}
        userId={user?.id}
        userEmail={user?.email}
        onSuccess={() => window.location.reload()}
      />
      
      <BackupCodes
        isOpen={isBackupCodesOpen}
        onClose={() => setIsBackupCodesOpen(false)}
        userId={user?.id}
      />
    </div>
  );
}

export default Account;