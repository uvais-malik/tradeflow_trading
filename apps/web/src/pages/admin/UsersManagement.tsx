import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  walletBalance: string;
  createdAt: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const { token } = useAuthStore();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        toast('Failed to fetch users', 'error');
      }
    } catch (err) {
      toast('Error fetching users', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        toast('User role updated', 'success');
        fetchUsers();
      } else {
        toast('Failed to update role', 'error');
      }
    } catch (err) {
      toast('Error updating role', 'error');
    }
  };

  const updateStatus = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) {
        toast(`User ${isActive ? 'activated' : 'suspended'}`, 'success');
        fetchUsers();
      } else {
        toast('Failed to update status', 'error');
      }
    } catch (err) {
      toast('Error updating status', 'error');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Users Management</h2>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="p-4 font-semibold text-gray-300">Name / Email</th>
              <th className="p-4 font-semibold text-gray-300">Role</th>
              <th className="p-4 font-semibold text-gray-300">Balance</th>
              <th className="p-4 font-semibold text-gray-300">Status</th>
              <th className="p-4 font-semibold text-gray-300">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="p-4">
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-sm text-gray-400">{u.email}</div>
                </td>
                <td className="p-4">
                  <select 
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="TRADER">TRADER</option>
                    <option value="PORTFOLIO_MANAGER">PORTFOLIO_MANAGER</option>
                    <option value="RISK_ANALYST">RISK_ANALYST</option>
                    <option value="COMPLIANCE_OFFICER">COMPLIANCE_OFFICER</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="p-4 font-mono">${Number(u.walletBalance).toLocaleString()}</td>
                <td className="p-4">
                  <button 
                    onClick={() => updateStatus(u.id, !u.isActive)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      u.isActive ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/40' : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40'
                    }`}
                  >
                    {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </button>
                </td>
                <td className="p-4 text-gray-400 text-sm">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
