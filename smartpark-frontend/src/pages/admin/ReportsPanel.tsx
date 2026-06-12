import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Download, Printer, RefreshCw, BarChart2, Table, Calendar } from 'lucide-react';

interface ReportData {
  period: string;
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageOccupancyRate: number;
  paymentsMethodCount: { [method: string]: number };
}

export const ReportsPanel: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports?period=${period}`);
      setReport(response.data);
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleExportCSV = () => {
    if (!report) return;
    
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'SmartPark AI Audit Report\n';
    csv += `Report Period,${report.period}\n`;
    csv += `Total Bookings,${report.totalBookings}\n`;
    csv += `Completed Bookings,${report.completedBookings}\n`;
    csv += `Cancelled Bookings,${report.cancelledBookings}\n`;
    csv += `Average Occupancy Rate,${report.averageOccupancyRate.toFixed(1)}%\n`;
    csv += `Total Gross Revenue,${report.totalRevenue.toFixed(2)}\n\n`;
    
    csv += 'Payment Methods Breakdown\n';
    Object.entries(report.paymentsMethodCount).forEach(([method, count]) => {
      csv += `${method},${count}\n`;
    });
    
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartpark_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] print:bg-white print:text-black">
      
      {/* Admin header hidden in printing */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-200">Reports and Exports Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">Generate daily, weekly, or monthly financial audits and export spreadsheets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filter Options hidden in printing */}
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 print:hidden">
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === p
                  ? 'bg-indigo-650 text-white shadow shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        {report && (
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Download size={14} /> Export Excel (CSV)
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer size={14} /> Export PDF / Print
            </button>
          </div>
        )}
      </div>

      {/* Report Summary Display */}
      {loading ? (
        <div className="text-center text-xs text-slate-500 py-12 print:hidden">Compiling analytics matrices...</div>
      ) : report ? (
        <div className="space-y-6 print:space-y-4">
          
          {/* Printable Report Header */}
          <div className="hidden print:block text-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-black">SmartPark AI - Operations Audit Report</h1>
            <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toLocaleString()}</p>
            <p className="text-xs font-bold text-indigo-600 mt-0.5">Period: {report.period}</p>
          </div>

          {/* Aggregated Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="p-5 rounded-2xl glassmorphism border border-slate-800/80 print:border print:bg-white print:text-black">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-gray-500">Period Total Revenue</span>
              <p className="text-xl font-extrabold mt-1 text-slate-200 print:text-black">${report.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-5 rounded-2xl glassmorphism border border-slate-800/80 print:border print:bg-white print:text-black">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-gray-500">Total Bookings Logged</span>
              <p className="text-xl font-extrabold mt-1 text-slate-200 print:text-black">{report.totalBookings}</p>
            </div>
            <div className="p-5 rounded-2xl glassmorphism border border-slate-800/80 print:border print:bg-white print:text-black">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-gray-500">Completed Reservations</span>
              <p className="text-xl font-extrabold mt-1 text-emerald-400 print:text-emerald-700">{report.completedBookings}</p>
            </div>
            <div className="p-5 rounded-2xl glassmorphism border border-slate-800/80 print:border print:bg-white print:text-black">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-gray-500">Avg Facility Occupancy</span>
              <p className="text-xl font-extrabold mt-1 text-indigo-400 print:text-indigo-700">{report.averageOccupancyRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Breakdown grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            
            {/* Table breakdown */}
            <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-4 print:border print:bg-white print:text-black">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 print:border-gray-300">
                <Table size={16} className="text-indigo-400 print:text-indigo-700" />
                <h3 className="font-bold text-slate-200 print:text-black">Metrics Summary</h3>
              </div>
              <div className="text-xs space-y-3">
                <div className="flex justify-between pb-1 border-b border-slate-800/60 print:border-gray-200">
                  <span className="text-slate-450 print:text-gray-600">Period Interval</span>
                  <span className="font-bold text-slate-200 print:text-black">{report.period}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800/60 print:border-gray-200">
                  <span className="text-slate-450 print:text-gray-600">Total Bookings</span>
                  <span className="font-bold text-slate-200 print:text-black">{report.totalBookings}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800/60 print:border-gray-200">
                  <span className="text-slate-450 print:text-gray-600">Completed Bookings</span>
                  <span className="font-bold text-slate-200 print:text-black text-emerald-450 print:text-emerald-700">{report.completedBookings}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-800/60 print:border-gray-200">
                  <span className="text-slate-450 print:text-gray-600">Cancelled Bookings</span>
                  <span className="font-bold text-slate-200 print:text-black text-red-400 print:text-red-700">{report.cancelledBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 print:text-gray-600">Gross Billings</span>
                  <span className="font-bold text-slate-200 print:text-black">${report.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment methods breakdown */}
            <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-4 print:border print:bg-white print:text-black">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 print:border-gray-300">
                <BarChart2 size={16} className="text-indigo-400 print:text-indigo-700" />
                <h3 className="font-bold text-slate-200 print:text-black">Transaction Type Volume</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(report.paymentsMethodCount).length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">No payments processed in this period.</p>
                ) : (
                  Object.entries(report.paymentsMethodCount).map(([method, count]) => (
                    <div key={method} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 print:text-gray-600 font-medium">{method} Transactions</span>
                        <span className="text-slate-400 print:text-gray-500 font-bold">{count}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 print:bg-gray-200 overflow-hidden">
                        {/* Calculate simple percent width */}
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full print:bg-indigo-600"
                          style={{ width: `${Math.min(100, (Number(count) / Math.max(1, report.totalBookings)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-slate-500 py-12">Failed to compile reports.</div>
      )}
    </div>
  );
};
export default ReportsPanel;
