import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Unauthorized } from './pages/Unauthorized';

// User pages
import { UserDashboard } from './pages/user/UserDashboard';
import { SearchParking } from './pages/user/SearchParking';
import { MyVehicles } from './pages/user/MyVehicles';
import { MyBookings } from './pages/user/MyBookings';
import { NotificationsPage } from './pages/user/NotificationsPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageUsers } from './pages/admin/ManageUsers';
import { ManageParkingLots } from './pages/admin/ManageParkingLots';
import { ManageBookings } from './pages/admin/ManageBookings';
import { ParkingZones } from './pages/admin/ParkingZones';
import { QrScanner } from './pages/admin/QrScanner';
import { ReportsPanel } from './pages/admin/ReportsPanel';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Syncing secure session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col bg-slate-955 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminRoute: React.FC = () => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

const RoleDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Shared Dashboard layouts */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<RoleDashboard />} />
        
        {/* User Specific Routes */}
        <Route path="/search" element={<SearchParking />} />
        <Route path="/vehicles" element={<MyVehicles />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Admin Specific Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/lots" element={<ManageParkingLots />} />
          <Route path="/admin/bookings" element={<ManageBookings />} />
          <Route path="/admin/reports" element={<ReportsPanel />} />
          <Route path="/admin/zones" element={<ParkingZones />} />
          <Route path="/admin/scanner" element={<QrScanner />} />
        </Route>
      </Route>

      {/* Fallback Redirects */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
