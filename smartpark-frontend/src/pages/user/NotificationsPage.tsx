import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Check, Trash2, Calendar, CheckSquare } from 'lucide-react';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notificationType: 'INFO' | 'WARNING' | 'SUCCESS';
  readStatus: boolean;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, readStatus: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] max-w-4xl mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-200">Alert Center</h3>
          <p className="text-xs text-slate-400 mt-0.5">Stay updated on slot bookings, waitlists and transactions.</p>
        </div>
        {notifications.some(n => !n.readStatus) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-indigo-600/10 hover:text-indigo-400 hover:border-indigo-500/20 text-xs font-bold border border-slate-700 text-slate-300 transition"
          >
            <CheckSquare size={13} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-xs text-slate-500 py-12">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="h-64 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
          <Bell size={32} className="text-slate-650" />
          <span className="text-xs">You have no notifications yet.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.readStatus && markAsRead(n.id)}
              className={`p-5 rounded-2xl border transition-all duration-200 flex gap-4 ${
                n.readStatus
                  ? 'bg-slate-900/20 border-slate-850 text-slate-400'
                  : 'glassmorphism border-slate-800 hover:border-slate-750 text-slate-200 cursor-pointer'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  n.notificationType === 'SUCCESS'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : n.notificationType === 'WARNING'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <Bell size={16} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-sm text-slate-200">{n.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Calendar size={11} />
                    <span>{new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
