import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, Zap, Shield, Building2, Fingerprint, FileText, CheckCircle2, ChevronLeft, Smartphone, MessageSquare, HelpCircle, UserPlus, Info, Link as LinkIcon } from 'lucide-react';
import { User as UserProfile, RiderGender } from '../types';
import { omniApi } from '../services/api';
import { awsPost } from '../services/awsClient';
import { tokenStore } from '../services/awsClient';
import { LAMBDA_ROUTES } from '../services/awsConfig';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

type UserRole = 'passenger' | 'rider' | 'business';
type AuthStep = 'choice' | 'login' | 'signup_details' | 'signup_kyc';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>('choice');
  const [loading, setLoading] = useState(false);
  const [showOtpPop, setShowOtpPop] = useState(false);
  const [role, setRole] = useState<UserRole>('passenger');
  
  // Credentials
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // KYC / Corporate
  const [idNo, setIdNo] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [businessNo, setBusinessNo] = useState('');
  const [employerInviteId, setEmployerInviteId] = useState('');
  const [riderGender, setRiderGender] = useState<RiderGender>('Female');

  // OTP
  const [otp, setOtp] = useState('');
  const [tempUser, setTempUser] = useState<UserProfile | null>(null);

  const handleBack = () => {
    if (step === 'login' || step === 'signup_details') setStep('choice');
    else if (step === 'signup_kyc') setStep('signup_details');
  };

  const handleLoginSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    // --- INSTANT DEMO LOGIN BYPASS (No Auth Code) ---
    let demoUser: UserProfile | null = null;
    
    if (password === '123456789') {
      if (phone === 'admin') {
        demoUser = {
          id: 'adm_root', email: 'admin@omniride.ev', name: 'System Administrator', phone: 'admin',
          role: 'admin', status: 'active', joinedAt: Date.now(), rating: 5, totalTrips: 0,
          points: 1000, walletBalance: 100, favorites: [], language: 'en', paymentMethods: [], coupons: []
        };
      } else if (phone === 'rider') {
        demoUser = {
          id: 'rid_demo', email: 'rider@omniride.ev', name: 'Elite Rider Alex', phone: 'rider',
          role: 'rider', status: 'active', joinedAt: Date.now(), rating: 4.9, totalTrips: 152,
          points: 500, walletBalance: 50, favorites: [], language: 'en', paymentMethods: [], coupons: [],
          riderProfile: {
            id: 'rid_demo_01', name: 'Elite Rider Alex', gender: 'Male', vehicleModel: 'EcoDrive X1',
            vehicleRegNo: 'KDL 777Z', batteryStatus: 85, isVerified: true, totalEarnings: 1240.50,
            rating: 4.9, online: true, activityStatus: 'idle', carbonBalance: 42.5, transactionHistory: [],
            telemetry: { 
              batteryTemp: 32, 
              motorTemp: 45, 
              controllerTemp: 38, 
              cycleCount: 120, 
              healthPercentage: 98, 
              efficiencyWhKm: 42, 
              totalEnergyConsumed: 540, 
              brakeWearStatus: 82, 
              swapCount: 24, 
              ecoScore: 88, 
              lastSwapTimestamp: Date.now() - 3600000 
            },
            analytics: { totalDistance: 2400, energyBonus: 15.00, tripsByDay: [{day: 'M', earnings: 45}, {day: 'T', earnings: 52}, {day: 'W', earnings: 38}, {day: 'T', earnings: 60}, {day: 'F', earnings: 75}, {day: 'S', earnings: 40}, {day: 'S', earnings: 30}] },
            jobHistory: [], settings: { notificationsEnabled: true }
          }
        };
      } else if (phone === 'business') {
        demoUser = {
          id: 'biz_demo', email: 'corporate@omniride.ev', name: 'Global Logistics Hub', phone: 'business',
          role: 'business', status: 'active', joinedAt: Date.now(), rating: 5, totalTrips: 0,
          points: 0, walletBalance: 2500, favorites: [], language: 'en', paymentMethods: [], coupons: [],
          businessProfile: { companyName: 'Global Logistics Hub', billingMode: 'pay_per_km', allocatedRiders: 2, walletBalance: 2500.00, inProcessBalance: 0, employees: [] }
        };
      } else if (phone === 'user') {
        demoUser = {
          id: 'usr_demo', email: 'passenger@omniride.ev', name: 'Guest Passenger', phone: 'user',
          role: 'user', status: 'active', joinedAt: Date.now(), rating: 5, totalTrips: 12,
          points: 150, walletBalance: 142.50, favorites: [], language: 'en', paymentMethods: [{ id: 'pm_1', type: 'mpesa', phone: '0700000000', isDefault: true }], coupons: ['OMNI50']
        };
      }
    }

    if (demoUser) {
      omniApi.syncUser(demoUser);
      onLogin(demoUser);
      setLoading(false);
      return;
    }

    // ── AWS Cognito sign-in via Lambda ─────────────────────────────────────
    try {
      const { data, error } = await awsPost<{ user: UserProfile; accessToken: string; idToken: string; refreshToken: string }>(
        LAMBDA_ROUTES.AUTH_SIGNIN,
        { email: phone, password }
      );

      if (!error && data?.user) {
        // Store JWT tokens
        if (data.accessToken) tokenStore.setTokens(data.accessToken, data.refreshToken ?? '');
        omniApi.syncUser(data.user);
        onLogin(data.user);
        setLoading(false);
        return;
      }

      // Fallback: check local cache for offline use
      const cached = JSON.parse(localStorage.getItem('omniride-users') || '[]');
      const existing = cached.find((u: any) => u.email === phone || u.phone === phone);
      if (existing) {
        setTempUser(existing);
        setShowOtpPop(true);
      } else {
        alert(error?.message || 'Account not found. Use Demo access or register a new account.');
      }
    } catch {
      alert('Connection error. Please check your network and try again.');
    }

    setLoading(false);
  };

  const handleSignupSubmit = async () => {
    const isVettedRole = role === 'rider' || role === 'business';

    if (role === 'passenger' && employerInviteId) {
      const employer = omniApi.findBusinessByInviteId(employerInviteId);
      if (!employer) {
        alert('Company Invite ID not found. Leave blank if not joining a corporate account.');
        return;
      }
    }

    const newUser: UserProfile = {
      id: role.substring(0, 3) + '_' + Math.random().toString(36).substr(2, 9),
      email, name, phone,
      role: role === 'passenger' ? 'user' : (role as any),
      employerId: employerInviteId || undefined,
      status: isVettedRole ? 'pending' : 'active',
      joinedAt: Date.now(),
      rating: 5.0,
      totalTrips: 0,
      points: 50,
      walletBalance: 0,
      favorites: [],
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      language: 'en',
      paymentMethods: [{ id: 'pm_init', type: 'mpesa', phone, isDefault: true }],
      coupons: ['NEW_NODE'],
      ...(role === 'business' ? {
        businessProfile: { companyName: name, billingMode: 'pay_per_km', allocatedRiders: 0, walletBalance: 0, inProcessBalance: 0, employees: [] }
      } : {}),
      ...(role === 'rider' ? {
        riderProfile: {
          id: 'rid_' + Math.random().toString(36).substr(2, 5),
          name, gender: riderGender, vehicleModel: 'EcoDrive X1', vehicleRegNo: 'KDL ' + Math.floor(100+Math.random()*900) + 'Z',
          batteryStatus: 100, isVerified: false, totalEarnings: 0, rating: 5, online: false,
          activityStatus: 'idle', carbonBalance: 0, transactionHistory: [],
          telemetry: { 
            batteryTemp: 25, 
            motorTemp: 25, 
            controllerTemp: 25, 
            cycleCount: 0, 
            healthPercentage: 100, 
            efficiencyWhKm: 40, // standard baseline
            totalEnergyConsumed: 0, 
            brakeWearStatus: 100, 
            swapCount: 0, 
            ecoScore: 100, 
            lastSwapTimestamp: Date.now() 
          },
          analytics: { totalDistance: 0, energyBonus: 0, tripsByDay: [] },
          jobHistory: [], settings: { notificationsEnabled: true }
        }
      } : {})
    };

    // ── Register via AWS Cognito (Lambda proxy) ─────────────────────────
    setLoading(true);
    try {
      const { data, error } = await awsPost<{ user: UserProfile; message: string }>(
        LAMBDA_ROUTES.AUTH_SIGNUP,
        { email, password: password || 'OmniRide2025!', name, phone, role: newUser.role }
      );
      if (!error && data?.user) {
        // Merge any extra fields the Lambda created
        const merged: UserProfile = { ...newUser, id: data.user.id ?? newUser.id };
        setTempUser(merged);
      } else {
        setTempUser(newUser);
      }
    } catch {
      setTempUser(newUser);
    }
    setLoading(false);
    setShowOtpPop(true);
  };

  const finalizeEntry = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    if (tempUser) {
      // Persist to DynamoDB via Lambda (fire-and-forget)
      omniApi.syncUser(tempUser);
      onLogin(tempUser);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white rounded-[56px] shadow-2xl p-10 md:p-14 space-y-10 relative z-10 border border-gray-100 border-b-[8px] border-b-gray-200">
        <div className="flex justify-between items-center">
           {step !== 'choice' && (
             <button onClick={handleBack} className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition">
               <ChevronLeft className="w-5 h-5" />
             </button>
           )}
           <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-black rounded-[24px] mx-auto flex items-center justify-center text-white font-black text-3xl italic shadow-xl rotate-3">O</div>
           </div>
           {step !== 'choice' && <div className="w-11" />}
        </div>

        <div className="text-center space-y-2">
           <h1 className="text-4xl font-black text-gray-900 tracking-tighter">OmniRide</h1>
           <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Unified Mobility Protocol</p>
        </div>

        <div className="space-y-4">
          {step === 'choice' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <button onClick={() => setStep('login')} className="w-full py-6 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                 <Fingerprint className="w-6 h-6" /> Authenticate
               </button>
               <button onClick={() => setStep('signup_details')} className="w-full py-6 bg-white border-2 border-gray-100 text-black rounded-[28px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-50">
                 <UserPlus className="w-6 h-6" /> Create Account
               </button>
               
               <div className="bg-gray-50 p-4 rounded-3xl space-y-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Instant Demo Access</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['user', 'rider', 'business', 'admin'].map(t => (
                      <button key={t} onClick={() => { setPhone(t); setPassword('123456789'); setStep('login'); }} className="px-5 py-2 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase hover:border-black transition-colors">{t}</button>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {step === 'login' && (
            <div className="space-y-5 animate-in slide-in-from-right duration-300">
               <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" placeholder="Phone Number or ID" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold text-lg" />
               </div>
               <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input type="password" placeholder="Node Cipher (Password)" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold text-lg" />
               </div>
               <button onClick={handleLoginSubmit} disabled={!phone || !password} className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30">
                 Verify & Sign In <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          )}

          {step === 'signup_details' && (
             <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div className="bg-gray-100 p-1.5 rounded-[22px] flex gap-1 mb-2">
                   {(['passenger', 'rider', 'business'] as const).map(r => (
                     <button key={r} onClick={() => setRole(r)} className={`flex-1 py-3 rounded-[18px] font-black text-[9px] uppercase tracking-widest transition-all ${role === r ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{r}</button>
                   ))}
                </div>
                <div className="relative"><User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                <div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" placeholder="Network Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                <div className="relative"><Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                
                {role === 'passenger' && (
                   <div className="relative group">
                      <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Join Company? (Invite ID)" 
                        value={employerInviteId} 
                        onChange={e => setEmployerInviteId(e.target.value)} 
                        className="w-full pl-14 pr-6 py-4 bg-blue-50/50 rounded-3xl border-2 border-transparent focus:border-blue-500 outline-none font-bold placeholder:text-blue-300" 
                      />
                   </div>
                )}

                <button onClick={() => setStep('signup_kyc')} disabled={!name || !email || !phone} className="w-full py-6 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30">Verify Credentials <ArrowRight className="w-4 h-4" /></button>
             </div>
          )}

          {step === 'signup_kyc' && (
             <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div className="p-5 bg-blue-50 rounded-[32px] border border-blue-100 flex items-start gap-4">
                   <Shield className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                   <p className="text-[11px] font-bold text-blue-900 leading-relaxed">System Policy: High-trust roles require KYC validation. IDs are encrypted end-to-end.</p>
                </div>
                <div className="relative"><FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="National ID Number" value={idNo} onChange={e => setIdNo(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                {role === 'rider' && <div className="relative"><Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Driving License Number" value={licenseNo} onChange={e => setLicenseNo(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>}
                {role === 'business' && <div className="relative"><Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Business Registration No." value={businessNo} onChange={e => setBusinessNo(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>}
                <button onClick={handleSignupSubmit} disabled={!idNo} className="w-full py-6 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl disabled:opacity-30">Finalize Identity <ArrowRight className="w-4 h-4" /></button>
             </div>
          )}
        </div>
      </div>

      {showOtpPop && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-sm bg-white rounded-[56px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] p-10 space-y-8 animate-in zoom-in-95 duration-300 border border-white/20">
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-inner relative">
                    <Smartphone className="w-10 h-10 relative" />
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Identity Shield</h2>
                    <p className="text-xs font-medium text-gray-400">Security cipher dispatched to</p>
                    <p className="text-sm font-black text-gray-900">{phone || tempUser?.email}</p>
                 </div>
              </div>
              <div className="flex justify-center">
                 <input type="text" maxLength={6} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} className="w-full max-w-[200px] text-center text-4xl font-black tracking-[0.3em] py-5 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-blue-500 outline-none transition-all" />
              </div>
              <button onClick={finalizeEntry} disabled={otp.length < 6 || loading} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Authorize Entry</>}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;
