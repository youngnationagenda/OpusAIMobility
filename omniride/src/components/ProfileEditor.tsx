
import React, { useState } from 'react';
import { Camera, X, Check, Loader2, KeyRound, User as UserIcon, ShieldCheck, Lock, Smartphone, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface ProfileEditorProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

type EditorSection = 'main' | 'password' | 'security';

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onSave, onClose }) => {
  const [section, setSection] = useState<EditorSection>('main');
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  
  // Password State
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passSuccess, setPassSuccess] = useState(false);

  const handleSaveProfile = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    onSave({ ...user, name, phone, email });
    setLoading(false);
    onClose();
  };

  const handleChangePassword = async () => {
    if (passwords.next !== passwords.confirm || !passwords.next) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setPassSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setPassSuccess(false);
      setSection('main');
      setPasswords({ current: '', next: '', confirm: '' });
    }, 2000);
  };

  const renderPasswordSection = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setSection('main')} className="p-2 bg-gray-50 rounded-full"><ChevronRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="font-black text-xl">Change Password</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
          <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-black outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
          <input type="password" value={passwords.next} onChange={e => setPasswords({...passwords, next: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-black outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
          <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-black outline-none transition-all" />
        </div>
      </div>

      <button 
        onClick={handleChangePassword}
        disabled={loading || !passwords.next || passwords.next !== passwords.confirm}
        className="w-full py-5 bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : passSuccess ? <Check className="w-5 h-5" /> : 'Update Password'}
      </button>
      {passSuccess && <p className="text-center text-emerald-600 text-xs font-black uppercase">Password updated successfully</p>}
    </div>
  );

  return (
    <div className="absolute inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      <div className="p-6 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-6 h-6" /></button>
        <h2 className="text-xl font-black">{section === 'main' ? 'Edit Profile' : 'Security'}</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar pb-24">
        {section === 'main' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="relative w-32 h-32 mx-auto">
              <img src={user.profilePicture || 'https://i.pravatar.cc/150'} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" alt="Profile" />
              <button className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full shadow-lg border-2 border-white hover:scale-110 transition"><Camera className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all font-bold" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Account Actions</h3>
              <div className="grid gap-3">
                <button onClick={() => setSection('password')} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm"><KeyRound className="w-5 h-5" /></div>
                    <div><p className="font-black text-sm">Update Password</p><p className="text-[10px] text-gray-400 font-bold">Secure your account</p></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <button className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all text-left opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm"><Smartphone className="w-5 h-5" /></div>
                    <div><p className="font-black text-sm">Two-Factor Auth</p><p className="text-[10px] text-gray-400 font-bold">SMS verification enabled</p></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={loading} className="w-full py-5 bg-black text-white rounded-[24px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
               {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Check className="w-6 h-6" /> Save Profile</>}
            </button>
          </div>
        ) : section === 'password' ? (
          renderPasswordSection()
        ) : null}
      </div>
    </div>
  );
};

export default ProfileEditor;
