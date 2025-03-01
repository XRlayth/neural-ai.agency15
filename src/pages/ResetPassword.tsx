import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import VerificationInput from '../components/VerificationInput';

function ResetPassword() {
  const [method, setMethod] = useState<'email' | 'backup'>('email');
  const [email, setEmail] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPasswordWithEmail, resetPasswordWithBackupCode, updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (method === 'email') {
        await resetPasswordWithEmail(email);
        setSuccess('Password reset instructions have been sent to your email.');
        setIsVerifying(true);
        setIsLoading(false);
      } else {
        const { error } = await resetPasswordWithBackupCode(backupCode);
        if (error) throw error;
        navigate('/get-started');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleVerification = async (code: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery'
      });

      if (error) throw error;
      setIsVerifying(false);
      setSuccess('Email verified. Please set a new password.');
      setIsLoading(false);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      
      setSuccess('Password has been reset successfully!');
      setTimeout(() => {
        navigate('/get-started');
      }, 2000);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-grow pt-20">
          <section className="py-20 px-4">
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold mb-6 relative inline-block">
                  Verify Your Email
                  <span className="absolute -inset-1 rounded-lg opacity-50 blur-xl bg-gradient-to-r from-[#00f7ff]/20 to-[#00f7ff]/5"></span>
                </h2>
                <div className="border border-white/20 p-8 rounded-lg shadow-[0_0_15px_rgba(0,247,255,0.1)]">
                  <p className="text-gray-400 mb-6">
                    Please enter the 6-digit verification code sent to {email}
                  </p>
                  <VerificationInput
                    value={verificationCode}
                    onChange={setVerificationCode}
                    onComplete={handleVerification}
                  />
                  {error && (
                    <p className="text-red-500 mt-4">{error}</p>
                  )}
                  {isLoading && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-6 h-6 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (success && !isVerifying) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-grow pt-20">
          <section className="py-20 px-4">
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold mb-6 relative inline-block">
                  Reset Your Password
                  <span className="absolute -inset-1 rounded-lg opacity-50 blur-xl bg-gradient-to-r from-[#00f7ff]/20 to-[#00f7ff]/5"></span>
                </h2>
                <div className="border border-white/20 p-8 rounded-lg shadow-[0_0_15px_rgba(0,247,255,0.1)]">
                  {success && (
                    <p className="text-green-500 mb-6">{success}</p>
                  )}
                  
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                        required
                      />
                    </div>
                    
                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-8 py-4 rounded-lg bg-white text-black font-bold hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <span className="w-5 h-5 mr-2 border-2 border-t-black border-black/30 rounded-full animate-spin"></span>
                          Resetting Password...
                        </span>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        <section className="py-20 px-4">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold mb-8 tracking-wider relative inline-block">
                RESET PASSWORD
                <span className="absolute -inset-1 rounded-lg opacity-50 blur-xl bg-gradient-to-r from-[#00f7ff]/20 to-[#00f7ff]/5"></span>
              </h1>
              <div className="border border-white/20 p-8 rounded-lg shadow-[0_0_15px_rgba(0,247,255,0.1)]">
                <div className="flex justify-center space-x-4 mb-8">
                  <button
                    className={`px-6 py-2 rounded-full transition-all duration-300 ${
                      method === 'email' 
                        ? 'bg-white text-black' 
                        : 'border border-white/20 text-white hover:border-[#00f7ff] hover:shadow-[0_0_10px_rgba(0,247,255,0.3)]'
                    }`}
                    onClick={() => setMethod('email')}
                  >
                    Email Reset
                  </button>
                  <button
                    className={`px-6 py-2 rounded-full transition-all duration-300 ${
                      method === 'backup' 
                        ? 'bg-white text-black' 
                        : 'border border-white/20 text-white hover:border-[#00f7ff] hover:shadow-[0_0_10px_rgba(0,247,255,0.3)]'
                    }`}
                    onClick={() => setMethod('backup')}
                  >
                    Backup Code
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {method === 'email' ? (
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Backup Code"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                        required
                      />
                    </div>
                  )}
                  
                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                  {success && (
                    <p className="text-green-500 text-sm">{success}</p>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-8 py-4 rounded-lg bg-white text-black font-bold hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="w-5 h-5 mr-2 border-2 border-t-black border-black/30 rounded-full animate-spin"></span>
                        Processing...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ResetPassword;