import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';

interface Trade {
  id: string;
  stock: { symbol: string };
  buyOrderId: string;
  sellOrderId: string;
  buyOrder: { userId: string };
  sellOrder: { userId: string };
  price: string;
  quantity: number;
  executedAt: string;
  isSettled: boolean;
}

export default function Executions() {
  const { user } = useAuthStore();
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ['executions'],
    queryFn: async () => {
      const res = await api.get('/orders/executions');
      return res.data;
    }
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <header className="flex items-center justify-between bg-slate-800/40 backdrop-blur-xl px-6 py-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-inner">
              <Activity className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Execution History</h1>
              <p className="text-sm text-slate-400 font-medium mt-1">Real-time ledger of your filled trades</p>
            </div>
          </div>
        </header>

        {/* Data Table Section */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
              Syncing ledger...
            </div>
          ) : !trades || trades.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
              <Activity className="h-12 w-12 mb-4 opacity-30 text-indigo-400" />
              <p className="text-lg font-bold text-slate-300">No execution history found</p>
              <p className="text-sm mt-2">Place some orders on the market to see them here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Side</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Execution Price</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Filled Qty</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {trades.map(trade => {
                    const isBuyer = trade.buyOrder?.userId === user?.userId;
                    const totalValue = Number(trade.price) * trade.quantity;
                    
                    return (
                      <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors duration-150 group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                          {new Date(trade.executedAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-indigo-400">{trade.stock.symbol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                            isBuyer ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {isBuyer ? <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-1" />}
                            {isBuyer ? 'BOUGHT' : 'SOLD'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-slate-300">
                          ${Number(trade.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-200 font-medium">
                          {trade.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-100 font-bold font-mono">
                          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                             trade.isSettled 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                           }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${trade.isSettled ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                            {trade.isSettled ? 'Settled' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
