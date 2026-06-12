import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notificationType: 'INFO' | 'WARNING' | 'SUCCESS';
  readStatus: boolean;
  createdAt: string;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Establish WebSocket connection
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
    const socket = new SockJS(wsUrl);
    const stompClient = Stomp.over(socket);
    
    // Disable logging noise
    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      stompClient.subscribe('/topic/notifications', () => {
        // Trigger real-time notifications reload
        fetchNotifications();
      });
    }, (error) => {
      console.warn('WebSocket STOMP connection failed. Falling back...', error);
    });

    const interval = setInterval(fetchNotifications, 15000); // Polling fallback

    return () => {
      clearInterval(interval);
      if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {});
      }
    };
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, readStatus: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <header className="sticky top-0 z-40 w-full glassmorphism border-b border-slate-800 px-6 py-4 flex items-center justify-between text-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
          SP
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            SmartPark <span className="text-indigo-400 font-extrabold">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Intelligent System</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition-all duration-200 relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="font-semibold text-sm">Alerts & Messages</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-6">No notifications yet.</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.readStatus && markAsRead(n.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        n.readStatus
                          ? 'bg-slate-900/40 border-slate-850/40 text-slate-400'
                          : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-semibold">{n.title}</span>
                        {!n.readStatus && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-400">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserIcon size={16} />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-200">
              {user?.firstName} {user?.lastName}
            </p>
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2.5 ml-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
