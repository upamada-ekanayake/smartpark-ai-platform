import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { QrCode, ScanLine, CheckCircle2, ShieldAlert, RefreshCw, LogIn, LogOut, Clipboard } from 'lucide-react';

interface ActiveBooking {
  id: number;
  bookingReference: string;
  userEmail: string;
  status: string;
  slotNumber: string;
  parkingLotName: string;
}

export const QrScanner: React.FC = () => {
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [tokens, setTokens] = useState<{ [bookingId: number]: string }>({});
  
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  
  const [scanResult, setScanResult] = useState<{
    status: 'SUCCESS' | 'ERROR';
    type?: 'ENTRANCE' | 'EXIT';
    slotNumber?: string;
    lotName?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetchActiveBookings();
  }, []);

  const fetchActiveBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      // Filter only active or pending bookings
      const active = response.data.filter((b: any) => b.status === 'ACTIVE' || b.status === 'PENDING');
      setActiveBookings(active);

      // Fetch QR tokens for each booking
      for (const booking of active) {
        try {
          const passRes = await api.get(`/qr-passes/booking/${booking.id}`);
          setTokens(prev => ({ ...prev, [booking.id]: passRes.data.passToken }));
        } catch (e) {
          // pass might not exist yet
        }
      }
    } catch (err) {
      console.error('Failed to load active bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (tokenToScan: string) => {
    if (!tokenToScan) return;
    setScanLoading(true);
    setScanResult(null);
    try {
      const response = await api.post(`/qr-passes/scan?token=${tokenToScan}`);
      const scanMessage = response.data.message; // format: "ENTRANCE_SUCCESS:slotNum:lot" or "EXIT_SUCCESS:slotNum:lot"
      
      const parts = scanMessage.split(':');
      const scanType = parts[0] === 'ENTRANCE_SUCCESS' ? 'ENTRANCE' : 'EXIT';
      
      setScanResult({
        status: 'SUCCESS',
        type: scanType,
        slotNumber: parts[1],
        lotName: parts[2],
      });
      
      setTokenInput('');
      fetchActiveBookings(); // refresh active listings
    } catch (err: any) {
      setScanResult({
        status: 'ERROR',
        message: err.response?.data?.message || 'Scanning failed. Invalid pass or status.',
      });
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* Scanner Simulation Panel */}
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ScanLine className="text-indigo-400" /> Security Gate Scanner
            </h3>
            <p className="text-xs text-slate-400 mt-1">Simulate scanning QR passes at entrance and exit check-points.</p>
          </div>

          {/* Simulated Scanner Viewport */}
          <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 flex flex-col items-center justify-center min-h-60 relative overflow-hidden">
            {scanResult ? (
              scanResult.status === 'SUCCESS' ? (
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-200">
                      {scanResult.type === 'ENTRANCE' ? 'Access Granted (Check-In)' : 'Access Granted (Check-Out)'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{scanResult.lotName}</p>
                  </div>
                  <div className="inline-block px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
                    Parking Slot Allocated: <span className="text-indigo-400 font-black">{scanResult.slotNumber}</span>
                  </div>
                  <button
                    onClick={() => setScanResult(null)}
                    className="block mx-auto text-xs text-indigo-400 hover:text-indigo-300 transition font-bold"
                  >
                    Scan Next Pass
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                    <ShieldAlert size={32} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-200">Access Denied</h4>
                    <p className="text-xs text-red-400/80 mt-1.5 px-6 leading-relaxed">{scanResult.message}</p>
                  </div>
                  <button
                    onClick={() => setScanResult(null)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition"
                  >
                    Clear Error & Retry
                  </button>
                </div>
              )
            ) : (
              <div className="text-center space-y-3">
                <QrCode size={48} className="text-slate-650 animate-pulse" />
                <span className="text-xs text-slate-500 block">Simulate scanner active. Enter QR code token below.</span>
              </div>
            )}
          </div>

          {/* Scanner Input */}
          <div className="flex gap-4">
            <input
              type="text"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Paste QR Pass Token (e.g. QRP-...)"
              className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
            />
            <button
              onClick={() => handleScan(tokenInput)}
              disabled={scanLoading || !tokenInput}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow shadow-indigo-600/20 disabled:opacity-40 transition"
            >
              Scan Pass
            </button>
          </div>
        </div>
      </div>

      {/* Helper Panel: Lists active QR passes for copy-pasting */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pl-1">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Passes Directory</h3>
          <button
            onClick={fetchActiveBookings}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-400 transition"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xs text-slate-500 py-12">Loading active tickets...</div>
        ) : activeBookings.length === 0 ? (
          <div className="h-64 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
            <QrCode size={32} className="text-slate-650" />
            <span className="text-xs text-slate-550">No active reservations in the facility.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map(b => {
              const passToken = tokens[b.id];
              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl glassmorphism border border-slate-800 flex justify-between items-center gap-4 hover:border-slate-750 transition duration-200"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-200">{b.bookingReference}</p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          b.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {b.status === 'ACTIVE' ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450">{b.userEmail}</p>
                    {b.slotNumber && (
                      <p className="text-[10px] text-slate-500">
                        Allocated: <span className="font-bold text-slate-300">{b.slotNumber}</span> ({b.parkingLotName})
                      </p>
                    )}
                  </div>
                  {passToken ? (
                    <button
                      onClick={() => handleScan(passToken)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-200 transition flex items-center gap-1.5"
                    >
                      <Clipboard size={12} /> Scan (Auto)
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-550 italic">Generating Qr...</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
