
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Phone, User } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  onClose: () => void;
  driverName: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, driverName }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'driver', text: "Hello! I'm on my way to your pickup location.", timestamp: Date.now() - 60000 }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: Date.now()
    };
    setMessages([...messages, newMessage]);
    setInput('');
    
    // Auto-reply simulation
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now()+1).toString(),
        sender: 'driver',
        text: 'Got it, see you soon!',
        timestamp: Date.now()
      }]);
    }, 2000);
  };

  return (
    <div className="absolute inset-0 z-[120] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-black text-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6" /></button>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-black">
            {driverName[0]}
          </div>
          <div>
            <h3 className="font-black leading-none">{driverName}</h3>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Driving UberX</p>
          </div>
        </div>
        <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition">
          <Phone className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] p-4 rounded-[24px] text-sm font-medium shadow-sm
              ${m.sender === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}
            `}>
              {m.text}
              <p className={`text-[10px] mt-1 opacity-50 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
        <input 
          type="text" 
          placeholder="Send a message..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-gray-100 p-4 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white outline-none font-bold transition-all"
        />
        <button 
          onClick={handleSend}
          className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
