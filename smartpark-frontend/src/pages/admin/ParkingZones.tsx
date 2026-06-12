import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Layers, MapPin, DollarSign, RefreshCw, Check, Info } from 'lucide-react';

interface ParkingLot {
  id: number;
  name: string;
  address: string;
}

interface ParkingZone {
  id: number;
  name: string;
  zoneType: string;
  pricePerHour: number;
  distanceFromEntrance: number;
  parkingLotId: number;
}

export const ParkingZones: React.FC = () => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('REGULAR');
  const [price, setPrice] = useState('5.00');
  const [distance, setDistance] = useState('30.00');
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const response = await api.get('/parking-lots');
      setLots(response.data);
      if (response.data.length > 0) {
        setSelectedLotId(response.data[0].id.toString());
        fetchZones(response.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch parking lots', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async (lotId: number) => {
    try {
      const response = await api.get(`/zones/lot/${lotId}`);
      setZones(response.data);
    } catch (err) {
      console.error('Failed to fetch zones', err);
    }
  };

  const handleLotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedLotId(id);
    if (id) fetchZones(parseInt(id));
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !zoneName) return;

    setError(null);
    setSuccess(false);

    try {
      const payload = {
        name: zoneName,
        zoneType,
        pricePerHour: parseFloat(price),
        distanceFromEntrance: parseFloat(distance),
        parkingLotId: parseInt(selectedLotId),
      };

      const response = await api.post('/zones', payload);
      setZones(prev => [...prev, response.data]);
      setZoneName('');
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create parking zone');
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this zone? All slots linked to this zone will be deleted.')) return;
    try {
      await api.delete(`/zones/${id}`);
      setZones(prev => prev.filter(z => z.id !== id));
    } catch (err) {
      alert('Failed to delete zone');
    }
  };

  return (
    <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* Left panel: CRUD Form & Lot selector */}
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100">Configure Parking Zone</h3>
            <p className="text-xs text-slate-400 mt-1">Configure layout, distance variables, and zone rates.</p>
          </div>

          {error && (
            <p className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-1.5">
              <Info size={14} /> {error}
            </p>
          )}

          {success && (
            <p className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-1.5">
              <Check size={14} /> Zone configured successfully!
            </p>
          )}

          <form onSubmit={handleAddZone} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-450 pl-0.5">Select Parking Lot *</label>
              <select
                value={selectedLotId}
                onChange={handleLotChange}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none"
              >
                {lots.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-450 pl-0.5">Zone Code/Name *</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  placeholder="e.g. Zone A"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-450 pl-0.5">Zone Type *</label>
                <select
                  value={zoneType}
                  onChange={e => setZoneType(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="STAFF">Staff Only</option>
                  <option value="ACCESSIBLE">Accessible</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-450 pl-0.5">Price Per Hour ($) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-450 pl-0.5">Distance from Entrance (m) *</label>
                <input
                  type="number"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition"
            >
              <Plus size={16} /> Configure Zone
            </button>
          </form>
        </div>
      </div>

      {/* Right panel: Zones list for selected Lot */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pl-1">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Zones Directory</h3>
          <button
            onClick={() => selectedLotId && fetchZones(parseInt(selectedLotId))}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-450 transition"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xs text-slate-500 py-12">Loading parking zones...</div>
        ) : zones.length === 0 ? (
          <div className="h-64 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Layers size={32} className="text-slate-650" />
            <span className="text-xs">No zones configured for this parking lot.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map(zone => (
              <div key={zone.id} className="p-5 rounded-2xl glassmorphism border border-slate-800 flex justify-between items-start gap-4">
                <div className="space-y-2.5">
                  <div>
                    <h4 className="font-bold text-slate-200 text-base">{zone.name}</h4>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-extrabold uppercase tracking-wider">
                      {zone.zoneType}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-0.5 pl-0.5">
                    <p className="flex items-center gap-1.5">
                      <DollarSign size={13} className="text-slate-550" />
                      <span>Rate: <span className="text-slate-200 font-bold">${zone.pricePerHour.toFixed(2)}/hr</span></span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-550" />
                      <span>Entrance Distance: <span className="text-slate-200 font-bold">{zone.distanceFromEntrance}m</span></span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
