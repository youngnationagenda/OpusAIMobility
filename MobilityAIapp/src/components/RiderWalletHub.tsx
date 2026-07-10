
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, ChevronLeft, ShieldCheck, Zap, Leaf, Activity, Coins, 
  Landmark, ArrowRight, Loader2, CheckCircle2, History, X,
  ArrowRightLeft, TrendingUp, DollarSign, Download, Send, 
  Plus, ChevronDown, ChevronUp, User, Utensils, Package, 
  Bike, Heart, Gift, ShieldAlert, CreditCard, Store, 
  ArrowUpRight, ArrowDownLeft, RefreshCcw, RefreshCw,
  Briefcase, 
  UserCheck, Receipt, Building2, Smartphone, Sparkles, Scale,
  Search, Check, Building, ChevronRight, Calculator, Globe,
  Shield, Timer, AlertTriangle
} from 'lucide-react';
import { RiderProfile, WalletTransaction, PlatformSettings, PaymentHistoryItem } from '../types';
import CarbonWallet from './CarbonWallet';
import InsuranceCenter from './InsuranceCenter';
import { awsPost } from '../services/awsClient';
import { LAMBDA_ROUTES } from '../services/awsConfig';
import { omniApi } from '../services/api';

interface RiderWalletHubProps {
  profile: RiderProfile;
  onUpdateRider: (profile: RiderProfile) => void;
  onClose: () => void;
  riderPhone?: string; 
}

type WalletTab = 'overview' | 'carbon' | 'defi' | 'earnings';
type ActionType = 'withdraw' | 'transfer' | 'load' | 'defi_pay' | null;
type PayFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
type TransMethod = 'mobile' | 'bank' | 'merchant' | 'p2p' | 'card' | 'paypal';

const KENYAN_BANKS = [
  "KCB Bank", "Equity Bank", "NCBA Bank", "Co-operative Bank", "Stanbic Bank",
  "Absa Bank", "Diamond Trust Bank (DTB)", "I&M Bank", "Standard Chartered",
  "Family Bank", "Stanbic Bank", "NIC Bank", "National Bank", "Stanlib"
];

