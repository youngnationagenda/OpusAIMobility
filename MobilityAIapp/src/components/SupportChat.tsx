
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Sparkles, Loader2, MessageCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { streamSupportChat } from '../services/geminiService';
import { Message } from '../types';

interface SupportChatProps {
  onClose: () => void;
}

const SupportChat: React.FC<SupportChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'support', text: "Hi! I'm your OpusAIMobility Assistant. How can I help you today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleEscalate = () => {
    setIsEscalated(true);
    setMessages(prev => [...prev, {
      id: 'esc-1',
      sender: 'support',
      text: "Understood. I am connecting you with a specialized help desk agent. Please wait a moment...",
      timestamp: Date.now()
    }]);
    
    // Simulation: Admin responds after a delay
    setTimeout(() => {
       setMessages(prev => [...prev, {
         id: 'adm-1',
         sender: 'admin',
         text: "Hello, this is James from OmniSupport. I've just reviewed your chat with the AI. I can assist you with that refund immediately.",
         timestamp: Date.now()
       }]);
    }, 4000);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (isEscalated) {
      // In escalated mode, we just simulate the admin replying after a short wait
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'admin',
          text: "I'm processing that now. You should see an update in your 'Activity' hub within 5 minutes.",
          timestamp: Date.now()
        }]);
        setIsTyping(false);
      }, 2000);
      return;
    }

    setIsTyping(true);

    const history = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text }));
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, sender: 'support', text: '', timestamp: Date.now() }]);

    streamSupportChat(
      input,
      history,
      // onChunk — append each delta to the message
      (delta) => setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: m.text + delta } : m)),
      // onDone
      () => setIsTyping(false),
      // onError
      (_err) => {
        setMessages(prev => prev.map(m =>
          m.id === aiMessageId
            ? { ...m, text: "I'm having trouble connecting. Please try again or call our support line." }
            : m
        ));
        setIsTyping(false);
      }
    );
  };

  return (
    <div className="absolute inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-6 h-6" /></button>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${isEscalated ? 'bg-black' : 'bg-indigo-600'}`}>
            {isEscalated ? <ShieldCheck className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-black leading-none text-gray-900">{isEscalated ? 'Official Personnel' : 'OmniAI Assistant'}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{isEscalated ? 'Support Desk Active' : 'Always Online'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-full">
           <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Hybrid Support</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 hide-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] p-4 rounded-[28px] text-sm font-medium shadow-sm transition-all
              ${m.sender === 'user' 
                ? 'bg-black text-white rounded-tr-none' 
                : m.sender === 'admin' 
                  ? 'bg-emerald-600 text-white rounded-tl-none border-2 border-white'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
            `}>
              <div className="flex items-center gap-1.5 mb-1 opacity-50">
                 {m.sender === 'admin' && <ShieldCheck className="w-3 h-3" />}
                 <span className="text-[8px] font-black uppercase tracking-widest">{m.sender === 'admin' ? 'Human Agent' : m.sender === 'support' ? 'AI' : 'You'}</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
              <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-tighter opacity-40 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-[28px] rounded-tl-none border border-gray-100 flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-gray-100 space-y-4 shrink-0">
        {!isEscalated && (
          <button 
            onClick={handleEscalate}
            className="w-full py-2 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-100 transition"
          >
            <AlertCircle className="w-3 h-3" /> Escalate to Human Personnel
          </button>
        )}
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder="Describe your issue..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            className="flex-1 bg-gray-50 p-4 rounded-3xl border-2 border-transparent focus:border-black focus:bg-white outline-none font-bold transition-all placeholder:text-gray-400"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="w-14 h-14 bg-black text-white rounded-3xl flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl disabled:bg-gray-200 disabled:shadow-none disabled:hover:scale-100"
          >
            {isTyping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;
