
import React, { useState } from 'react';
import { 
  Shield, ChevronLeft, Calendar, DollarSign, ArrowRight, Loader2, 
  CheckCircle2, Info, Lock, Coins, Landmark, Zap, Bike, AlertCircle 
} from 'lucide-react';
import { RiderProfile, InsuranceLoan, AssetLoan } from '../types';
import { defiApi } from '../services/defiService';

interface InsuranceCenterProps {
  profile: RiderProfile;
  onUpdateProfile: (updated: RiderProfile) => void;
  onClose: () => void;
}

const InsuranceCenter: React.FC<InsuranceCenterProps> = ({ profile, onUpdateProfile, onClose }) => {
  const [activeProduct, setActiveProduct] = useState<'none' | 'asset' | 'insure'>('none');
  const [assetMonths, setAssetMonths] = useState(24);
  const [insureType, setInsureType] = useState<'Comprehensive' | 'Third Party'>('Third Party');
  const [insureMonths, setInsureMonths] = useState(12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const assetCalc = defiApi.calculateAssetLoan(assetMonths);
  const insureCalc = defiApi.calculateInsuranceLoan(insureType, insureMonths);

  const handleApplyAsset = async () => {
    setIsProcessing(true);
    try {
      // 1. Disburse Asset Loan
      const assetLoan = await defiApi.requestAssetFunding(assetMonths);
      
      // 2. Automatically activate Comprehensive Insurance financed over 12 months as per requirement
      const autoInsure = await defiApi.requestInsuranceFunding('Comprehensive', 12);
      
      const updated: RiderProfile = {
        ...profile,
        activeAssetLoan: assetLoan,
        activeInsuranceLoan: autoInsure,
        insuranceExpiryDate: Date.now() + (12 * 30 * 24 * 60 * 60 * 1000) // First 12 months
      };
      
      onUpdateProfile(updated);
      setSuccess("Asset Ownership Protocol Engaged. Insurance disbursed automatically.");
      setTimeout(() => { setSuccess(null); setActiveProduct('none'); }, 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyInsure = async () => {
    setIsProcessing(true);
    try {
      const loan = await defiApi.requestInsuranceFunding(insureType, insureMonths);
      const updated: RiderProfile = {
        ...profile,
        activeInsuranceLoan: loan,
        insuranceExpiryDate: Date.now() + (12 * 30 * 24 * 60 * 60 * 1000)
      };
      onUpdateProfile(updated);
      setSuccess(`${insureType} Coverage Active.`);
      setTimeout(() => { setSuccess(null); setActiveProduct('none'); }, 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAssetProduct = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
       <div className="bg-white p-8 rounded-[48px] border border-emerald-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <h3 className="text-2xl font-black leading-tight">Asset-Backed Loan</h3>
                <p className="text-sm font-medium text-gray-500">Finance your professional electric asset.</p>
             </div>
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Bike className="w-6 h-6" /></div>
          </div>

          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase text-gray-400 ml-1">Ownership Window (Months)</p>
             <div className="grid grid-cols-3 gap-2">
                {[12, 18, 24, 30, 36].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setAssetMonths(m)}
                    className={`py-3 rounded-2xl font-black text-xs transition-all ${assetMonths === m ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
                  >
                    {m}M
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-gray-900 text-white p-8 rounded-[36px] space-y-5">
             <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <p className="text-[10px] font-black uppercase text-gray-400">Total Funded</p>
                <h4 className="text-3xl font-black">${assetCalc.totalAmount.toFixed(2)}</h4>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[9px] font-black uppercase text-gray-500">Monthly</p>
                   <p className="text-lg font-black">${assetCalc.monthlyRepayment}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase text-gray-500">Daily Charge</p>
                   <p className="text-lg font-black text-emerald-400">${assetCalc.dailyRepayment}</p>
                </div>
             </div>
             <div className="pt-2">
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">Interest: 10% P.A Fixed</span>
             </div>
          </div>

          <div className="p-5 bg-blue-50 rounded-[28px] border border-blue-100 flex items-start gap-4">
             <Info className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
             <p className="text-[10px] font-bold text-blue-900 leading-relaxed uppercase tracking-tighter">
                AUTOMATION: Asset loans automatically trigger Comprehensive Insurance coverage. First Charge daily deductions apply to wallet.
             </p>
          </div>

          <button 
             onClick={handleApplyAsset}
             disabled={isProcessing || profile.activeAssetLoan ? true : false}
             className="w-full py-5 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
          >
             {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : profile.activeAssetLoan ? 'Asset Already Funded' : 'Authorize Asset Ownership'}
          </button>
       </div>
    </div>
  );

  const renderInsureProduct = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
       <div className="bg-white p-8 rounded-[48px] border border-indigo-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <h3 className="text-2xl font-black leading-tight">DeFiInsure Protocol</h3>
                <p className="text-sm font-medium text-gray-500">Financed protection for your node.</p>
             </div>
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Shield className="w-6 h-6" /></div>
          </div>

          <div className="grid gap-3">
             <p className="text-[10px] font-black uppercase text-gray-400 ml-1">Coverage Tier</p>
             <button 
                onClick={() => setInsureType('Comprehensive')}
                className={`p-5 rounded-[28px] border-2 flex items-center justify-between transition-all ${insureType === 'Comprehensive' ? 'border-black bg-gray-50' : 'border-gray-100 opacity-60'}`}
             >
                <div className="text-left">
                   <p className="font-black text-sm">Comprehensive</p>
                   <p className="text-[9px] font-bold text-gray-400 uppercase">4.5% of Asset Value/Year</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${insureType === 'Comprehensive' ? 'border-black bg-black' : 'border-gray-200'}`}>
                   {insureType === 'Comprehensive' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
             </button>
             <button 
                onClick={() => setInsureType('Third Party')}
                disabled={profile.activeAssetLoan ? true : false}
                className={`p-5 rounded-[28px] border-2 flex items-center justify-between transition-all ${insureType === 'Third Party' ? 'border-black bg-gray-50' : 'border-gray-100 opacity-60'} ${profile.activeAssetLoan ? 'grayscale cursor-not-allowed' : ''}`}
             >
                <div className="text-left">
                   <p className="font-black text-sm">Third Party</p>
                   <p className="text-[9px] font-bold text-gray-400 uppercase">$50.00 Flat/Year</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${insureType === 'Third Party' ? 'border-black bg-black' : 'border-gray-200'}`}>
                   {insureType === 'Third Party' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
             </button>
          </div>

          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase text-gray-400 ml-1">Finance Window (Months)</p>
             <div className="flex gap-2">
                {[3, 6, 12].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setInsureMonths(m)}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${insureMonths === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
                  >
                    {m}M Plan
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-indigo-900 text-white p-8 rounded-[36px] space-y-4">
             <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black uppercase opacity-60">Daily Insurance Charge</span>
                <span className="text-2xl font-black text-emerald-400">${insureCalc.dailyRepayment}</span>
             </div>
             <p className="text-[9px] font-bold text-indigo-300 uppercase leading-relaxed">Repayment at 10% P.A. Financed over {insureMonths} months. Auto-renews every 12 months.</p>
          </div>

          <button 
             onClick={handleApplyInsure}
             disabled={isProcessing || profile.activeInsuranceLoan ? true : false}
             className="w-full py-5 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
          >
             {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : profile.activeInsuranceLoan ? 'Coverage Already Active' : 'Engage Insurance'}
          </button>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
       <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => activeProduct === 'none' ? onClose() : setActiveProduct('none')} 
            className="p-2 bg-white rounded-xl hover:bg-gray-100 transition"
          >
             <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
             <h3 className="font-black text-lg">Omni DeFi Hub</h3>
             <p className="text-[9px] font-black text-indigo-500 uppercase">Product Registry</p>
          </div>
          <div className="w-10" />
       </div>

       {success && (
         <div className="mb-6 p-5 bg-emerald-500 text-black rounded-[32px] flex items-center gap-4 animate-in zoom-in">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <p className="font-black text-xs uppercase leading-tight">{success}</p>
         </div>
       )}

       {activeProduct === 'none' ? (
         <div className="space-y-6">
            <button 
              onClick={() => setActiveProduct('asset')}
              className="w-full p-8 bg-white border-2 border-gray-100 rounded-[48px] text-left group hover:border-emerald-500 transition-all shadow-sm"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[28px] group-hover:scale-110 transition-transform shadow-inner"><Bike className="w-8 h-8" /></div>
                  <span className="bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase">Product A</span>
               </div>
               <h4 className="text-2xl font-black text-gray-900 leading-tight">Asset-Backed DeFi Loan</h4>
               <p className="text-sm font-medium text-gray-400 mt-2">Finance professional electric motorcycles with 10% fixed P.A interest.</p>
               <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  Configure Ownership <ArrowRight className="w-3 h-3" />
               </div>
            </button>

            <button 
               onClick={() => setActiveProduct('insure')}
               className="w-full p-8 bg-white border-2 border-gray-100 rounded-[48px] text-left group hover:border-indigo-500 transition-all shadow-sm"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[28px] group-hover:scale-110 transition-transform shadow-inner"><Shield className="w-8 h-8" /></div>
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Product B</span>
               </div>
               <h4 className="text-2xl font-black text-gray-900 leading-tight">DeFiInsure Coverage</h4>
               <p className="text-sm font-medium text-gray-400 mt-2">Flexible Comprehensive and Third-Party node protection plans.</p>
               <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  Configure Coverage <ArrowRight className="w-3 h-3" />
               </div>
            </button>

            <div className="p-8 bg-slate-900 rounded-[48px] text-white space-y-4">
               <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /><h4 className="font-black uppercase text-xs tracking-widest">Active Obligations</h4></div>
               {profile.activeAssetLoan || profile.activeInsuranceLoan ? (
                 <div className="space-y-3">
                    {profile.activeAssetLoan && (
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                         <div><p className="text-[8px] font-black text-gray-400 uppercase">Asset Loan</p><p className="text-xs font-bold">Node Payment</p></div>
                         <p className="font-black text-emerald-400">${profile.activeAssetLoan.dailyRepayment}/day</p>
                      </div>
                    )}
                    {profile.activeInsuranceLoan && (
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                         <div><p className="text-[8px] font-black text-gray-400 uppercase">DeFiInsure</p><p className="text-xs font-bold">{profile.activeInsuranceLoan.type}</p></div>
                         <p className="font-black text-indigo-400">${profile.activeInsuranceLoan.dailyRepayment}/day</p>
                      </div>
                    )}
                 </div>
               ) : (
                 <p className="text-xs text-gray-500 italic">No active protocol debts.</p>
               )}
            </div>
         </div>
       ) : activeProduct === 'asset' ? (
         renderAssetProduct()
       ) : (
         renderInsureProduct()
       )}
    </div>
  );
};

export default InsuranceCenter;
