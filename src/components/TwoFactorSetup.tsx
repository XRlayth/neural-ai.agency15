import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import VerificationInput from './VerificationInput';
import { generateTOTPSecret, verifyTOTP, enable2FA } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSuccess: () => void;
}

function TwoFactorSetup({ isOpen, onClose, userId, userEmail, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'intro' | 'qrcode' | 'verify'>('intro');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && step === 'qrcode' && !qrCode) {
      generateQRCode();
    }
  }, [isOpen, step]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      const { secret, qrCodeDataURL } = await generateTOTPSecret(userId, userEmail);
      setSecret(secret);
      setQrCode(qrCodeDataURL);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        setIsLoading(false);
        return;
      }

      const isValid = await verifyTOTP(secret, verificationCode);
      
      if (isValid) {
        await enable2FA(userId);
        setIsLoading(false);
        onSuccess();
        onClose();
      } else {
        setError('Invalid verification code. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Failed to verify code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStep('intro');
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Set Up Two-Factor Authentication">
      {step === 'intro' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <p className="text-gray-400 mb-6">
            Two-factor authentication adds an extra layer of security to your account. 
            Once enabled, you'll need to enter a verification code from your authenticator app 
            when signing in.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('qrcode')}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </motion.div>
      )}

      {step === 'qrcode' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-6">
            Scan this QR code with your authenticator app (like Google Authenticator, 
            Authy, or Microsoft Authenticator).
          </p>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-4 border-t-white border-white/30 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <div className="p-2 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-400 mb-6">
            If you can't scan the QR code, you can manually enter this secret key in your app:
            <span className="block mt-2 p-2 bg-gray-800 rounded font-mono text-xs break-all">
              {secret}
            </span>
          </p>
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('verify')}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {step === 'verify' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-6">
            Enter the 6-digit verification code from your authenticator app to verify setup.
          </p>
          
          <div className="mb-6">
            <VerificationInput
              value={verificationCode}
              onChange={setVerificationCode}
            />
          </div>
          
          {error && (
            <p className="text-red-500 mb-4 text-sm">{error}</p>
          )}
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setStep('qrcode')}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 mr-2 border-2 border-t-black border-black/30 rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                'Verify & Enable'
              )}
            </button>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}

export default TwoFactorSetup;