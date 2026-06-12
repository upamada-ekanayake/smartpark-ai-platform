import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Car, Clock, CreditCard, Calendar, CheckCircle2, XCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookingItem {
  id: number;
  bookingReference: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'WAITING';
  slotNumber?: string;
  parkingLotName?: string;
}

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, vehiclesRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/vehicles'),
        ]);
        setBookings(bookingsRes.data);
        setVehicleCount(vehiclesRes.data.length);
      } catch (err) {
        console.error('Failed to fetch user dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const handlePay = async (bookingId: number, amount: number) => {
    try {
      await api.post('/payments', {
        amount: amount,
        paymentMethod: 'CARD',
        bookingId: bookingId,
      });
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'ACTIVE' } : b))
      );
      alert('Payment processed successfully! Your slot status is now active.');
    } catch (err) {
      alert('Payment failed');
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'PENDING');
  const waitingBookings = bookings.filter(b => b.status === 'WAITING');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Loading dashboard metrics...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      {/* Welcome banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/10">
        <h2 className="text-2xl font-bold text-slate-100">Welcome Back, {user?.firstName}!</h2>
        <p className="text-slate-400 text-xs mt-1">Book, pay, and track your vehicle reservations in real-time.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Registered Vehicles</span>
            <p className="text-2xl font-bold">{vehicleCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Car size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Active Bookings</span>
            <p className="text-2xl font-bold">{activeBookings.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Waitlist Requests</span>
            <p className="text-2xl font-bold">{waitingBookings.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-200">Recent Booking Log</h3>
          <Link to="/search" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            New Booking <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pl-2">Reference</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Slot</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No bookings found. Click "New Booking" to search lots.
                  </td>
                </tr>
              ) : (
                bookings.map(booking => (
                  <tr key={booking.id} className="text-slate-300 hover:bg-slate-800/10 transition">
                    <td className="py-3.5 pl-2 font-mono font-bold text-indigo-400">
                      {booking.bookingReference}
                    </td>
                    <td className="py-3.5">{booking.parkingLotName || 'N/A'}</td>
                    <td className="py-3.5">
                      {booking.slotNumber ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-semibold">
                          {booking.slotNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        <span>
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          booking.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : booking.status === 'PENDING'
                            ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                            : booking.status === 'WAITING'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-slate-800 border border-slate-700 text-slate-500'
                        }`}
                      >
                        {booking.status === 'ACTIVE' && <CheckCircle2 size={10} />}
                        {booking.status === 'CANCELLED' && <XCircle size={10} />}
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <div className="flex justify-end gap-2">
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => handlePay(booking.id, 15.0)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1"
                          >
                            <CreditCard size={10} /> Pay
                          </button>
                        )}
                        {(booking.status === 'PENDING' || booking.status === 'WAITING') && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-slate-300 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
