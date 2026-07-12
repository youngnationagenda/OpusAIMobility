
import React, { useState } from 'react';
import { Search, Phone, Mail, ShieldAlert, LifeBuoy, ChevronRight, MessageCircle, HelpCircle, FileText, ExternalLink } from 'lucide-react';
import SupportChat from './SupportChat';

const SupportCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How do I request a refund?", a: "Go to your 'History Hub', select the trip or order, and tap 'Report an Issue' to start a refund claim." },
    { q: "What to do if I left an item in a car?", a: "Contact your driver directly through the trip history for up to 24 hours. After that, contact our 24/7 support desk." },
    { q: "Can I change my destination mid-ride?", a: "Yes, you can edit the destination in the app while the ride is in progress. The price will update automatically." },
    { q: "How are delivery fees calculated?", a: "Fees are based on distance, parcel size, weight, and current platform demand." }
  ].filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()));

  const SupportTile = ({ icon: Icon, title, desc, color, action }: any) => (
    <button 
      onClick={action}
      className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-gray-200 transition-all group text-left w-full"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1">
        <h3 className="font-black text-lg text-gray-900 leading-tight">{title}</h3>
        <p className="text-sm font-medium text-gray-500">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar relative">
      <div className="p-6 space-y-8 max-w-2xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900">Help & Support</h1>
          <p className="text-gray-500 font-medium">How can we assist you today?</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
          <input 
            type="text" 
            placeholder="Search help articles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-3xl border-2 border-transparent focus:border-black shadow-sm outline-none transition-all font-bold"
          />
        </div>

        <div className="grid gap-4">
          <SupportTile 
            icon={MessageCircle} 
            title="Chat with AI Agent" 
            desc="Instant answers for any issue"
            color="bg-indigo-50 text-indigo-600"
            action={() => setShowChat(true)}
          />
          <SupportTile 
            icon={Phone} 
            title="Call Support Desk" 
            desc="Talk to a human agent 24/7"
            color="bg-green-50 text-green-600"
            action={() => window.location.href = 'tel:+1800OPUSAIMOBILITY'}
          />
          <SupportTile 
            icon={ShieldAlert} 
            title="Safety Center" 
            desc="Emergency SOS & trip sharing"
            color="bg-red-50 text-red-600"
            action={() => {}}
          />
        </div>

        <div className="space-y-6 pt-4">
          <h2 className="text-xl font-black text-gray-900 ml-1">Top Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <span className="font-bold text-gray-800 pr-4">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ease-in-out ${expandedFaq === idx ? 'max-h-40 p-5 pt-0 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
           <div className="flex-1 space-y-2 z-10 text-center md:text-left">
              <h2 className="text-2xl font-black leading-tight">Become a Partner</h2>
              <p className="text-sm font-bold text-gray-400">Earn money as a rider, vendor, or mechanic.</p>
              <button className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest mt-2 hover:scale-105 transition">Apply Now</button>
           </div>
           <LifeBuoy className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 rotate-12" />
        </div>

        <div className="flex justify-center gap-6 pb-12">
           <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-black">
              <FileText className="w-3 h-3" /> Privacy Policy
           </button>
           <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-black">
              <HelpCircle className="w-3 h-3" /> Terms of Service
           </button>
        </div>
      </div>

      {showChat && <SupportChat onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default SupportCenter;
