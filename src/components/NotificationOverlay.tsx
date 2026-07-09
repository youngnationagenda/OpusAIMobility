
import React, { useEffect, useState } from 'react';
import { MessageSquare, Mail, Bell, CheckCircle2, Package, Bike, User, Tag } from 'lucide-react';
import { Notification } from '../types';

export type NotificationType = 'sms' | 'email' | 'system' | 'order' | 'rider' | 'admin' | 'promo';

interface NotificationOverlayProps {
  message: string;
  title?: string;
  type: NotificationType;
  onClose: () => void;
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ message, title, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const icons = {
    sms: <MessageSquare className="w-5 h-5 text-green-500" />,
    email: <Mail className="w-5 h-5 text-blue-500" />,
    system: <Bell className="w-5 h-5 text-yellow-500" />,
    order: <Package className="w-5 h-5 text-green-600" />,
    rider: <Bike className="w-5 h-5 text-blue-600" />,
    admin: <User className="w-5 h-5 text-amber-500" />,
    promo: <Tag className="w-5 h-5 text-indigo-500" />
  };

  const labels = {
    sms: 'New SMS',
    email: 'New Email',
    system: 'OpusAIMobility',
    order: 'Vendor Update',
    rider: 'Rider Alert',
    admin: 'Admin Message',
    promo: 'Promo Unlock'
  };

  return (
    <div className={`
      fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 transition-all duration-500 ease-in-out
      ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'}
    `}>
      <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-[32px] p-5 flex items-center gap-4 active:scale-95 transition-transform cursor-pointer">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shadow-inner">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{title || labels[type]}</p>
          <p className="text-sm font-bold text-gray-800 leading-tight">{message}</p>
        </div>
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default NotificationOverlay;
