import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  stock: { symbol: string };
  side: string;
  orderType: string;
  quantity: number;
  price: string;
  status: string;
  createdAt: string;
}

export default function Orders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <h2 className="text-xl font-bold mb-4">My Orders</h2>
      <div className="glass-card p-5 overflow-hidden">
        {isLoading ? (
          <p className="text-slate-400">Loading orders...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Side</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Qty @ Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {orders?.map(order => (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-400">{order.stock.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">{order.orderType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 font-mono">
                      {order.quantity} @ ${Number(order.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(order.status === 'PENDING' || order.status === 'OPEN') && (
                        <button 
                          onClick={() => cancelMutation.mutate(order.id)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 px-3 py-1.5 rounded-lg transition-colors font-bold text-xs border border-transparent hover:border-rose-500/20"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
