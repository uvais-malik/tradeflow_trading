import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function PortfolioHoldings() {
  const { data: holdings = [] } = useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: async () => (await api.get('/portfolio/holdings')).data
  });

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Portfolio Holdings</h3>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase sticky top-0 bg-slate-800">
            <tr>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium text-right">Avg Price</th>
              <th className="py-2 font-medium text-right">Current</th>
              <th className="py-2 font-medium text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {holdings.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-slate-500">No holdings found</td></tr>
            )}
            {holdings.map((h: any) => {
              const currentPrice = Number(h.stock?.currentPrice || 0);
              const avgPrice = Number(h.avgBuyPrice);
              const profit = (currentPrice - avgPrice) * h.quantity;
              
              return (
                <tr key={h.id} className="hover:bg-slate-700/30 cursor-pointer transition-colors">
                  <td className="py-2 font-bold text-slate-200">{h.stock?.symbol}</td>
                  <td className="py-2 text-slate-300">{h.quantity}</td>
                  <td className="py-2 text-right font-mono text-slate-400">₹{avgPrice.toFixed(2)}</td>
                  <td className="py-2 text-right font-mono text-white">₹{currentPrice.toFixed(2)}</td>
                  <td className={`py-2 text-right font-mono font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
