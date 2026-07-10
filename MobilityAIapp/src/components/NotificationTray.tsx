
import React from 'react';
import { Bell, Package, Bike, User, Tag, ShieldCheck, X, Check } from 'lucide-react';
import { Notification } from '../types';

interface NotificationTrayProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NotificationTray: React.FC<NotificationTrayProps> = ({ notifications, onClose, onMarkRead, onMarkAllRead }) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 text-green-500" />;
      case 'rider': return <Bike className="w-5 h-5 text-blue-500" />;
      case 'admin': return <User className="w-5 h-5 text-amber-500" />;
      case 'promo': return <Tag className="w-5 h-5 text-indigo-500" />;
      default: return <ShieldCheck className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="absolute inset-0 z-[160] bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-gray-900">Notifications</h2>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <Bell className="w-10 h-10" />
            </div>
            <p className="font-bold">No notifications yet</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id}
              onClick={() => onMarkRead(notification.id)}
              className={`
                p-5 rounded-[32px] flex items-start gap-4 transition-all cursor-pointer relative
                ${notification.read ? 'bg-white opacity-70' : 'bg-white shadow-md scale-100 border-2 border-black/5'}
              `}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notification.read ? 'bg-gray-100' : 'bg-gray-50 shadow-inner'}`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-sm text-gray-900 leading-tight">{notification.title}</h4>
                  <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap ml-2">{getTimeAgo(notification.timestamp)}</span>
                </div>
                <p className="text-xs font-medium text-gray-500 leading-relaxed">{notification.message}</p>
              </div>
              {!notification.read && (
                <div className="absolute top-5 right-2 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
         <div className="p-6 bg-indigo-900 rounded-[32px] text-white relative overflow-hidden group">
            <Tag className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12 transition-transform group-hover:rotate-45" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Platform Tip</p>
            <h3 className="text-lg font-black mt-1 leading-tight">Enable system-level<br/>alerts for faster pickups.</h3>
            <button className="mt-4 px-5 py-2.5 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition active:scale-95">
              Adjust Settings
            </button>
         </div>
      </div>
    </div>
  );
};

export default NotificationTray;
