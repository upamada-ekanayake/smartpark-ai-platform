import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, Shield, Calendar, Mail, Phone, RefreshCw } from 'lucide-react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user? All associated vehicles and bookings will be removed.')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: newRole,
      };
      await api.put(`/users/${user.id}`, payload);
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, role: newRole as 'USER' | 'ADMIN' } : u))
      );
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-200">System Users Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure access roles, delete profiles and audits credentials.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-xs text-slate-500 py-12">Loading users data...</div>
      ) : (
        <div className="p-6 rounded-3xl glassmorphism border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Registered On</th>
                  <th className="pb-3 text-center">Security Role</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map(u => (
                  <tr key={u.id} className="text-slate-300 hover:bg-slate-800/5 transition">
                    <td className="py-3.5 pl-2 font-bold text-slate-200">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-3.5 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mail size={12} /> {u.email}
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone size={12} /> {u.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={12} className="text-slate-500" />
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => toggleRole(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                        }`}
                        title="Click to toggle access role"
                      >
                        <Shield size={10} />
                        {u.role}
                      </button>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete user profile"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
