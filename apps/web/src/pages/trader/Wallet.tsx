import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, DollarSign } from 'lucide-react';

export default function Wallet() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { data: me, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => (await api.get('/users/me')).data
  });

  const { data: summary } = useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => (await api.get('/portfolio/summary')).data
  });

  const depositMutation = useMutation({
    mutationFn: (amount: number) => api.post('/users/wallet/deposit', { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      toast('Funds successfully deposited into your wallet', 'success');
      setDepositAmount('');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to deposit funds', 'error');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => api.post('/users/wallet/withdraw', { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      toast('Funds successfully withdrawn from your wallet', 'success');
      setWithdrawAmount('');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to withdraw funds', 'error');
    }
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast('Please enter a valid positive amount', 'error');
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast('Please enter a valid positive amount', 'error');
      return;
    }
    withdrawMutation.mutate(amount);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Funding & Wallet</h2>
        <Link to="/dashboard" className="text-sm font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700/50 transition-colors flex items-center gap-2">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Balances Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 p-8 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Available Cash to Trade</p>
            <h2 className="text-4xl font-bold text-slate-100 font-mono">
              {isLoading ? '...' : `$${Number(me?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h2>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <DollarSign className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        <div className="glass-card p-5 p-8 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold text-slate-100 font-mono">
              ${Number(summary?.totalPortfolioValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
            <WalletIcon className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Card */}
        <div className="glass-card p-5 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center space-x-2">
              <ArrowDownToLine className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-200">Deposit Funds</h3>
            </div>
            <p className="text-sm text-slate-400 mt-2">Transfer money from your bank into your trading wallet.</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Amount (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-lg font-bold">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="block w-full pl-8 pr-12 py-3 sm:text-lg bg-slate-900/50 border-slate-700/50 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 border text-slate-200 placeholder-slate-600 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={depositMutation.isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors focus:ring-offset-slate-900"
              >
                {depositMutation.isPending ? 'Processing...' : 'Initiate Deposit'}
              </button>
            </form>
          </div>
        </div>

        {/* Withdraw Card */}
        <div className="glass-card p-5 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center space-x-2">
              <ArrowUpFromLine className="h-5 w-5 text-rose-400" />
              <h3 className="text-lg font-bold text-slate-200">Withdraw Funds</h3>
            </div>
            <p className="text-sm text-slate-400 mt-2">Wire available cash back to your linked bank account.</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Amount (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-lg font-bold">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="block w-full pl-8 pr-12 py-3 sm:text-lg bg-slate-900/50 border-slate-700/50 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 border text-slate-200 placeholder-slate-600 font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={withdrawMutation.isPending}
                className="w-full flex justify-center py-3 px-4 border border-slate-600/50 rounded-xl shadow-lg text-sm font-bold text-slate-300 bg-slate-700/50 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors focus:ring-offset-slate-900"
              >
                {withdrawMutation.isPending ? 'Processing...' : 'Initiate Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
