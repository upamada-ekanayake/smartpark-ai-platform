import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Layers,
  Calendar,
  DollarSign,
  RefreshCw,
  Clock,
  Car,
  Percent,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface Stats {
  usersCount: number;
  vehiclesCount: number;
  bookingsCount: number;
  activeBookingsCount: number;
  revenueToday: number;
  revenueThisMonth: number;
  occupancyPercentage: number;
  mostPopularLot: string;
  peakBookingHours: string;
}

interface BookingResponse {
  id: number;
  bookingReference: string;
  userEmail: string;
  parkingLotName: string;
  slotNumber: string;
  startTime: string;
  endTime: string;
  status: string;
  bookingDate: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    usersCount: 0,
    vehiclesCount: 0,
    bookingsCount: 0,
    activeBookingsCount: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    occupancyPercentage: 0,
    mostPopularLot: 'N/A',
    peakBookingHours: 'N/A',
  });

  const [recentBookings, setRecentBookings] = useState<BookingResponse[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [lotOccupancy, setLotOccupancy] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<any[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [users, lots, bookings, payments, vehicles, slots] = await Promise.all([
        api.get('/users'),
        api.get('/parking-lots'),
        api.get('/bookings'),
        api.get('/payments'),
        api.get('/vehicles'),
        api.get('/slots'),
      ]);

      const bookingMap = new Map<number, any>(bookings.data.map((b: any) => [b.id, b]));
      
      // Calculate active bookings
      const activeBookingsCount = bookings.data.filter((b: any) => b.status === 'ACTIVE').length;

      // Revenue Calculations
      const todayStr = new Date().toDateString();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let revenueToday = 0;
      let revenueThisMonth = 0;

      payments.data.forEach((p: any) => {
        if (p.paymentStatus !== 'COMPLETED') return;
        const b = bookingMap.get(p.bookingId);
        if (!b) return;
        const d = new Date(b.bookingDate);
        if (d.toDateString() === todayStr) {
          revenueToday += Number(p.amount);
        }
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          revenueThisMonth += Number(p.amount);
        }
      });

      // Facility Occupancy
      const totalSlots = slots.data.length;
      const occupiedSlots = slots.data.filter((s: any) => s.status === 'OCCUPIED' || s.status === 'RESERVED').length;
      const occupancyPercentage = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

      // Most Popular Lot
      const lotCounts: { [name: string]: number } = {};
      bookings.data.forEach((b: any) => {
        if (b.parkingLotName) {
          lotCounts[b.parkingLotName] = (lotCounts[b.parkingLotName] || 0) + 1;
        }
      });
      let mostPopularLot = 'N/A';
      let maxLotBookings = 0;
      Object.entries(lotCounts).forEach(([name, count]) => {
        if (count > maxLotBookings) {
          maxLotBookings = count;
          mostPopularLot = name;
        }
      });

      // Peak Booking Hours
      const hourCounts = Array(24).fill(0);
      bookings.data.forEach((b: any) => {
        if (b.startTime) {
          const hour = new Date(b.startTime).getHours();
          hourCounts[hour]++;
        }
      });
      let peakHour = 0;
      let maxHourBookings = 0;
      hourCounts.forEach((count, hour) => {
        if (count > maxHourBookings) {
          maxHourBookings = count;
          peakHour = hour;
        }
      });
      const peakBookingHours = maxHourBookings > 0 
        ? `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1).toString().padStart(2, '0')}:00`
        : 'N/A';

      setStats({
        usersCount: users.data.length,
        vehiclesCount: vehicles.data.length,
        bookingsCount: bookings.data.length,
        activeBookingsCount,
        revenueToday,
        revenueThisMonth,
        occupancyPercentage,
        mostPopularLot,
        peakBookingHours,
      });

      setRecentBookings(bookings.data.slice(0, 5));

      // 1. Revenue Trend Data
      const revenueByDate: { [date: string]: number } = {};
      payments.data.forEach((p: any) => {
        if (p.paymentStatus !== 'COMPLETED') return;
        const b = bookingMap.get(p.bookingId);
        if (!b) return;
        const dateStr = new Date(b.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
        revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + Number(p.amount);
      });
      const trendData = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7);
      setRevenueTrend(trendData);

      // 2. Lot Occupancy Data
      const occupancyData = lots.data.map((lot: any) => {
        const lotSlots = slots.data.filter((s: any) => s.parkingLotId === lot.id);
        const total = lotSlots.length;
        const occupied = lotSlots.filter((s: any) => s.status === 'OCCUPIED' || s.status === 'RESERVED').length;
        const pct = total > 0 ? (occupied / total) * 100 : 0;
        return {
          name: lot.name,
          Occupancy: Math.round(pct),
        };
      });
      setLotOccupancy(occupancyData);

      // 3. Booking Status Data
      const statusCounts: { [status: string]: number } = {
        ACTIVE: 0,
        PENDING: 0,
        WAITING: 0,
        COMPLETED: 0,
        CANCELLED: 0
      };
      bookings.data.forEach((b: any) => {
        if (statusCounts[b.status] !== undefined) {
          statusCounts[b.status]++;
        }
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value
      })).filter(item => item.value > 0);
      setBookingStatus(statusData);

      // 4. Hourly Traffic Data
      const trafficData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        Bookings: 0
      }));
      bookings.data.forEach((b: any) => {
        if (b.startTime) {
          const hour = new Date(b.startTime).getHours();
          trafficData[hour].Bookings++;
        }
      });
      setHourlyTraffic(trafficData);

    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Syncing admin diagnostics database...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] bg-slate-950">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 font-display">SmartPark Enterprise Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time analytical graphs, bookings monitoring, and parking zones usage.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition border border-slate-800"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Grid Stats - 3x3 layout for 9 required metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Users */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Total Users</span>
            <p className="text-2xl font-extrabold text-slate-100">{stats.usersCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Total Vehicles */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Total Registered Vehicles</span>
            <p className="text-2xl font-extrabold text-slate-100">{stats.vehiclesCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Car size={20} />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Total Bookings Logged</span>
            <p className="text-2xl font-extrabold text-slate-100">{stats.bookingsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>

        {/* Active Bookings */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Active Reservations</span>
            <p className="text-2xl font-extrabold text-emerald-400">{stats.activeBookingsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

        {/* Revenue Today */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Revenue Today</span>
            <p className="text-2xl font-extrabold text-indigo-400">${stats.revenueToday.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Revenue This Month */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Revenue This Month</span>
            <p className="text-2xl font-extrabold text-indigo-300">${stats.revenueThisMonth.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-350 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Parking Occupancy Percentage */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Facility Occupancy Rate</span>
            <p className="text-2xl font-extrabold text-slate-100">{stats.occupancyPercentage.toFixed(1)}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Percent size={20} />
          </div>
        </div>

        {/* Most Popular Parking Lot */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Popular Lot</span>
            <p className="text-base font-extrabold text-amber-400 truncate max-w-[160px]" title={stats.mostPopularLot}>
              {stats.mostPopularLot}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award size={20} />
          </div>
        </div>

        {/* Peak Booking Hours */}
        <div className="p-5 rounded-2xl glassmorphism flex items-center justify-between border border-slate-850 bg-slate-900/20">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Peak Booking Hours</span>
            <p className="text-base font-extrabold text-purple-400">{stats.peakBookingHours}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue Trend */}
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 bg-slate-900/10 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm">Weekly Gross Billings Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lot Occupancy comparison */}
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 bg-slate-900/10 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm">Occupancy Level by Parking Lot</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lotOccupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="Occupancy" fill="#a855f7" radius={[6, 6, 0, 0]} name="Occupancy %">
                  {lotOccupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Peak Traffic Hours */}
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 bg-slate-900/10 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm">24-Hour Booking Density Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyTraffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={3} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="Bookings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Booking Status Allocation */}
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800 bg-slate-900/10 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm">Booking Status Distribution</h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {bookingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend breakdown */}
            <div className="space-y-2 text-xs">
              {bookingStatus.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-400 font-medium">{item.name}:</span>
                  <span className="text-slate-200 font-bold">{item.value} bookings</span>
                </div>
              ))}
              {bookingStatus.length === 0 && (
                <span className="text-slate-500 italic">No bookings logged to distribute.</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bookings log */}
      <div className="p-6 rounded-3xl glassmorphism border border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-200 text-sm">Global Booking Monitoring</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pl-2">Reference</th>
                <th className="pb-3">User Email</th>
                <th className="pb-3">Parking Lot</th>
                <th className="pb-3">Slot Allocated</th>
                <th className="pb-3">Schedule</th>
                <th className="pb-3 text-right pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No bookings logged yet.
                  </td>
                </tr>
              ) : (
                recentBookings.map(b => (
                  <tr key={b.id} className="text-slate-350 hover:bg-slate-800/5 transition">
                    <td className="py-3.5 pl-2 font-mono font-bold text-indigo-400">{b.bookingReference}</td>
                    <td className="py-3.5">{b.userEmail}</td>
                    <td className="py-3.5">{b.parkingLotName || 'N/A'}</td>
                    <td className="py-3.5">
                      {b.slotNumber ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                          {b.slotNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None (Waitlist)</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-500" />
                        <span>
                          {new Date(b.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          b.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : b.status === 'PENDING'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : b.status === 'WAITING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 border border-slate-700 text-slate-500'
                        }`}
                      >
                        {b.status}
                      </span>
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
