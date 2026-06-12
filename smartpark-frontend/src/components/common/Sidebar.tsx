import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Search,
  CalendarRange,
  Users,
  Layers,
  BarChart3,
  Bell,
  MapPin,
  QrCode,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/search', label: 'Search Lots', icon: Search },
    { to: '/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/bookings', label: 'My Bookings', icon: CalendarRange },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/lots', label: 'Manage Lots', icon: Layers },
    { to: '/admin/zones', label: 'Manage Zones', icon: MapPin },
    { to: '/admin/scanner', label: 'Gate Scanner', icon: QrCode },
    { to: '/admin/bookings', label: 'Manage Bookings', icon: CalendarRange },
    { to: '/admin/reports', label: 'View Reports', icon: BarChart3 },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Navigation Menu</p>
        </div>
        <nav className="space-y-1.5">
          {links.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400 shadow-md shadow-indigo-600/5'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 hover:border-slate-800/60'
                  }`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-slate-800/20 border border-slate-800/40 rounded-2xl flex flex-col items-center text-center">
        <p className="text-xs font-bold text-slate-200 mb-1">Need Support?</p>
        <p className="text-[10px] text-slate-400 mb-2">Access our automated guidelines or contact admin.</p>
        <button className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 border border-slate-700 transition">
          Help Desk
        </button>
      </div>
    </aside>
  );
};
