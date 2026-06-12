import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, MapPin, Clock, Calendar, Check, AlertTriangle, Inbox } from 'lucide-react';

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
  slotType: 'REGULAR' | 'VIP' | 'ACCESSIBLE';
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
}

interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleType: string;
  model: string;
}

export const SearchParking: React.FC = () => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Booking Form states
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    fetchLots();
    fetchVehicles();
  }, []);

  const fetchLots = async () => {
    try {
      const response = await api.get('/parking-lots');
      setLots(response.data);
    } catch (err) {
      console.error('Failed to fetch parking lots', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
      if (response.data.length > 0) {
        setSelectedVehicle(response.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    }
  };

  const selectLot = async (lot: ParkingLot) => {
    setSelectedLot(lot);
    setSelectedSlot('');
    setMessage(null);
    try {
      const response = await api.get(`/parking-lots/${lot.id}/slots`);
      setSlots(response.data);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;
    if (vehicles.length === 0) {
      setMessage({ type: 'error', text: 'You must register a vehicle in "My Vehicles" before booking!' });
      return;
    }
    if (!startTime || !endTime) {
      setMessage({ type: 'error', text: 'Please fill in start and end times.' });
      return;
    }

    setBookingLoading(true);
    setMessage(null);

    const payload = {
      startTime: new Date(startTime).toISOString().slice(0, 19),
      endTime: new Date(endTime).toISOString().slice(0, 19),
      vehicleId: parseInt(selectedVehicle),
      slotId: selectedSlot ? parseInt(selectedSlot) : null,
      parkingLotId: selectedLot.id,
    };

    try {
      const response = await api.post('/bookings', payload);
      const booking = response.data;
      
      if (booking.status === 'WAITING') {
        setMessage({
          type: 'info',
          text: `Parking lot is full. You have been successfully added to the waiting list! Reference: ${booking.bookingReference}`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `Reservation successful! Slot ${booking.slotNumber} is reserved. Reference: ${booking.bookingReference}. Please pay on Dashboard.`,
        });
      }
      
      // Refresh lot availability and slots list
      fetchLots();
      selectLot(selectedLot);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Booking request failed. Try again.',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredLots = lots.filter(
    lot =>
      lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      {/* Left Panel: Search & Lots list */}
      <div className="space-y-6">
        <div className="p-5 rounded-2xl glassmorphism border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200">Search Parking Lots</h3>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by lot name or address..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-xs text-slate-500 py-8">Loading parking lots...</div>
          ) : filteredLots.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-8 flex flex-col items-center gap-2">
              <Inbox size={24} />
              <span>No parking lots found matching search query.</span>
            </div>
          ) : (
            filteredLots.map(lot => (
              <div
                key={lot.id}
                onClick={() => selectLot(lot)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  selectedLot?.id === lot.id
                    ? 'bg-indigo-600/10 border-indigo-500/30'
                    : 'glassmorphism hover:bg-slate-800/20'
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h4 className="font-bold text-slate-200 text-base">{lot.name}</h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      lot.availableSlots > 0
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {lot.availableSlots} / {lot.totalSlots} Slots
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
                  <MapPin size={12} className="text-slate-500" /> {lot.address}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <Clock size={11} /> {lot.openingTime.slice(0,5)} - {lot.closingTime.slice(0,5)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Slot Booking details */}
      <div className="space-y-6">
        {selectedLot ? (
          <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">{selectedLot.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedLot.address}</p>
            </div>

            {selectedLot.availableSlots === 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Lot Fully Occupied</p>
                  <p className="mt-0.5 leading-relaxed text-slate-300">
                    All slots are booked. Submitting this booking will place you in the waiting list queue. Once a slot is cancelled or freed, it will be automatically allocated to you.
                  </p>
                </div>
              </div>
            )}

            {message && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : message.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <Check size={18} className="shrink-0 mt-0.5" />
                <span className="text-slate-350">{message.text}</span>
              </div>
            )}

            {/* Booking Form */}
            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 pl-1">Select Vehicle *</label>
                {vehicles.length === 0 ? (
                  <p className="text-xs text-red-400 bg-red-500/5 p-2 rounded-xl border border-red-500/10">
                    No vehicles found! Register one in "My Vehicles" first.
                  </p>
                ) : (
                  <select
                    value={selectedVehicle}
                    onChange={e => setSelectedVehicle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} - {v.model} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedLot.availableSlots > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 pl-1">Select Slot (Optional - Auto-assigned if empty)</label>
                  <select
                    value={selectedSlot}
                    onChange={e => setSelectedSlot(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Auto-Assign Available Slot</option>
                    {slots
                      .filter(s => s.status === 'AVAILABLE')
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          Slot {s.slotNumber} ({s.slotType})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 pl-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 pl-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={bookingLoading || vehicles.length === 0}
                className="w-full py-4 mt-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition duration-200 disabled:opacity-40 disabled:pointer-events-none"
              >
                {bookingLoading
                  ? 'Requesting Slot...'
                  : selectedLot.availableSlots === 0
                  ? 'Join Waiting Queue'
                  : 'Reserve Parking Slot'}
              </button>
            </form>
          </div>
        ) : (
          <div className="h-96 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs">
            Select a parking lot from the left list to see available slots and complete reservations.
          </div>
        )}
      </div>
    </div>
  );
};
