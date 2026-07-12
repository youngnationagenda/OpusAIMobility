
import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Lock, X, Delete, Loader2, Smartphone } from 'lucide-react';

interface VendorSecurityProps {
  onAuthenticated: () => void;
  onCancel: () => void;
  requiredPin?: string;
  businessName: string;
}

const VendorSecurity: React.FC<VendorSecurityProps> = ({ onAuthenticated, onCancel, requiredPin, businessName }) => {
  const [pin, setPin] = useState('');
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  const verifyPin = (submittedPin: string) => {
    if (submittedPin === requiredPin || !requiredPin) { // Support bypass for demo if none set
      onAuthenticated();
    } else {
      setError('Incorrect PIN. Please try again.');
      setTimeout(() => setPin(''), 1000);
    }
  };

  const simulateBiometrics = () => {
    setIsBioLoading(true);
    setTimeout(() => {
      setIsBioLoading(false);
      onAuthenticated();
    }, 2000);
  };

  return (
    <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-xs space-y-12 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900">Security Gate</h2>
            <p className="text-sm font-medium text-gray-500">Accessing {businessName}</p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i ? 'bg-black border-black scale-125' : 'border-gray-200'
              } ${error ? 'bg-red-500 border-red-500 animate-bounce' : ''}`} 
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-xs font-bold animate-pulse">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
            <button 
              key={key} 
              onClick={() => handleKeyPress(key)}
              className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-xl font-black hover:bg-gray-100 active:scale-90 transition-all shadow-sm"
            >
              {key}
            </button>
          ))}
          <button 
            onClick={simulateBiometrics}
            className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all"
          >
            {isBioLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Fingerprint className="w-8 h-8" />}
          </button>
          <button 
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-xl font-black"
          >
            0
          </button>
          <button 
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100"
          >
            <Delete className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <button 
          onClick={onCancel}
          className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition"
        >
          Cancel Access
        </button>
      </div>

      {isBioLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[210] flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-white rounded-[40px] p-10 text-center space-y-6 shadow-2xl w-full max-w-xs">
             <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-40" />
                <Fingerprint className="w-20 h-20 text-emerald-600 mx-auto relative" />
             </div>
             <div className="space-y-1">
                <h3 className="text-xl font-black">Authenticating</h3>
                <p className="text-xs font-bold text-gray-400">Verifying Biometrics...</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSecurity;
