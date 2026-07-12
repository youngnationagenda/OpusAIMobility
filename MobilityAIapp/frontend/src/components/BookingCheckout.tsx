
import React, { useState } from 'react';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft, 
  ShieldCheck, 
  Clock,
  Building2,
  Navigation,
  Zap
} from 'lucide-react';
import { User, RideOption, PaymentGateway, RideHistoryItem } from '../types';
import { paymentApi } from '../services/paymentService';
import { omniApi } from '../services/api';

interface BookingCheckoutProps {
  user: User;
  ride: RideOption;
  distanceKm: number;
  scheduledFor?: number | null;
  onConfirm: () => void;
  onCancel: () => void;
  onUpdateUser: (user: User) => void;
}

const BookingCheckout: React.FC<BookingCheckoutProps> = ({ user, ride, distanceKm, scheduledFor, onConfirm, onCancel, onUpdateUser }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>(user.employerId ? 'Bank Transfer' : 'OmniWallet');

  const isBusiness = user.role === 'business';
  const isEmployee = !!user.employerId;
  
  // Requirement: $0.37 per KM
  const kmRate = 0.37;
  const fare = parseFloat((distanceKm * kmRate).toFixed(2));
  
  let balance = 0;
  let employerName = '';
  if (isBusiness) {
    balance = user.businessProfile?.walletBalance || 0;
  } else if (isEmployee) {
    const employer = omniApi.getPublicUser(user.employerId!);
    balance = employer?.businessProfile?.walletBalance || 0;
    employerName = employer?.businessProfile?.companyName || 'Employer';
  } else {
    balance = user.walletBalance || 0;
  }

  const handlePayment = async () => {
    if (balance < fare && !isEmployee) {
      alert("Insufficient funds in " + (isBusiness ? "Business Account" : "your OmniWallet") + ".");
      return;
    }
    
    setIsProcessing(true);
    let success = await paymentApi.processRidePayment(user, fare, paymentMethod);

    if (success) {
      setTimeout(() => {
        setIsProcessing(false);
        onConfirm();
      }, 1200);
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-black">Mission Approval</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
        <div className="bg-gray-50 p-8 rounded-[48px] border border-gray-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-3xl shadow-sm border border-gray-100">{ride.icon}</div>
                <div>
                   <h3 className="font-black text-xl text-gray-900">{ride.type}</h3>
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{ride.provider} • 100% Electric</p>
                </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-1">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Road Distance</p>
                 <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-500" />
                    <span className="font-black">{distanceKm.toFixed(1)} KM</span>
                 </div>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-1">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Network Rate</p>
                 <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-black">${kmRate}/KM</span>
                 </div>
              </div>
           </div>

           <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Fare</p>
                 <h2 className="text-5xl font-black tracking-tighter">${fare.toFixed(2)}</h2>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 border border-emerald-100">
                 <ShieldCheck className="w-3 h-3" /> SECURE PRICE
              </div>
           </div>
        </div>

        {isEmployee && (
          <div className="bg-indigo-600 p-6 rounded-[32px] text-white space-y-4 shadow-xl">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><Building2 className="w-5 h-5" /></div>
                <div>
                   <h4 className="font-black text-sm">Corporate Billing Active</h4>
                   <p className="text-[10px] font-bold text-indigo-200 uppercase">{employerName}</p>
                </div>
             </div>
          </div>
        )}

        <div className="grid gap-3 pt-4">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Payment Protocol</h3>
          {isEmployee ? (
            <div className="p-6 bg-gray-50 border-2 border-black rounded-[28px] flex items-center gap-4">
               <Wallet className="w-6 h-6 text-black" />
               <div className="flex-1">
                  <p className="font-black text-sm">Corporate Wallet</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Linked Account Verified</p>
               </div>
               <CheckCircle2 className="w-6 h-6 text-black" />
            </div>
          ) : (
            <>
              <button 
                onClick={() => setPaymentMethod('OmniWallet')}
                className={`p-5 rounded-[28px] border-2 flex items-center gap-4 transition-all ${paymentMethod === 'OmniWallet' ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}
              >
                 <Wallet className="w-6 h-6 text-indigo-600" />
                 <div className="text-left flex-1"><p className="font-black text-sm">OmniWallet</p><p className="text-[10px] text-gray-400 font-bold">Balance: ${balance.toFixed(2)}</p></div>
                 {paymentMethod === 'OmniWallet' && <CheckCircle2 className="w-5 h-5 text-black" />}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 shadow-up">
         <button onClick={handlePayment} disabled={isProcessing} className="w-full py-5 bg-black text-white rounded-[24px] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {isProcessing ? <Loader2 className="animate-spin" /> : <><Zap fill="currentColor" /> {isEmployee ? 'Authorize Dispatch' : 'Secure Booking'}</>}
         </button>
      </div>
    </div>
  );
};

export default BookingCheckout;
