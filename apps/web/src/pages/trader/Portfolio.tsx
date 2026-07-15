import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Holding {
  id: string;
  stock: { symbol: string, currentPrice: string, name: string };
  quantity: number;
  avgBuyPrice: string;
}

export default function Portfolio() {
  const { data: holdings, isLoading: holdingsLoading } = useQuery<Holding[]>({
    queryKey: ['portfolio', 'holdings'],
    queryFn: async () => {
      const res = await api.get('/portfolio/holdings');
      return res.data;
    }
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => {
      const res = await api.get('/portfolio/summary');
      return res.data;
    }
  });

  // Calculate allocation for chart
  const allocationData = holdings?.filter(h => h.quantity > 0).map(h => ({
    name: h.stock.symbol,
    value: h.quantity * Number(h.stock.currentPrice)
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FE8C9D'];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
        <h2 className="text-xl font-bold mb-4">My Portfolio</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-xl border border-slate-700/50 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Portfolio Value</h3>
            <p className="text-3xl font-bold text-slate-100 font-mono">
              ${summaryLoading ? '...' : summary?.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-xl border border-slate-700/50 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Unrealized P&L</h3>
            <p className={`text-3xl font-bold font-mono ${summary?.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary?.totalUnrealizedPnL >= 0 ? '+' : ''}${summaryLoading ? '...' : summary?.totalUnrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-xl border border-slate-700/50 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Realized P&L</h3>
            <p className={`text-3xl font-bold font-mono ${summary?.totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary?.totalRealizedPnL >= 0 ? '+' : ''}${summaryLoading ? '...' : summary?.totalRealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 glass-card p-5 overflow-hidden shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Holdings</h2>
            </div>
            {holdingsLoading ? (
              <p className="p-6 text-slate-400">Loading holdings...</p>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-700/50">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Symbol</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Unrealized P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {holdings?.map(h => {
                      if (h.quantity === 0) return null;
                      const avg = Number(h.avgBuyPrice);
                      const current = Number(h.stock.currentPrice);
                      const pnl = (current - avg) * h.quantity;
                      return (
                        <tr key={h.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-400">{h.stock.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-200">{h.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300">${avg.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300">${current.toFixed(2)}</td>
                          <td className={`px-6 py-4 whitespace-nowrap font-bold font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="glass-card p-5 p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Allocation</h2>
            {allocationData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      stroke="none"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-center mt-10 font-medium">No active holdings.</p>
            )}
          </div>
        </div>
      </div>
  );
}
