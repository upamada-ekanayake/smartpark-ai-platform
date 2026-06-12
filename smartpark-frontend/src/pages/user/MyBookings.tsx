import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface Booking {
  id: number;
  bookingReference: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'WAITING';
  slotNumber?: string;
  parkingLotName?: string;
  vehicleNumber?: string;
}

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'WAITING' | 'PAST'>('ALL');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredBookings = bookings.filter(b => {
    if (filter === 'ACTIVE') return b.status === 'ACTIVE' || b.status === 'PENDING';
    if (filter === 'WAITING') return b.status === 'WAITING';
    if (filter === 'PAST') return b.status === 'COMPLETED' || b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-200">Reservations Directory</h3>
          <p className="text-xs text-slate-400 mt-0.5">Track, pay or cancel your parking requests.</p>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700"
          title="Reload history"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md">
        {(['ALL', 'ACTIVE', 'WAITING', 'PAST'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center text-xs text-slate-500 py-12">Loading booking history...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="h-64 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
          <Calendar size={32} className="text-slate-650" />
          <span className="text-xs">No bookings found in this category.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map(b => (
            <div key={b.id} className="p-5 rounded-2xl glassmorphism border border-slate-800 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reference</span>
                    <p className="text-sm font-mono font-extrabold text-indigo-400">{b.bookingReference}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      b.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : b.status === 'PENDING'
                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                        : b.status === 'WAITING'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {b.status === 'ACTIVE' && <CheckCircle size={10} />}
                    {b.status === 'CANCELLED' && <XCircle size={10} />}
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Location</span>
                    <p className="text-slate-200 font-semibold flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {b.parkingLotName || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Vehicle Plate</span>
                    <p className="text-slate-200 font-semibold">{b.vehicleNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Reserved Time Slot</span>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock size={12} className="text-slate-400" />
                    <span>
                      {new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} -{' '}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {b.slotNumber && (
                  <div className="inline-block px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
                    Slot Allocated: <span className="text-indigo-400 font-extrabold">{b.slotNumber}</span>
                  </div>
                )}
              </div>

              {(b.status === 'PENDING' || b.status === 'WAITING') && (
                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs font-bold border border-slate-700 text-slate-200 transition duration-200"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
