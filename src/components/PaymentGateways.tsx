
import React from 'react';
import { CreditCard, Plus, Check, Wallet, Apple, Smartphone, Globe, ArrowRightLeft } from 'lucide-react';
import { PaymentMethod, PaymentGateway } from '../types';

interface PaymentGatewaysProps {
  methods: PaymentMethod[];
  onAddMethod: () => void;
  onSetDefault: (id: string) => void;
}

const PaymentGateways: React.FC<PaymentGatewaysProps> = ({ methods, onAddMethod, onSetDefault }) => {
  const getGatewayIcon = (type: PaymentMethod['type']) => {
    switch(type) {
      case 'visa': return <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">V</div>;
      case 'mastercard': return <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black">M</div>;
      case 'mpesa': return <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black">M-P</div>;
      case 'paypal': return <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center"><Globe className="w-6 h-6" /></div>;
      case 'apple_pay': return <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center"><Apple className="w-6 h-6" /></div>;
      default: return <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center"><Wallet className="w-6 h-6" /></div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-gray-900">Wallet & Gateways</h3>
        <button 
          onClick={onAddMethod}
          className="p-2 bg-black text-white rounded-full hover:scale-110 transition active:scale-95 shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {methods.map(method => (
          <div 
            key={method.id}
            onClick={() => onSetDefault(method.id)}
            className={`
              p-5 rounded-[32px] border-2 flex items-center gap-4 cursor-pointer transition-all
              ${method.isDefault ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}
            `}
          >
            {getGatewayIcon(method.type)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-black text-sm capitalize">{method.type.replace('_', ' ')}</p>
                {method.isDefault && <span className="text-[8px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded">Default</span>}
              </div>
              {method.last4 && <p className="text-xs text-gray-400 font-bold">•••• {method.last4}</p>}
              {method.phone && <p className="text-xs text-gray-400 font-bold">{method.phone}</p>}
            </div>
            {method.isDefault && <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center"><Check className="w-3 h-3" /></div>}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden group cursor-pointer">
        <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-45">
          <Wallet className="w-32 h-32" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">OmniWallet Balance</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="text-4xl font-black">$142.50</h2>
          <span className="text-sm font-black opacity-60">USD</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="flex-1 py-3 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all">
             <Plus className="w-3 h-3" /> Top Up
          </button>
          <button className="px-6 py-3 bg-white/20 backdrop-blur rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/30 transition-all">
             <ArrowRightLeft className="w-3 h-3" /> Transfer
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-[40px] border border-gray-100 space-y-4">
         <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Supported Multi-Network Gateways</h4>
         <div className="flex justify-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all">
            <div className="flex flex-col items-center gap-1">
               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xs font-black text-emerald-600 border border-emerald-100">M-P</div>
               <span className="text-[8px] font-bold uppercase">M-Pesa</span>
            </div>
            <div className="flex flex-col items-center gap-1">
               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-100">St</div>
               <span className="text-[8px] font-bold uppercase">Stripe</span>
            </div>
            <div className="flex flex-col items-center gap-1">
               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xs font-black text-blue-600 border border-blue-100">Py</div>
               <span className="text-[8px] font-bold uppercase">PayPal</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PaymentGateways;
