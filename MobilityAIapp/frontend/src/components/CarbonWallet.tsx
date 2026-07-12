
import React, { useState, useMemo } from 'react';
import { 
  Wallet, ChevronLeft, ArrowUpRight, ArrowDownLeft, Zap, Leaf, Activity, 
  ArrowRightLeft, ExternalLink, ShieldCheck, History, TrendingUp, Info,
  RefreshCcw, CheckCircle2, Loader2, Share2, X
} from 'lucide-react';
import { RiderProfile, WalletTransaction } from '../types';
import { blockchainApi } from '../services/blockchainService';

interface CarbonWalletProps {
  onClose: () => void;
  profile: RiderProfile;
  onUpdateProfile: (updated: RiderProfile) => void;
}

const CarbonWallet: React.FC<CarbonWalletProps> = ({ onClose, profile, onUpdateProfile }) => {
  const [isTrading, setIsTrading] = useState(false);
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [showTradeSuccess, setShowTradeSuccess] = useState(false);

  const CARBON_PRICE = 0.50;

  const handleTrade = async () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0 || amount > profile.carbonBalance) return;

    setIsTrading(true);
    try {
      const tx = await blockchainApi.tradeCredits(profile.walletAddress || '0x_default_node', amount);
      const updatedProfile: RiderProfile = {
        ...profile,
        carbonBalance: profile.carbonBalance - amount,
        totalEarnings: profile.totalEarnings + (amount * CARBON_PRICE),
        transactionHistory: [tx, ...profile.transactionHistory]
      };
      onUpdateProfile(updatedProfile);
      setShowTradeSuccess(true);
      setTimeout(() => setShowTradeSuccess(false), 3000);
      setTradeAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTrading(false);
    }
  };

  const stats = useMemo(() => ({
    totalEarned: profile.transactionHistory.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0),
    co2Saved: (profile.transactionHistory.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0) * 0.4).toFixed(1)
  }), [profile.transactionHistory]);

  return (
    <div className="absolute inset-0 z-[200] bg-gray-950 text-white flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      <div className="p-6 bg-gray-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition"><ChevronLeft className="w-6 h-6" /></button>
          <div><h2 className="text-xl font-black tracking-tight">Carbon Node</h2><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Celo Protocol v2</p></div>
        </div>
        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10"><ShieldCheck className="w-6 h-6" /></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar pb-32">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-[48px] shadow-2xl relative overflow-hidden group">
           <Zap className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-45 w-32 h-32" />
           <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Minted Credits</p>
              <div className="flex items-baseline gap-2"><h2 className="text-5xl font-black">{profile.carbonBalance.toFixed(1)}</h2><span className="text-xl font-black opacity-60">CRD</span></div>
              <div className="mt-8 flex gap-3 relative z-10">
                <button onClick={() => setIsTrading(!isTrading)} className="flex-1 py-4 bg-white text-emerald-900 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Trade Credits</button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-gray-900 border border-white/5 p-5 rounded-[32px] space-y-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <h3 className="text-2xl font-black">{stats.co2Saved}kg</h3>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">CO2 Avoided</p>
           </div>
           <div className="bg-gray-900 border border-white/5 p-5 rounded-[32px] space-y-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-2xl font-black">{stats.totalEarned.toFixed(1)}</h3>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Lifetime Total</p>
           </div>
        </div>

        {isTrading && (
          <div className="bg-gray-900 rounded-[40px] border-2 border-emerald-500/30 p-8 space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl">
             <div className="flex justify-between items-center"><h3 className="font-black text-xl">Carbon Market</h3><button onClick={() => setIsTrading(false)} className="text-gray-500"><X className="w-5 h-5" /></button></div>
             <div className="space-y-4">
                <div className="bg-black/40 p-5 rounded-3xl border border-white/5 space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500"><span>Sell</span><span>Bal: {profile.carbonBalance.toFixed(1)}</span></div>
                   <div className="flex justify-between items-center"><input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} placeholder="0.00" className="bg-transparent text-3xl font-black outline-none w-full placeholder:text-gray-800" /><span className="text-emerald-400 font-black">CRD</span></div>
                </div>
                <div className="bg-black/40 p-5 rounded-3xl border border-white/5 space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500"><span>Receive</span><span>Rate: $0.50</span></div>
                   <div className="flex justify-between items-center"><h4 className="text-3xl font-black text-gray-200">{tradeAmount ? (parseFloat(tradeAmount) * CARBON_PRICE).toFixed(2) : '0.00'}</h4><span className="text-blue-400 font-black">USD</span></div>
                </div>
             </div>
             <button onClick={handleTrade} disabled={isTrading && parseFloat(tradeAmount) > 0 ? false : true} className="w-full py-5 bg-emerald-500 text-black rounded-[24px] font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95">
                {isTrading && tradeAmount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Swap"}
             </button>
          </div>
        )}

        <div className="space-y-4">
           <h3 className="font-black text-sm uppercase tracking-widest text-gray-500 flex items-center gap-2 px-2"><History className="w-4 h-4" /> Node Ledger</h3>
           <div className="space-y-3">
              {profile.transactionHistory.map(tx => (
                <div key={tx.id} className="bg-gray-900/40 p-5 rounded-[32px] border border-white/5 flex items-center gap-4 group">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${tx.type === 'earn' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}><Activity className="w-6 h-6" /></div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start"><h4 className="font-black text-sm capitalize">{tx.type}</h4><p className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-blue-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount} {tx.asset}</p></div>
                      <p className="text-[8px] font-black text-gray-600 uppercase mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {showTradeSuccess && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] bg-emerald-500 text-black p-8 rounded-[48px] shadow-2xl text-center space-y-4 animate-in zoom-in">
           <CheckCircle2 className="w-12 h-12 mx-auto" />
           <h3 className="text-2xl font-black">Trade Confirmed</h3>
        </div>
      )}
    </div>
  );
};

export default CarbonWallet;
