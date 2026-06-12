import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, User, Car, CheckCircle2, XCircle, Trash2, RefreshCw } from 'lucide-react';

interface Booking {
  id: number;
  bookingReference: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'WAITING';
  userId: number;
  userEmail: string;
  vehicleNumber: string;
  slotNumber?: string;
  parkingLotName?: string;
}

export const ManageBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
      );
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this booking record from DB?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert('Failed to delete booking');
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-200">System Reservations</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cancel, delete, and inspect all system reservations and waitlists.</p>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-xs text-slate-500 py-12">Loading bookings history...</div>
      ) : (
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pl-2">Reference</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3">Schedule</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No bookings logged in the system.
                    </td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.id} className="text-slate-300 hover:bg-slate-800/5 transition">
                      <td className="py-3.5 pl-2 font-mono font-bold text-indigo-455">{b.bookingReference}</td>
                      <td className="py-3.5 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-250">
                          <User size={12} className="text-slate-500" /> {b.userEmail}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-450">
                          <Car size={12} className="text-slate-550" /> {b.vehicleNumber}
                        </div>
                      </td>
                      <td className="py-3.5 space-y-0.5">
                        <p className="font-semibold">{b.parkingLotName || 'N/A'}</p>
                        {b.slotNumber ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-750 text-indigo-400 font-extrabold">
                            Slot {b.slotNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                            Waitlist Request
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} className="text-slate-550" />
                          <span>
                            {new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : b.status === 'PENDING'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : b.status === 'WAITING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 border border-slate-700 text-slate-500'
                          }`}
                        >
                          {b.status === 'ACTIVE' && <CheckCircle2 size={9} />}
                          {b.status === 'CANCELLED' && <XCircle size={9} />}
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <div className="flex justify-end gap-1.5">
                          {(b.status === 'PENDING' || b.status === 'WAITING' || b.status === 'ACTIVE') && (
                            <button
                              onClick={() => handleCancel(b.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-[10px] border border-slate-700 font-bold text-slate-350 transition"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 rounded-lg text-slate-550 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Hard Delete record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
