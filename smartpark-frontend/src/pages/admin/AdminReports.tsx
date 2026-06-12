import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, BarChart3, TrendingUp, ShieldCheck, RefreshCw, FileText } from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionReference: string;
  bookingId: number;
}

interface ParkingLot {
  id: number;
  name: string;
  totalSlots: number;
  availableSlots: number;
}

export const AdminReports: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [paymentsRes, lotsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/parking-lots'),
      ]);
      setPayments(paymentsRes.data);
      setLots(lotsRes.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const cardRevenue = payments.filter(p => p.paymentMethod === 'CARD').reduce((sum, p) => sum + Number(p.amount), 0);
  const upiRevenue = payments.filter(p => p.paymentMethod === 'UPI').reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Generating analytics data reports...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-200">Financial Reports & Audits</h2>
          <p className="text-xs text-slate-400 mt-0.5">Audit transaction references, check payment status, and verify occupancy metrics.</p>
        </div>
        <button
          onClick={fetchReports}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl glassmorphism border border-slate-850 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Gross Revenue</span>
            <p className="text-xl font-extrabold text-slate-200">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl glassmorphism border border-slate-850 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Card Payments Gross</span>
            <p className="text-xl font-extrabold text-slate-200">${cardRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl glassmorphism border border-slate-850 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">UPI / Other Gross</span>
            <p className="text-xl font-extrabold text-slate-200">${upiRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Graphs Mock - Lot Occupancy Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 p-6 rounded-3xl glassmorphism border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-400" />
            <h3 className="font-bold text-slate-200">Lot Occupancy Index</h3>
          </div>
          
          <div className="space-y-4 pt-2">
            {lots.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No lots configured for index check.</p>
            ) : (
              lots.map(lot => {
                const occupiedCount = lot.totalSlots - lot.availableSlots;
                const occupancyRate = lot.totalSlots > 0 ? (occupiedCount / lot.totalSlots) * 100 : 0;
                
                return (
                  <div key={lot.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{lot.name}</span>
                      <span className="text-slate-400 font-bold">{occupancyRate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                        style={{ width: `${occupancyRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl glassmorphism border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" />
            <h3 className="font-bold text-slate-200">Transaction Auditing Register</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pl-2">Transaction Ref</th>
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No payments processed yet.
                    </td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id} className="text-slate-350 hover:bg-slate-800/5 transition">
                      <td className="py-3 pl-2 font-mono font-bold text-slate-300">{p.transactionReference}</td>
                      <td className="py-3 font-mono text-indigo-400">#{p.bookingId}</td>
                      <td className="py-3 font-bold uppercase tracking-wider">{p.paymentMethod}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2 font-bold text-slate-250">${Number(p.amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
