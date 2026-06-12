import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Layers, MapPin, Clock, Plus, Trash2, Edit3, HelpCircle, Check, Info } from 'lucide-react';

interface ParkingLot {
  id: number;
  name: string;
  address: string;
  totalSlots: number;
  availableSlots: number;
  openingTime: string;
  closingTime: string;
}

interface ParkingSlot {
  id: number;
  slotNumber: string;
  slotType: string;
  status: string;
}

export const ManageParkingLots: React.FC = () => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  
  // Lot creation form state
  const [lotName, setLotName] = useState('');
  const [lotAddress, setLotAddress] = useState('');
  const [lotTotalSlots, setLotTotalSlots] = useState(10);
  const [lotOpening, setLotOpening] = useState('08:00');
  const [lotClosing, setLotClosing] = useState('22:00');
  
  // Slot creation form state
  const [slotNumber, setSlotNumber] = useState('');
  const [slotType, setSlotType] = useState('REGULAR');

  const [loading, setLoading] = useState(true);
  const [lotSuccess, setLotSuccess] = useState(false);
  const [slotSuccess, setSlotSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const response = await api.get('/parking-lots');
      setLots(response.data);
    } catch (err) {
      console.error('Failed to load lots', err);
    } finally {
      setLoading(false);
    }
  };

  const selectLot = async (lot: ParkingLot) => {
    setSelectedLot(lot);
    setSlotSuccess(false);
    try {
      const response = await api.get(`/parking-lots/${lot.id}/slots`);
      setSlots(response.data);
    } catch (err) {
      console.error('Failed to load slots', err);
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLotSuccess(false);
    try {
      const payload = {
        name: lotName,
        address: lotAddress,
        totalSlots: lotTotalSlots,
        openingTime: lotOpening + ':00',
        closingTime: lotClosing + ':00',
      };
      const response = await api.post('/parking-lots', payload);
      setLots(prev => [...prev, response.data]);
      
      // Reset lot form
      setLotName('');
      setLotAddress('');
      setLotSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create lot');
    }
  };

  const handleDeleteLot = async (lotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this parking lot? All nested slots and active bookings will be purged.')) return;
    try {
      await api.delete(`/parking-lots/${lotId}`);
      setLots(prev => prev.filter(l => l.id !== lotId));
      if (selectedLot?.id === lotId) setSelectedLot(null);
    } catch (err) {
      alert('Failed to delete parking lot');
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;
    setError(null);
    setSlotSuccess(false);
    try {
      const payload = {
        slotNumber,
        slotType,
        parkingLotId: selectedLot.id,
      };
      const response = await api.post('/slots', payload);
      setSlots(prev => [...prev, response.data]);
      setSlotNumber('');
      setSlotSuccess(true);
      
      // Update lot counter locally
      setSelectedLot(prev => prev ? { ...prev, totalSlots: prev.totalSlots + 1, availableSlots: prev.availableSlots + 1 } : null);
      setLots(prev => prev.map(l => l.id === selectedLot.id ? { ...l, totalSlots: l.totalSlots + 1, availableSlots: l.availableSlots + 1 } : l));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create slot');
    }
  };

  const handleToggleSlotStatus = async (slotId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    try {
      const response = await api.put(`/slots/${slotId}/status?status=${nextStatus}`);
      setSlots(prev => prev.map(s => (s.id === slotId ? response.data : s)));
      
      // Update local lot counter
      const offset = nextStatus === 'AVAILABLE' ? 1 : -1;
      setSelectedLot(prev => prev ? { ...prev, availableSlots: Math.max(0, prev.availableSlots + offset) } : null);
      setLots(prev => prev.map(l => l.id === selectedLot!.id ? { ...l, availableSlots: Math.max(0, l.availableSlots + offset) } : l));
    } catch (err) {
      alert('Failed to update slot status');
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await api.delete(`/slots/${slotId}`);
      setSlots(prev => prev.filter(s => s.id !== slotId));
      
      // Update local counters
      setSelectedLot(prev => prev ? { ...prev, totalSlots: prev.totalSlots - 1, availableSlots: prev.availableSlots - 1 } : null);
      setLots(prev => prev.map(l => l.id === selectedLot!.id ? { ...l, totalSlots: l.totalSlots - 1, availableSlots: l.availableSlots - 1 } : l));
    } catch (err) {
      alert('Failed to delete slot');
    }
  };

  return (
    <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* Left Panel: Lots lists & creation */}
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-5">
          <h3 className="text-lg font-bold text-slate-100">Register New Parking Lot</h3>
          
          {lotSuccess && (
            <p className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              Parking Lot created successfully!
            </p>
          )}

          <form onSubmit={handleCreateLot} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Name *</label>
                <input
                  type="text"
                  value={lotName}
                  onChange={e => setLotName(e.target.value)}
                  placeholder="e.g. Downtown Central"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Total Slot Capacity *</label>
                <input
                  type="number"
                  value={lotTotalSlots}
                  onChange={e => setLotTotalSlots(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Address *</label>
              <input
                type="text"
                value={lotAddress}
                onChange={e => setLotAddress(e.target.value)}
                placeholder="Street address details..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Opening Hour *</label>
                <input
                  type="time"
                  value={lotOpening}
                  onChange={e => setLotOpening(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Closing Hour *</label>
                <input
                  type="time"
                  value={lotClosing}
                  onChange={e => setLotClosing(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow shadow-indigo-600/10 flex items-center justify-center gap-1.5 transition"
            >
              <Plus size={14} /> Create Lot
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Parking Lot Catalog</h3>
          {loading ? (
            <div className="text-center text-xs text-slate-500 py-6">Loading lots...</div>
          ) : (
            lots.map(lot => (
              <div
                key={lot.id}
                onClick={() => selectLot(lot)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex justify-between items-center ${
                  selectedLot?.id === lot.id
                    ? 'bg-indigo-600/10 border-indigo-500/30'
                    : 'glassmorphism hover:bg-slate-800/10'
                }`}
              >
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-200 text-sm">{lot.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin size={11} className="text-slate-550" /> {lot.address}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Clock size={10} /> {lot.openingTime.slice(0, 5)} - {lot.closingTime.slice(0, 5)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-750 text-slate-250">
                    {lot.availableSlots} / {lot.totalSlots} Slots
                  </span>
                  <button
                    onClick={e => handleDeleteLot(lot.id, e)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Slot Details under selected Lot */}
      <div className="space-y-6">
        {selectedLot ? (
          <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">Slots for: {selectedLot.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Manage, add or delete individual parking bays.</p>
            </div>

            {/* Add Slot form */}
            {slotSuccess && (
              <p className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <Check size={12} /> Slot created and synced with waiting list cache.
              </p>
            )}

            <form onSubmit={handleCreateSlot} className="flex gap-4 items-end bg-slate-900/40 p-4 rounded-2xl border border-slate-800/40">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 pl-0.5">Slot Code/Num *</label>
                <input
                  type="text"
                  value={slotNumber}
                  onChange={e => setSlotNumber(e.target.value)}
                  placeholder="e.g. A-101"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 pl-0.5">Slot Class *</label>
                <select
                  value={slotType}
                  onChange={e => setSlotType(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="VIP">VIP Request</option>
                  <option value="ACCESSIBLE">Accessible</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-xs font-bold text-white shadow shadow-indigo-650/15 flex items-center justify-center gap-1 transition"
              >
                <Plus size={13} /> Add Slot
              </button>
            </form>

            {/* Slots List grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Slots Directory</span>
              {slots.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-8">No slots configured in this lot yet.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map(s => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between gap-3 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{s.slotNumber}</p>
                          <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{s.slotType}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSlot(s.id)}
                          className="text-slate-600 hover:text-red-400 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleSlotStatus(s.id, s.status)}
                        className={`w-full py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                          s.status === 'AVAILABLE'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-550/20'
                            : s.status === 'RESERVED'
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-550/20'
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-550/20'
                        }`}
                        title="Click to toggle status"
                      >
                        {s.status}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-96 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs">
            Select a parking lot from the left catalog to configure and manage parking slots.
          </div>
        )}
      </div>
    </div>
  );
};
