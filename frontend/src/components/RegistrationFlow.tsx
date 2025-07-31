import { useState } from 'react';
import { type Address } from 'viem';
import { deriveEncryptionKeys, publicKeyToHex } from '@/lib/encryption';
import { registerPublicKey } from '@/lib/contract';

interface RegistrationFlowProps {
  account: Address;
  onComplete: () => void;
}

export function RegistrationFlow({ account, onComplete }: RegistrationFlowProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState<'intro' | 'generating' | 'signing' | 'complete'>('intro');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsRegistering(true);
    setError(null);
    
    try {
      setStep('generating');
      
      // Derive encryption keys from wallet signature
      const keyPair = await deriveEncryptionKeys(account);
      const publicKeyHex = publicKeyToHex(keyPair.publicKeyBytes);
      
      setStep('signing');
      
      // Register public key on blockchain
      const txHash = await registerPublicKey(account, publicKeyHex);
      
      setStep('complete');
      
      // Wait a moment then complete
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStep('intro');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {step === 'intro' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6c-3 0-5.197-1.756-6-4.184v-.52c0-.447.25-.84.632-1.013C7.678 9.744 6.5 8.497 6.5 7a2.5 2.5 0 015 0c0 .337-.06.661-.171.96a3.001 3.001 0 001.342 5.732c.169 0 .331-.014.49-.041C14.189 12.842 15 11.516 15 10V9z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Setup Your Messaging Keys
            </h2>
            
            <p className="text-gray-600 mb-8">
              To start sending encrypted messages, we need to generate your unique encryption keys 
              and register them on the blockchain. This is a one-time setup.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-3">How it works:</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <span>You'll sign a message with your wallet to generate encryption keys</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <span>Your public key gets registered on the blockchain (small gas fee)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <span>Others can now send you encrypted messages!</span>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Keys & Register
            </button>
          </div>
        )}
        
        {step === 'generating' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Generating Encryption Keys
            </h2>
            
            <p className="text-gray-600">
              Please sign the message in your wallet to generate your unique encryption keys...
            </p>
          </div>
        )}
        
        {step === 'signing' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Registering On Blockchain
            </h2>
            
            <p className="text-gray-600">
              Confirm the transaction in your wallet to register your public key...
            </p>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Registration Complete!
            </h2>
            
            <p className="text-gray-600">
              Your encryption keys have been generated and registered. You can now send and receive encrypted messages!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}