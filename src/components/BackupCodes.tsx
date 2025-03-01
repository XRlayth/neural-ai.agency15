import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { generateBackupCodes } from '../lib/auth';

interface BackupCodesProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

function BackupCodes({ isOpen, onClose, userId }: BackupCodesProps) {
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleGenerateCodes = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const backupCodes = await generateBackupCodes(userId);
      setCodes(backupCodes);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating backup codes:', error);
      setError('Failed to generate backup codes. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'))
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy codes:', err);
      });
  };

  const handlePrintCodes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Neural AI - Backup Codes</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 20px; }
              .code { font-family: monospace; font-size: 16px; padding: 8px; margin: 5px; border: 1px solid #ccc; display: inline-block; }
              .warning { color: #d00; margin: 20px 0; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <h1>Neural AI - Backup Recovery Codes</h1>
            <p>Keep these recovery codes in a safe place. Each code can only be used once.</p>
            <div>
              ${codes.map(code => `<div class="code">${code}</div>`).join('')}
            </div>
            <p class="warning">Warning: These codes will not be shown again!</p>
            <div class="footer">Generated on ${new Date().toLocaleString()}</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Backup Recovery Codes" width="max-w-lg">
      {codes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <p className="text-gray-400 mb-6">
            Backup recovery codes allow you to sign in to your account if you lose access to your 
            authenticator app. Each code can only be used once.
          </p>
          
          {error && (
            <p className="text-red-500 mb-4 text-sm">{error}</p>
          )}
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateCodes}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 mr-2 border-2 border-t-black border-black/30 rounded-full animate-spin"></span>
                  Generating...
                </span>
              ) : (
                'Generate Codes'
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-4">
            <p className="text-yellow-400 font-semibold mb-2">
              Important: Save these codes in a secure location!
            </p>
            <p className="text-gray-400 text-sm mb-4">
              These codes will only be shown once. Each code can be used only once to sign in if you 
              lose access to your authenticator app.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            {codes.map((code, index) => (
              <div
                key={index}
                className="font-mono bg-gray-900 p-2 rounded text-center border border-white/10 hover:border-[#00f7ff]/30 transition-colors"
              >
                {code}
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleCopyCodes}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors flex-1"
            >
              {isCopied ? 'Copied!' : 'Copy Codes'}
            </button>
            <button
              onClick={handlePrintCodes}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors flex-1"
            >
              Print Codes
            </button>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}

export default BackupCodes;