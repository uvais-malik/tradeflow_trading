import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { BuildingLibraryIcon, UserGroupIcon } from '@heroicons/react/24/outline';


interface Stock {
  id: string;
  symbol: string;
  name: string;
  isRestricted: boolean;
  isTradingHalted: boolean;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function ComplianceDashboard() {
  const queryClient = useQueryClient();

  const { data: stocks = [], isLoading: isLoadingStocks } = useQuery<Stock[]>({
    queryKey: ['complianceStocks'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/compliance/stocks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['complianceUsers'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/compliance/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return axios.put(`${API_URL}/compliance/stocks/${id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complianceStocks'] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return axios.put(`${API_URL}/compliance/users/${id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complianceUsers'] }),
  });

  const toggleHalt = (stock: Stock) => {
    updateStockMutation.mutate({ id: stock.id, data: { isTradingHalted: !stock.isTradingHalted } });
  };

  const toggleRestrict = (stock: Stock) => {
    updateStockMutation.mutate({ id: stock.id, data: { isRestricted: !stock.isRestricted } });
  };

  const toggleUserActive = (user: User) => {
    updateUserMutation.mutate({ id: user.id, data: { isActive: !user.isActive } });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Compliance & Control</h1>
          <p className="text-gray-400 mt-1">Manage trading halts, restricted securities, and KYC status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Securities Master Table */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <BuildingLibraryIcon className="h-6 w-6 mr-2 text-purple-400" />
              Securities Master
            </h2>
          </div>
          
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {isLoadingStocks ? (
              <div className="p-8 text-center text-gray-500">Loading securities...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="bg-gray-800/30 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4 font-medium">Symbol</th>
                    <th className="px-6 py-4 font-medium text-center">Trading Status</th>
                    <th className="px-6 py-4 font-medium text-center">Restricted List</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">{stock.symbol}</div>
                        <div className="text-xs text-gray-400 mt-1">{stock.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleHalt(stock)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                            stock.isTradingHalted
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {stock.isTradingHalted ? 'HALTED' : 'ACTIVE'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleRestrict(stock)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                            stock.isRestricted
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                          }`}
                        >
                          {stock.isRestricted ? 'RESTRICTED' : 'CLEAR'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* KYC & User Management */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-2 text-cyan-400" />
              KYC & Accounts
            </h2>
          </div>
          
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {isLoadingUsers ? (
              <div className="p-8 text-center text-gray-500">Loading users...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="bg-gray-800/30 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium text-right">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{user.fullName}</div>
                        <div className="text-xs text-gray-400 mt-1">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleUserActive(user)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                            user.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                          }`}
                        >
                          {user.isActive ? 'VERIFIED' : 'SUSPENDED (NO KYC)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
