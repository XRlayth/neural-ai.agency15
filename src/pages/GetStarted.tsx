import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import VerificationInput from '../components/VerificationInput';
import { supabase } from '../lib/supabase';

function GetStarted() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp) {
      if (password !== verifyPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (passwordStrength < 3) {
        setError('Password is too weak');
        setIsLoading(false);
        return;
      }

      try {
        const { error: signUpError } = await signUp(email, password, username);
        if (signUpError) throw signUpError;
        setIsVerifying(true);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    } else {
      try {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        navigate('/dashboard');
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    }
  };

  const handleVerification = async (code: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup'
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
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
                LET'S BUILD THE FUTURE
                <span className="absolute -inset-1 rounded-lg opacity-50 blur-xl bg-gradient-to-r from-[#00f7ff]/20 to-[#00f7ff]/5"></span>
              </h1>
              <div className="border border-white/20 p-8 rounded-lg shadow-[0_0_15px_rgba(0,247,255,0.1)]">
                <div className="flex justify-center space-x-4 mb-8">
                  <button
                    className={`px-6 py-2 rounded-full transition-all duration-300 ${
                      !isSignUp 
                        ? 'bg-white text-black' 
                        : 'border border-white/20 text-white hover:border-[#00f7ff] hover:shadow-[0_0_10px_rgba(0,247,255,0.3)]'
                    }`}
                    onClick={() => setIsSignUp(false)}
                  >
                    Sign In
                  </button>
                  <button
                    className={`px-6 py-2 rounded-full transition-all duration-300 ${
                      isSignUp 
                        ? 'bg-white text-black' 
                        : 'border border-white/20 text-white hover:border-[#00f7ff] hover:shadow-[0_0_10px_rgba(0,247,255,0.3)]'
                    }`}
                    onClick={() => setIsSignUp(true)}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="text"
                      placeholder={isSignUp ? "Email" : "Email/Username"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                      required
                    />
                    {isSignUp && password && (
                      <div className="mt-2">
                        <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${strengthColors[passwordStrength - 1]}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm mt-1 text-gray-400">
                          Password Strength: {strengthLabels[passwordStrength - 1]}
                        </p>
                      </div>
                    )}
                  </div>
                  {isSignUp && (
                    <div>
                      <input
                        type="password"
                        placeholder="Verify Password"
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        className="w-full p-4 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-[#00f7ff] focus:shadow-[0_0_10px_rgba(0,247,255,0.3)] text-white transition-all duration-300"
                        required
                      />
                    </div>
                  )}
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
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </span>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </button>
                  {!isSignUp && (
                    <Link
                      to="/reset-password"
                      className="block text-sm text-gray-400 hover:text-[#00f7ff] transition-colors mt-4"
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      I don't remember my password
                    </Link>
                  )}
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

export default GetStarted;