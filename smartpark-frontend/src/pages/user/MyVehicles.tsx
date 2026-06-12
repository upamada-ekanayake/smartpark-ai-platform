import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Car, Trash2, Plus, Info, Check } from 'lucide-react';

interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleType: string;
  model: string;
  color: string;
}

export const MyVehicles: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Form state
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber || !vehicleType) {
      setError('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        vehicleNumber,
        vehicleType,
        model,
        color,
        userId: user?.id,
      };
      const response = await api.post('/vehicles', payload);
      setVehicles(prev => [...prev, response.data]);
      
      // Reset form
      setVehicleNumber('');
      setModel('');
      setColor('');
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register vehicle. Check input.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      alert('Failed to delete vehicle');
    }
  };

  return (
    <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* List Panel */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-200 pl-1">My Garage</h3>
        
        {loading ? (
          <div className="text-center text-xs text-slate-500 py-8">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="h-64 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Car size={32} className="text-slate-600" />
            <span className="text-xs">No vehicles registered yet. Create one to enable slot reservations.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map(v => (
              <div key={v.id} className="p-5 rounded-2xl glassmorphism border border-slate-800 flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Car size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{v.vehicleNumber}</p>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{v.vehicleType}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 pl-1.5 space-y-0.5">
                    {v.model && <p><span className="text-slate-500 font-medium">Model:</span> {v.model}</p>}
                    {v.color && <p><span className="text-slate-500 font-medium">Color:</span> {v.color}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Remove vehicle"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Form Panel */}
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100">Add New Vehicle</h3>
            <p className="text-xs text-slate-400 mt-1">Register a vehicle to link slot reservations.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-xs text-red-400">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
              <Check size={16} />
              <span>Vehicle registered successfully!</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 pl-1">License Plate Number *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value)}
                placeholder="e.g. TX-99228"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 pl-1">Vehicle Type *</label>
                <select
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 pl-1">Model Name</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="e.g. Model Y"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 pl-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="e.g. Blue"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Vehicle
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