const RiderWalletHub: React.FC<RiderWalletHubProps> = ({ profile, onUpdateRider, onClose, riderPhone = "0712345678" }) => {
  const [activeTab, setActiveTab] = useState<WalletTab>('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  
  // AI Financial States
  const [isCalculating, setIsCalculating] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [billsTotal, setBillsTotal] = useState(0);
  const [auditReasoning, setAuditReasoning] = useState<string[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(omniApi.getPlatformSettings());

  // DeFi Payment States
  const [payFreq, setPayFreq] = useState<PayFrequency>('daily');
  const [customAmount, setCustomAmount] = useState('');

  // Loan status derived for conditional UI
  const hasActiveLoans = useMemo(() => !!(profile.activeAssetLoan || profile.activeInsuranceLoan), [profile]);

  // Transaction States
  const [transStep, setTransStep] = useState(1);
  const [transMethod, setTransMethod] = useState<TransMethod>('mobile');
  const [transAmount, setTransAmount] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [mobileProvider, setMobileProvider] = useState<'M-Pesa' | 'Airtel' | 'T-Kash'>('M-Pesa');
  const [targetPhone, setTargetPhone] = useState(riderPhone);
  const [merchantType, setMerchantType] = useState<'Paybill' | 'Till'>('Till');
  const [merchantNo, setMerchantNo] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  // Aggregate Expenditure Data for the "Payment Out" Portal
  const expenditureStats = useMemo(() => {
    const allTxs: PaymentHistoryItem[] = JSON.parse(localStorage.getItem('opusaimobility-transactions') || '[]');
    const riderTxs = allTxs.filter(t => t.userType === 'rider' && t.direction === 'out');
    
    return {
      withdrawals: riderTxs.filter(t => t.description?.toLowerCase().includes('withdraw') || t.description?.toLowerCase().includes('p2p')).reduce((acc, t) => acc + Math.abs(t.amount), 0),
      repayments: riderTxs.filter(t => t.description?.toLowerCase().includes('loan') || t.description?.toLowerCase().includes('insurance') || t.description?.toLowerCase().includes('defi') || t.description?.toLowerCase().includes('repayment')).reduce((acc, t) => acc + Math.abs(t.amount), 0),
      swaps: riderTxs.filter(t => t.id.startsWith('SWAP-') || t.description?.toLowerCase().includes('swap')).reduce((acc, t) => acc + Math.abs(t.amount), 0),
      recentList: riderTxs.slice(0, 10)
    };
  }, [profile.totalEarnings, profile.transactionHistory.length, activeAction, activeTab]);

  const runFinancialAudit = async () => {
    setIsCalculating(true);
    try {
      const currentSettings = omniApi.getPlatformSettings();
      setPlatformSettings(currentSettings);

      // Financial Audit AI — routed via AWS Lambda
      const { data, error } = await awsPost<{ text: string }>(LAMBDA_ROUTES.AI_GENERATE, {
        prompt: `Financial Audit for EV Rider. Wallet: ${profile.totalEarnings.toFixed(2)}, AssetLoan daily: ${(profile.activeAssetLoan?.dailyRepayment ?? 0).toFixed(2)}, InsuranceLoan daily: ${(profile.activeInsuranceLoan?.dailyRepayment ?? 0).toFixed(2)}, SystemFee: ${currentSettings.systemWeeklyFee}. Calculate total bills due (DeFi first-charge). Return JSON: { billsTotal: number, availableBalance: number, breakdown: string[] }`,
        responseFormat: 'json',
      });
      if (!error && data?.text) {
        const result = JSON.parse(data.text);
        setBillsTotal(result.billsTotal);
        setAvailableBalance(Math.max(0, result.availableBalance));
        setAuditReasoning(result.breakdown);
      } else throw new Error();
    } catch (error) {
      const fallbackBills = (profile.activeAssetLoan?.dailyRepayment || 0) + (profile.activeInsuranceLoan?.dailyRepayment || 0) + 1.42;
      setBillsTotal(fallbackBills);
      setAvailableBalance(Math.max(0, profile.totalEarnings - fallbackBills));
      setAuditReasoning(["Platform Fee ($1.42 Prorated)", "Daily DeFi Repayments"]);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'earnings') runFinancialAudit();
  }, [activeTab]);

  const filteredBanks = useMemo(() => {
    return KENYAN_BANKS.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase()));
  }, [bankSearch]);

  const handleExecuteTransaction = async () => {
    const amt = parseFloat(transAmount) || 0;
    if (amt <= 0) return;

    setIsCalculating(true);
    await new Promise(r => setTimeout(r, 2000)); 
    
    let updatedProfile = { ...profile };

    const isLoad = activeAction === 'load';
    const actionBeforeReset = activeAction;

    if (isLoad) {
      updatedProfile.totalEarnings += amt;
    } else {
      updatedProfile.totalEarnings -= amt;
    }

    const txId = (isLoad ? 'TOP-' : actionBeforeReset === 'withdraw' ? 'WTH-' : 'TXF-') + Date.now();
    const description = isLoad ? `Wallet Load via ${transMethod.toUpperCase()}` : `${actionBeforeReset === 'withdraw' ? 'External Withdrawal' : 'P2P Transfer'} via ${transMethod.toUpperCase()}`;

    // 1. Add to profile history
    updatedProfile.transactionHistory = [
      {
        id: txId,
        type: isLoad ? 'topup' : 'spend',
        asset: 'USD',
        amount: isLoad ? amt : -amt,
        status: 'successful',
        timestamp: Date.now(),
        description
      } as WalletTransaction,
      ...profile.transactionHistory
    ];

    // 2. Add to global ledger (for Money Out categories)
    const globalTxs: PaymentHistoryItem[] = JSON.parse(localStorage.getItem('opusaimobility-transactions') || '[]');
    globalTxs.push({
      id: txId,
      amount: amt,
      currency: 'USD',
      status: 'successful',
      method: transMethod.toUpperCase(),
      gateway: transMethod.toUpperCase() as any,
      timestamp: Date.now(),
      description,
      userType: 'rider',
      direction: isLoad ? 'in' : 'out'
    });
    localStorage.setItem('opusaimobility-transactions', JSON.stringify(globalTxs));

    onUpdateRider(updatedProfile);
    setIsCalculating(false);
    setActiveAction(null);
    setTransStep(1);
    setTransAmount('');
    alert(isLoad ? "Funds Loaded Successfully." : "Transaction Dispatched Successfully to Network Gateway.");
  };

  const handleDeFiPayment = async (finalAmount: number) => {
    if (finalAmount <= 0) return;
    setIsCalculating(true);
    await new Promise(r => setTimeout(r, 2000));
    
    const txId = `DFP-${Date.now()}`;
    const description = `DeFi ${payFreq} Loan Repayment Settlement`;

    // 1. Update Profile (Balance & History)
    const updatedProfile = {
      ...profile,
      totalEarnings: profile.totalEarnings - finalAmount,
      transactionHistory: [
        {
          id: txId,
          type: 'spend',
          asset: 'USD',
          amount: -finalAmount,
          status: 'successful',
          timestamp: Date.now(),
          description
        } as WalletTransaction,
        ...profile.transactionHistory
      ]
    };

    // 2. Add to global Payment History (Crucial for "Money Out" list)
    const globalTxs: PaymentHistoryItem[] = JSON.parse(localStorage.getItem('opusaimobility-transactions') || '[]');
    globalTxs.push({
      id: txId,
      amount: finalAmount,
      currency: 'USD',
      status: 'successful',
      method: 'OmniProtocol',
      gateway: 'OmniWallet',
      timestamp: Date.now(),
      description,
      userType: 'rider',
      direction: 'out'
    });
    localStorage.setItem('opusaimobility-transactions', JSON.stringify(globalTxs));

    // 3. Update Platform Revenue (System maintenance)
    const account = omniApi.getCollectionAccount();
    account.totalCollected += (finalAmount * 0.1); // Small maintenance share
    localStorage.setItem('opusaimobility-collection', JSON.stringify(account));
    
    onUpdateRider(updatedProfile);
    setIsCalculating(false);
    setActiveAction(null);
    setPayFreq('daily');
    setCustomAmount('');
    
    // Refresh audit
    runFinancialAudit();
    alert("DeFi Repayment Protocol Executed Successfully.");
  };

  const renderDeFiPaymentModal = () => {
    const assetDaily = profile.activeAssetLoan?.dailyRepayment || 0;
    const insureDaily = profile.activeInsuranceLoan?.dailyRepayment || 0;
    const dailyTotal = assetDaily + insureDaily;

    const calcAmount = () => {
      if (payFreq === 'daily') return dailyTotal;
      if (payFreq === 'weekly') return dailyTotal * 7;
      if (payFreq === 'monthly') return dailyTotal * 30;
      return parseFloat(customAmount) || 0;
    };

    const finalAmount = calcAmount();
    const canAfford = profile.totalEarnings >= finalAmount;

    return (
      <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-[40px] md:rounded-[56px] w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
          <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between bg-emerald-50">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
                   <Coins className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-emerald-900">DeFi Settlement</h3>
                   <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Protocol Repayment</p>
                </div>
             </div>
             <button onClick={() => setActiveAction(null)} className="p-2 hover:bg-emerald-100 rounded-full transition"><X className="w-6 h-6 text-emerald-900" /></button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
             <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-4">
                <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                   <span>Details</span>
                   <span>Due (Daily)</span>
                </div>
                <div className="space-y-3">
                   {profile.activeAssetLoan && (
                     <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2"><Bike className="w-4 h-4 text-emerald-500" /><span className="text-xs font-bold text-gray-700">Asset Loan</span></div>
                        <span className="font-black text-gray-900">${assetDaily.toFixed(2)}</span>
                     </div>
                   )}
                   {profile.activeInsuranceLoan && (
                     <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" /><span className="text-xs font-bold text-gray-700">Insurance</span></div>
                        <span className="font-black text-gray-900">${insureDaily.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Total Daily Instalment</span>
                      <span className="text-xl font-black text-emerald-600">${dailyTotal.toFixed(2)}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Repayment Schedule</p>
                <div className="grid grid-cols-3 gap-2">
                   {(['daily', 'weekly', 'monthly'] as PayFrequency[]).map(f => (
                     <button 
                        key={f} 
                        onClick={() => setPayFreq(f)}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${payFreq === f ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-400 border-gray-50 hover:border-gray-200'}`}
                     >
                        {f}
                     </button>
                   ))}
                </div>
                <button 
                  onClick={() => setPayFreq('custom')}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 flex items-center justify-center gap-2 ${payFreq === 'custom' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-400 border-gray-50'}`}
                >
                   <Calculator className="w-3 h-3" /> Custom Amount
                </button>

                {payFreq === 'custom' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                     <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                           type="number" 
                           value={customAmount} 
                           onChange={e => setCustomAmount(e.target.value)} 
                           placeholder="Enter Preferred Amount" 
                           className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-2xl font-black text-xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                        />
                     </div>
                  </div>
                )}
             </div>

             <div className="pt-4 space-y-4">
                <div className="flex justify-between items-center px-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmation</p>
                   <p className={`text-[10px] font-black uppercase ${canAfford ? 'text-emerald-500' : 'text-red-500'}`}>
                      Wallet Balance: ${profile.totalEarnings.toFixed(2)}
                   </p>
                </div>
                <button 
                   disabled={isCalculating || finalAmount <= 0 || !canAfford}
                   onClick={() => handleDeFiPayment(finalAmount)}
                   className="w-full py-5 bg-emerald-600 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
                >
                   {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Pay ${finalAmount.toFixed(2)} Now</>}
                </button>
                {!canAfford && finalAmount > 0 && (
                  <p className="text-center text-[10px] font-bold text-red-500 animate-pulse">Insufficient wallet funds for this selection.</p>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActionModal = () => {
    if (!activeAction) return null;
    if (activeAction === 'defi_pay') return renderDeFiPaymentModal();

    const isLoad = activeAction === 'load';

    return (
      <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-[40px] md:rounded-[56px] w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
          <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${isLoad ? 'bg-blue-50' : activeAction === 'withdraw' ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                {isLoad ? <Plus className="w-5 h-5 text-blue-600" /> : activeAction === 'withdraw' ? <Download className="w-5 h-5 text-emerald-600" /> : <Send className="w-5 h-5 text-indigo-600" />}
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black capitalize">{activeAction} Funds</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">
                  {isLoad ? 'Deposit to Node' : `Available: $${availableBalance.toFixed(2)}`}
                </p>
              </div>
            </div>
            <button onClick={() => setActiveAction(null)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-6 h-6" /></button>
          </div>

          <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto hide-scrollbar">
            {transStep === 1 ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Select Channel</p>
                <div className="grid gap-3">
                  <button onClick={() => { setTransMethod('mobile'); setTransStep(2); }} className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-black transition-all group text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Smartphone className="w-5 h-5 text-emerald-500" /></div>
                      <div><p className="font-black text-sm">Mobile Money</p><p className="text-[9px] font-bold text-gray-400 uppercase">Kenya Networks (M-Pesa, Airtel, T-Kash)</p></div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                  {isLoad && (
                    <button onClick={() => { setTransMethod('card'); setTransStep(2); }} className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-black transition-all group text-left">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><CreditCard className="w-5 h-5 text-indigo-500" /></div>
                        <div><p className="font-black text-sm">Debit/Credit Card</p><p className="text-[9px] font-bold text-gray-400 uppercase">Visa, Mastercard, Amex</p></div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  )}
                  {isLoad && (
                    <button onClick={() => { setTransMethod('paypal'); setTransStep(2); }} className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-black transition-all group text-left">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Globe className="w-5 h-5 text-blue-500" /></div>
                        <div><p className="font-black text-sm">PayPal</p><p className="text-[9px] font-bold text-gray-400 uppercase">International Settlement</p></div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  )}
                  <button onClick={() => { setTransMethod('bank'); setTransStep(2); }} className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-black transition-all group text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Building className="w-5 h-5 text-slate-500" /></div>
                      <div><p className="font-black text-sm">Bank Transfer</p><p className="text-[9px] font-bold text-gray-400 uppercase">Direct to local bank node</p></div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                  {!isLoad && activeAction === 'transfer' && (
                    <>
                      <button onClick={() => { setTransMethod('merchant'); setTransStep(2); }} className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-black transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Store className="w-5 h-5 text-orange-500" /></div>
                          <div className="text-left"><p className="font-black text-sm">Merchant/Paybill</p><p className="text-[9px] font-bold text-gray-400 uppercase">Settlement or shopping</p></div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </button>
                      <button onClick={() => { setTransMethod('p2p'); setTransStep(2); }} className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-black transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><UserCheck className="w-5 h-5 text-indigo-500" /></div>
                          <div className="text-left"><p className="font-black text-sm">Rider/User P2P</p><p className="text-[9px] font-bold text-gray-400 uppercase">Direct node-to-node transfer</p></div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <button onClick={() => setTransStep(1)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-black transition">
                  <ChevronLeft className="w-4 h-4" /> Change Method
                </button>

                <div className="space-y-5">
                  {transMethod === 'mobile' && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {(['M-Pesa', 'Airtel', 'T-Kash'] as const).map(p => (
                          <button key={p} onClick={() => setMobileProvider(p)} className={`py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${mobileProvider === p ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}>{p}</button>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Phone Number</label>
                        <input type="tel" value={targetPhone} onChange={e => setTargetPhone(e.target.value)} placeholder="07XX XXX XXX" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" />
                        {activeAction === 'withdraw' && <p className="text-[8px] font-bold text-emerald-600 uppercase ml-1">Default: Your Rider Node</p>}
                        {isLoad && <p className="text-[8px] font-bold text-blue-600 uppercase ml-1">Authorization prompt will be sent to this line</p>}
                      </div>
                    </>
                  )}

                  {transMethod === 'card' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Card Number</label>
                         <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input type="text" placeholder="XXXX XXXX XXXX XXXX" value={cardNo} onChange={e => setCardNo(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Expiry</label><input type="text" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" /></div>
                         <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">CVV</label><input type="password" placeholder="XXX" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" /></div>
                      </div>
                    </div>
                  )}

                  {transMethod === 'paypal' && (
                    <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center gap-4">
                       <Globe className="w-8 h-8 text-blue-500" />
                       <p className="text-xs font-bold text-blue-900">You will be redirected to PayPal to authorize the settlement upon clicking confirmation.</p>
                    </div>
                  )}

                  {transMethod === 'bank' && (
                    <>
                      <div className="space-y-1.5 relative">
                         <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Select Bank</label>
                         <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input type="text" placeholder="Search Kenya Banks..." value={bankSearch} onChange={e => { setBankSearch(e.target.value); if(selectedBank) setSelectedBank(''); }} className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm" />
                         </div>
                         {bankSearch && !selectedBank && (
                           <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white rounded-3xl border border-gray-100 shadow-xl max-h-48 overflow-y-auto hide-scrollbar p-2">
                              {filteredBanks.map(b => (
                                <button key={b} onClick={() => { setSelectedBank(b); setBankSearch(b); }} className="w-full p-3 hover:bg-gray-50 rounded-xl text-left font-bold text-sm">{b}</button>
                              ))}
                           </div>
                         )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Branch Name</label><input type="text" value={branchName} onChange={e => setBranchName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                         <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Account Number</label><input type="text" value={accNumber} onChange={(e) => setAccNumber(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                      </div>
                    </>
                  )}

                  {transMethod === 'merchant' && (
                    <>
                      <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
                        {(['Till', 'Paybill'] as const).map(t => (
                          <button key={t} onClick={() => setMerchantType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${merchantType === t ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>{t}</button>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{merchantType} Number</label>
                        <input type="text" value={merchantNo} onChange={e => setMerchantNo(e.target.value)} placeholder="Enter Number" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" />
                      </div>
                    </>
                  )}

                  {transMethod === 'p2p' && (
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Recipient Node ID / Phone</label>
                       <div className="relative">
                          <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input type="text" placeholder="rid_77 or 07XX..." className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" />
                       </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Amount (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                      <input type="number" value={transAmount} onChange={e => setTransAmount(e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-5 bg-gray-50 rounded-3xl text-xl md:text-2xl font-black border-2 border-transparent focus:border-black outline-none" />
                    </div>
                    {!isLoad && <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter ml-1">Estimated Fee: $0.15 Network Gas</p>}
                    {isLoad && <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter ml-1">Deposit is free via selected gateway</p>}
                  </div>
                </div>

                <button 
                  disabled={!transAmount || (!isLoad && parseFloat(transAmount) > availableBalance) || isCalculating}
                  onClick={handleExecuteTransaction}
                  className={`w-full py-5 md:py-6 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 transition-all ${isLoad ? 'bg-blue-600' : 'bg-black'}`}
                >
                  {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {isLoad ? 'Authorize Deposit' : 'Authorize Transaction'}</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEarningPortal = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-32">
       {/* High-Fidelity Header - Responsive */}
       <div className="bg-slate-950 text-white rounded-[40px] md:rounded-[56px] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 pointer-events-none" />
          
          <div className="relative z-10 p-6 md:p-10 space-y-6 md:space-y-10">
             <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Lifetime Gross</p>
                   <h3 className="text-xl md:text-2xl font-black tracking-tighter text-gray-300">
                     ${(profile.totalEarnings * 1.5).toFixed(2)}
                   </h3>
                </div>
                <div className="space-y-1 border-t md:border-t-0 md:border-x border-white/10 pt-4 md:pt-0 md:px-6">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Vault Balance</p>
                   <h3 className="text-xl md:text-2xl font-black tracking-tighter">
                     ${profile.totalEarnings.toFixed(2)}
                   </h3>
                </div>
                <div className="space-y-1 border-t md:border-t-0 pt-4 md:pt-0 text-left md:text-right">
                   <div className="flex items-center gap-2 md:justify-end">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Liquid available</p>
                      <div className="px-2 py-0.5 bg-emerald-500/20 rounded text-[7px] font-black text-emerald-400 border border-emerald-500/20 uppercase">First Charge Active</div>
                   </div>
                   {isCalculating ? (
                     <div className="flex justify-start md:justify-end pt-1"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                   ) : (
                     <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-400 animate-in zoom-in-95 duration-500">
                       ${availableBalance.toFixed(2)}
                     </h3>
                   )}
                </div>
             </div>

             <div className="bg-white/5 rounded-[28px] md:rounded-[32px] p-5 md:p-6 border border-white/5">
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Gemini Audit Engine</span>
                   </div>
                   {isCalculating && <div className="text-[8px] font-black uppercase text-gray-500 animate-pulse">Scanning...</div>}
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                   {!isCalculating ? (
                     <>
                        {auditReasoning.map((item, idx) => (
                          <div key={idx} className="bg-white/10 px-2.5 py-1 rounded-lg md:rounded-xl flex items-center gap-1.5 border border-white/10">
                             <div className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                             <span className="text-[8px] md:text-[9px] font-bold text-gray-300 uppercase truncate">{item}</span>
                          </div>
                        ))}
                        <div className="bg-emerald-500/20 px-2.5 py-1 rounded-lg md:rounded-xl flex items-center gap-1.5 border border-emerald-500/20">
                           <Scale className="w-3 h-3 text-emerald-400 shrink-0" />
                           <span className="text-[8px] md:text-[9px] font-black text-emerald-400 uppercase">Verified</span>
                        </div>
                     </>
                   ) : (
                     <div className="h-6 w-full bg-white/5 rounded-lg animate-pulse" />
                   )}
                </div>
             </div>
             
             {/* Pay DeFi Now Button - On Earning Portal */}
             {hasActiveLoans && (
               <div className="flex justify-center pt-4 animate-in slide-in-from-top-2 duration-700">
                  <button 
                    onClick={() => { setActiveAction('defi_pay'); setPayFreq('daily'); }}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-500"
                  >
                     <Coins className="w-5 h-5 text-white" /> Pay DeFi Now
                  </button>
               </div>
             )}
          </div>
       </div>

       {/* Priority Reserve Display */}
       <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Protocol Escrow (First Charge)</h3>
             </div>
             <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[9px] font-black text-orange-600 uppercase">Settlement at {platformSettings.deductionTime}</span>
             </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex items-center justify-between">
             <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount Reserved</p>
                <h4 className="text-3xl font-black text-gray-900">${billsTotal.toFixed(2)}</h4>
             </div>
             <div className="text-right">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                   <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
             </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
             <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
             <p className="text-[10px] font-bold text-orange-800 leading-relaxed">
                System policy: Loans and Fees are automatically deducted from the Vault at {platformSettings.deductionTime}. These funds are restricted for withdrawal to ensure node stability.
             </p>
          </div>
       </div>

       {/* Primary Actions */}
       <div className="grid grid-cols-3 gap-2 md:gap-3">
          <button 
            disabled={isCalculating || availableBalance <= 0}
            onClick={() => { setActiveAction('withdraw'); setTransStep(1); }}
            className="flex flex-col items-center gap-2 p-4 md:p-5 bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm hover:border-emerald-500 transition-all group active:scale-95 disabled:opacity-50"
          >
             <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform"><Download className="w-4 h-4 md:w-5 md:h-5" /></div>
             <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 tracking-tighter text-center">Withdraw</span>
          </button>
          <button 
            disabled={isCalculating || availableBalance <= 0}
            onClick={() => { setActiveAction('transfer'); setTransStep(1); }}
            className="flex flex-col items-center gap-2 p-4 md:p-5 bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm hover:border-indigo-500 transition-all group active:scale-95 disabled:opacity-50"
          >
             <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform"><Send className="w-4 h-4 md:w-5 md:h-5" /></div>
             <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 tracking-tighter text-center">Transfer/Pay</span>
          </button>
          <button 
            onClick={() => { setActiveAction('load'); setTransStep(1); }}
            className="flex flex-col items-center gap-2 p-4 md:p-5 bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm hover:border-blue-500 transition-all group active:scale-95"
          >
             <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform"><Plus className="w-4 h-4 md:w-5 md:h-5" /></div>
             <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 tracking-tighter text-center">Load</span>
          </button>
       </div>

       {/* Category Lists - Responsive */}
       <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Income Categories</h3>
          
          {/* 1. Rides Payments */}
          <div className="bg-white rounded-[28px] md:rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
             <button onClick={() => toggleSection('rides')} className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Bike className="w-4 h-4 md:w-5 md:h-5" /></div>
                   <div className="text-left">
                      <p className="font-black text-xs md:text-sm">Rides Payments</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase truncate">Passenger • Corporate Trips</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                   <span className="font-black text-xs md:text-sm text-blue-600">$842.10</span>
                   {expandedSection === 'rides' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
             </button>
             {expandedSection === 'rides' && (
               <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between p-3 bg-white rounded-xl text-[9px] font-bold shadow-sm">
                    <div className="flex items-center gap-2"><Building2 className="w-3 h-3 text-indigo-500" /> <span>Standard Consumer Ride</span></div>
                    <span className="text-emerald-600">+$12.50</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-xl text-[9px] font-bold shadow-sm">
                    <div className="flex items-center gap-2"><Building2 className="w-3 h-3 text-blue-500" /> <span>Truemax Corp Hub</span></div>
                    <span className="text-emerald-600">+$24.50</span>
                  </div>
               </div>
             )}
          </div>

          {/* 2. Logistics Delivery */}
          <div className="bg-white rounded-[28px] md:rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
             <button onClick={() => toggleSection('delivery_income')} className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Package className="w-4 h-4 md:w-5 md:h-5" /></div>
                   <div className="text-left">
                      <p className="font-black text-xs md:text-sm">Logistics Delivery</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Parcels • Document Dispatch</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                   <span className="font-black text-xs md:text-sm text-emerald-600">$412.50</span>
                   {expandedSection === 'delivery_income' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
             </button>
             {expandedSection === 'delivery_income' && (
               <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between p-3 bg-white rounded-xl text-[9px] font-bold shadow-sm">
                    <div className="flex items-center gap-2"><Package className="w-3 h-3 text-emerald-500" /> <span>Parcel ID: DEL-992</span></div>
                    <span className="text-emerald-600">+$8.00</span>
                  </div>
               </div>
             )}
          </div>

          {/* 3. Food Hub Earnings */}
          <div className="bg-white rounded-[28px] md:rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
             <button onClick={() => toggleSection('food_income')} className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Utensils className="w-4 h-4 md:w-5 md:h-5" /></div>
                   <div className="text-left">
                      <p className="font-black text-xs md:text-sm">Food Hub Hub</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Restaurant Deliveries</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                   <span className="font-black text-xs md:text-sm text-orange-600">$215.80</span>
                   {expandedSection === 'food_income' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
             </button>
             {expandedSection === 'food_income' && (
               <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between p-3 bg-white rounded-xl text-[9px] font-bold shadow-sm">
                    <div className="flex items-center gap-2"><Store className="w-3 h-3 text-orange-500" /> <span>Burger Theory Order</span></div>
                    <span className="text-emerald-600">+$4.50</span>
                  </div>
               </div>
             )}
          </div>
       </div>

       <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Payment Out Categories</h3>
          
          {/* Protocol Settlements (Battery Swaps) */}
          <div className="bg-white rounded-[28px] md:rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
             <button onClick={() => toggleSection('swaps_list')} className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><RefreshCw className="w-4 h-4 md:w-5 md:h-5" /></div>
                   <div className="text-left">
                      <p className="font-black text-xs md:text-sm">Protocol Settlements</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Hardware Node Swaps (Handshake)</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                   <span className="font-black text-xs md:text-sm text-blue-600">-${expenditureStats.swaps.toFixed(2)}</span>
                   {expandedSection === 'swaps_list' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
             </button>
             {expandedSection === 'swaps_list' && (
               <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                  {profile.transactionHistory.filter(t => t.id.startsWith('SWAP-') || t.description?.toLowerCase().includes('swap')).length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-4 italic">No swap activity recorded</p>
                  ) : (
                    profile.transactionHistory.filter(t => t.id.startsWith('SWAP-') || t.description?.toLowerCase().includes('swap')).map(tx => (
                      <div key={tx.id} className="flex justify-between p-3 bg-white rounded-xl text-[9px] font-bold shadow-sm">
                         <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-amber-500" /> <span className="truncate">{tx.description}</span></div>
                         <span className="text-red-600 font-black">-${Math.abs(tx.amount).toFixed(2)}</span>
                      </div>
                    ))
                  )}
               </div>
             )}
          </div>

          <div className="bg-white rounded-[28px] md:rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
             <button onClick={() => toggleSection('withdraw_list')} className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Landmark className="w-4 h-4 md:w-5 md:h-5" /></div>
                   <div className="text-left">
                      <p className="font-black text-xs md:text-sm">External Liquidity</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Mobile Money • Bank Withdrawals</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                   <span className="font-black text-xs md:text-sm text-gray-900">-${expenditureStats.withdrawals.toFixed(2)}</span>
                   {expandedSection === 'withdraw_list' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
             </button>
             {expandedSection === 'withdraw_list' && (
               <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                  {profile.transactionHistory.filter(t => t.description?.toLowerCase().includes('withdraw') || t.description?.toLowerCase().includes('p2p')).length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-4 italic">No withdrawal history</p>
                  ) : (
                    profile.transactionHistory.filter(t => t.description?.toLowerCase().includes('withdraw') || t.description?.toLowerCase().includes('p2p')).map(tx => (
                      <div key={tx.id} className="flex justify-between p-3 bg-white rounded-xl text-[9px] font-bold shadow-sm">
                         <div className="flex items-center gap-2"><ArrowDownLeft className="w-3 h-3 text-red-500" /> <span className="truncate">{tx.description}</span></div>
                         <span className="text-red-600 font-black">-${Math.abs(tx.amount).toFixed(2)}</span>
                      </div>
                    ))
                  )}
               </div>
             )}
          </div>

          <div className="bg-white rounded-[28px] md:rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
             <button onClick={() => toggleSection('repayments_list')} className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="p-3 bg-red-50 text-red-600 rounded-xl"><ShieldCheck className="w-4 h-4 md:w-5 md:h-5" /></div>
                   <div className="text-left">
                      <p className="font-black text-xs md:text-sm">DeFi Repayments</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Asset Loan • Insurance Premiums</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                   <span className="font-black text-xs md:text-sm text-red-600">-${expenditureStats.repayments.toFixed(2)}</span>
                   {expandedSection === 'repayments_list' ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
             </button>
             {expandedSection === 'repayments_list' && (
               <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                  {profile.transactionHistory.filter(t => t.description?.toLowerCase().includes('loan') || t.description?.toLowerCase().includes('insurance') || t.description?.toLowerCase().includes('defi') || t.description?.toLowerCase().includes('repayment')).length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-4 italic">No repayment history recorded</p>
                  ) : (
                    profile.transactionHistory.filter(t => t.description?.toLowerCase().includes('loan') || t.description?.toLowerCase().includes('insurance') || t.description?.toLowerCase().includes('defi') || t.description?.toLowerCase().includes('repayment')).map(tx => (
                      <div key={tx.id} className="flex justify-between p-3 bg-white rounded-xl text-[9px] font-bold shadow-sm">
                        <div className="flex items-center gap-2"><RefreshCcw className="w-3 h-3 text-blue-500" /> <span className="truncate">{tx.description}</span></div>
                        <span className="text-red-600">-${Math.abs(tx.amount).toFixed(2)}</span>
                      </div>
                    ))
                  )}
               </div>
             )}
          </div>
       </div>
    </div>
  );

  const renderOverview = () => {
    const assetDaily = profile.activeAssetLoan?.dailyRepayment || 0;
    const insureDaily = profile.activeInsuranceLoan?.dailyRepayment || 0;
    const totalDaily = assetDaily + insureDaily;
    const isPaymentGood = profile.totalEarnings >= totalDaily;

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-32">
         <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[40px] md:rounded-[56px] shadow-2xl relative overflow-hidden group">
            <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 rotate-12 transition-transform group-hover:rotate-45" />
            <div className="relative z-10 space-y-8 md:space-y-10">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Finance Status</p>
                  <div className="flex items-baseline gap-2">
                     <h2 className="text-4xl md:text-6xl font-black tracking-tighter">${profile.totalEarnings.toFixed(2)}</h2>
                     <span className="text-lg md:text-xl font-black opacity-50">USD</span>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button onClick={() => setActiveTab('earnings')} className="py-4 bg-emerald-500 text-black rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><TrendingUp className="w-4 h-4" /> Earning</button>
                  <button onClick={() => setActiveTab('carbon')} className="py-4 bg-white text-black rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><Leaf className="w-4 h-4 text-emerald-500" /> Carbon</button>
                  <button onClick={() => setActiveTab('defi')} className="py-4 bg-emerald-500 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-400/20"><ShieldCheck className="w-4 h-4" /> DeFi</button>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3 md:gap-4">
            {/* 1. Carbon Credits */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm space-y-2 group hover:border-emerald-500 transition-colors">
              <Leaf className="w-6 h-6 text-emerald-500" />
              <h3 className="text-xl md:text-2xl font-black">{profile.carbonBalance.toFixed(1)}</h3>
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Credits</p>
            </div>

            {/* 2. Asset Node (Basic) */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm space-y-2 group hover:border-indigo-500 transition-colors relative overflow-hidden">
              <ShieldCheck className="w-6 h-6 text-indigo-500" />
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {profile.activeAssetLoan ? 'Active' : 'Normal'}
              </h3>
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Asset Node</p>
            </div>

            {/* 3. DeFi Asset Loan - CONDITIONAL */}
            {profile.activeAssetLoan && (
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm space-y-2 group hover:border-emerald-500 transition-colors">
                <Zap className="w-6 h-6 text-amber-500" />
                <div className="space-y-0.5">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900">${assetDaily.toFixed(2)}</h3>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Daily Repayment</p>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isPaymentGood ? 'text-emerald-600' : 'text-red-500'}`}>
                    Status: {isPaymentGood ? 'Good' : 'Bad'}
                  </p>
                </div>
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">DeFi Asset Loan</p>
              </div>
            )}

            {/* 4. Insurance - CONDITIONAL */}
            {profile.activeInsuranceLoan && (
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm space-y-2 group hover:border-blue-500 transition-colors">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
                <div className="space-y-0.5">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900">${insureDaily.toFixed(2)}</h3>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Daily Premium</p>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isPaymentGood ? 'text-emerald-600' : 'text-red-500'}`}>
                    Status: {isPaymentGood ? 'Good' : 'Bad'}
                  </p>
                </div>
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Insurance</p>
              </div>
            )}
         </div>

         {/* Centered Pay DeFi Now Button - CONDITIONAL */}
         {hasActiveLoans && (
           <div className="flex justify-center pt-2">
              <button 
                onClick={() => { setActiveAction('defi_pay'); setPayFreq('daily'); }}
                className="w-full max-w-xs py-5 bg-emerald-600 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-500"
              >
                 <Coins className="w-5 h-5 text-white" /> Pay DeFi Now
              </button>
           </div>
         )}

         <div className="bg-blue-50 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-blue-100 space-y-2">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /><h4 className="font-black text-blue-900 text-xs md:text-sm">Protocol Active</h4></div>
            <p className="text-[10px] md:text-xs text-blue-700 font-medium leading-relaxed">OpusAIMobility Finance Status tracks lifetime earnings and manages electric asset ownership via automated nodes.</p>
         </div>
      </div>
    );
  };

  return (
    <div className="flex-1 h-full bg-gray-50 flex flex-col overflow-hidden animate-in slide-in-from-right">
       <div className="p-4 md:p-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => activeTab === 'overview' ? onClose() : setActiveTab('overview')} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition shadow-sm"><ChevronLeft className="w-6 h-6" /></button>
             <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{activeTab === 'earnings' ? 'Earning Portal' : 'Rider Wallet'}</h2>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{activeTab === 'earnings' ? 'Financial Hub' : `ID: ${profile.id}`}</p>
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 md:p-6 hide-scrollbar">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'earnings' && renderEarningPortal()}
          {activeTab === 'carbon' && <CarbonWallet profile={profile} onUpdateProfile={onUpdateRider} onClose={() => setActiveTab('overview')} />}
          {activeTab === 'defi' && <InsuranceCenter profile={profile} onUpdateProfile={onUpdateRider} onClose={() => setActiveTab('overview')} />}
       </div>

       {/* Render modas at root level for consistent overlay behavior */}
       {renderActionModal()}
    </div>
  );
};

export default RiderWalletHub;
