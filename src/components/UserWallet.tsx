
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wallet, Plus, CreditCard, Smartphone, ShieldCheck, History, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle2, ChevronRight, 
  ChevronLeft, Loader2, Landmark, Globe, Zap, AlertTriangle, Receipt,
  Send, User as UserIcon, X
} from 'lucide-react';
import { User, WalletTransaction, PaymentGateway, PaymentHistoryItem } from '../types';
import { omniApi } from '../services/api';
import { paymentApi } from '../services/paymentService';

interface UserWalletProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onClose: () => void;
}

const UserWallet: React.FC<UserWalletProps> = ({ user, onUpdateUser, onClose }) => {
  const [showTopUp, setShowTopUp] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [amount, setAmount] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [method, setMethod] = useState<PaymentGateway>('M-Pesa Express');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactions, setTransactions] = useState<PaymentHistoryItem[]>([]);

  const balance = user.walletBalance || 0;

  useEffect(() => {
    setTransactions(paymentApi.getTransactions());
  }, [success, showTopUp, showTransfer]);

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    omniApi.updateBalance(user.id, numAmount);
    setSuccess(true);
    setIsProcessing(false);
    
    setTimeout(() => {
      setSuccess(false);
      setShowTopUp(false);
      setAmount('');
    }, 2000);
  };

  const handleTransfer = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !targetAddress) return;
    if (numAmount > balance) {
        alert("Insufficient balance for transfer.");
        return;
    }

    setIsProcessing(true);
    const result = await paymentApi.transferFunds(user, targetAddress, numAmount);
    if (result) {
        setSuccess(true);
        setIsProcessing(false);
        setTimeout(() => {
            setSuccess(false);
            setShowTransfer(false);
            setAmount('');
            setTargetAddress('');
        }, 2000);
    } else {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar h-full relative">
      <div className="p-6 space-y-8 max-w-xl mx-auto pb-32">
        <div className="flex justify-between items-center">
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">My Wallet</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Secure Payment Node</p>
           </div>
           <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-gray-100 active:scale-95 transition-all"><ChevronLeft className="w-6 h-6" /></button>
        </div>

        {/* Balance Card */}
        <div className="bg-black text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden group">
           <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 rotate-12 transition-transform group-hover:rotate-45" />
           <div className="relative z-10 space-y-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Current Balance</p>
                 <div className="flex items-baseline gap-2">
                    <h2 className="text-6xl font-black tracking-tighter">${balance.toFixed(2)}</h2>
                    <span className="text-xl font-black opacity-50">USD</span>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setShowTopUp(true)} className="flex-1 py-5 bg-white text-black rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Load Funds
                 </button>
                 <button onClick={() => setShowTransfer(true)} className="flex-1 py-5 bg-white/10 rounded-[28px] font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Transfer
                 </button>
                 <button className="px-8 py-5 bg-white/10 rounded-[28px] font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all">
                    <RefreshCw className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>

        {/* Recent Activity Section */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Recent Activity</h3>
              <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">View Ledger</button>
           </div>
           <div className="grid gap-3">
              {transactions.length === 0 ? (
                <div className="p-10 bg-white rounded-[32px] border border-gray-100 text-center space-y-3">
                   <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <History className="w-6 h-6" />
                   </div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No recent transactions</p>
                </div>
              ) : (
                transactions.slice(0, 8).map(tx => (
                  <div key={tx.id} className="p-5 bg-white rounded-[32px] border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all animate-in slide-in-from-bottom duration-300">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.direction === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-900'}`}>
                        {tx.direction === 'in' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm text-gray-900 truncate">{tx.description}</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                           {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} • {tx.gateway}
                        </p>
                     </div>
                     <div className="text-right shrink-0">
                        <p className={`font-black text-sm ${tx.direction === 'in' ? 'text-emerald-600' : 'text-gray-900'}`}>
                           {tx.direction === 'in' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                        <p className="text-[8px] font-black text-gray-300 uppercase">{tx.status}</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Info Card */}
        <div className="p-6 bg-blue-50 rounded-[40px] border border-blue-100 flex items-start gap-5">
           <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm"><Landmark className="w-5 h-5" /></div>
           <div>
              <h4 className="font-black text-blue-900 text-sm">Escrow Protocol Active</h4>
              <p className="text-xs text-blue-700/70 font-medium leading-relaxed mt-1">Funds for active trips and errands are held in a secure decentralized escrow. Settlement occurs automatically upon mission confirmation.</p>
           </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="bg-white rounded-[56px] p-12 max-w-sm w-full space-y-8 shadow-2xl relative overflow-hidden">
              {success ? (
                <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in">
                   <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 className="w-10 h-10 text-emerald-600" /></div>
                   <h3 className="text-3xl font-black">Success</h3>
                   <p className="text-sm font-bold text-gray-400">Node balance updated via external gateway.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black">Load Funds</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Source</p>
                    </div>
                    <button onClick={() => setShowTopUp(false)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Provider</label>
                        <select value={method} onChange={e => setMethod(e.target.value as any)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none transition-all">
                           <option>M-Pesa Express</option>
                           <option>Stripe</option>
                           <option>PayPal</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Amount (USD)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300">$</span>
                           <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-5 bg-gray-50 rounded-2xl font-black text-2xl border-2 border-transparent focus:border-black outline-none transition-all" />
                        </div>
                     </div>
                  </div>
                  <div className="pt-4 space-y-3">
                     <button onClick={handleTopUp} disabled={!amount || isProcessing} className="w-full py-5 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30">
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Smartphone className="w-4 h-4" /> Initialize STK Push</>}
                     </button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="bg-white rounded-[56px] p-12 max-w-sm w-full space-y-8 shadow-2xl relative overflow-hidden">
              {success ? (
                <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in">
                   <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 className="w-10 h-10 text-blue-600" /></div>
                   <h3 className="text-3xl font-black">Transferred</h3>
                   <p className="text-sm font-bold text-gray-400">Funds deployed to target node address.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black">Send Funds</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Network Node Transfer</p>
                    </div>
                    <button onClick={() => setShowTransfer(false)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Target Node ID / Phone</label>
                        <div className="relative">
                           <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                           <input type="text" placeholder="rid_01 or 0722..." value={targetAddress} onChange={e => setTargetAddress(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none transition-all" />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Amount (USD)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300">$</span>
                           <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-5 bg-gray-50 rounded-2xl font-black text-2xl border-2 border-transparent focus:border-black outline-none transition-all" />
                        </div>
                        <p className="text-[10px] font-bold text-right text-gray-400">Available: ${balance.toFixed(2)}</p>
                     </div>
                  </div>
                  <div className="pt-4 space-y-3">
                     <button onClick={handleTransfer} disabled={!amount || !targetAddress || isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30">
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Confirm Transfer</>}
                     </button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default UserWallet;
