import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';


interface RiskRule {
  id: string;
  name: string;
  ruleType: string;
  value: number | null;
  isActive: boolean;
  createdAt: string;
}

export default function RiskDashboard() {
  const queryClient = useQueryClient();
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState('MAX_EXPOSURE');
  const [newRuleValue, setNewRuleValue] = useState('');

  const { data: rules = [], isLoading } = useQuery<RiskRule[]>({
    queryKey: ['riskRules'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/risk/rules`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (newRule: any) => {
      return axios.post(`${API_URL}/risk/rules`, newRule, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskRules'] });
      setNewRuleName('');
      setNewRuleValue('');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return axios.put(`${API_URL}/risk/rules/${id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskRules'] });
    },
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    createRuleMutation.mutate({
      name: newRuleName,
      ruleType: newRuleType,
      value: newRuleValue ? Number(newRuleValue) : null,
      isActive: true,
    });
  };

  const toggleRule = (id: string, currentStatus: boolean) => {
    updateRuleMutation.mutate({ id, data: { isActive: !currentStatus } });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Risk Management</h1>
          <p className="text-gray-400 mt-1">Configure global trading limits and exposure thresholds.</p>
        </div>
        <div className="flex space-x-4">
          <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <span className="text-sm text-gray-300 font-medium">Risk Engine Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ShieldCheckIcon className="h-6 w-6 mr-2 text-blue-400" />
              Add Risk Rule
            </h2>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g. Max Daily Retail Loss"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rule Type</label>
                <select
                  className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value)}
                >
                  <option value="MAX_EXPOSURE">Max Open Exposure ($)</option>
                  <option value="MAX_DAILY_TRADE_VALUE">Max Daily Trade Value ($)</option>
                  <option value="MAX_QUANTITY">Max Quantity per Order</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Threshold Value</label>
                <input
                  type="number"
                  className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g. 100000"
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              >
                Create Rule
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <ShieldExclamationIcon className="h-6 w-6 mr-2 text-orange-400" />
                Active Global Rules
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading risk rules...</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-800/30 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium text-right">Value Limit</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-200">{rule.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">ID: {rule.id.substring(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {rule.ruleType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-mono text-gray-300">
                            {rule.ruleType.includes('QUANTITY') ? rule.value : `$${Number(rule.value).toLocaleString()}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {rule.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleRule(rule.id, rule.isActive)}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                              rule.isActive 
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                            }`}
                          >
                            {rule.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No risk rules configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
