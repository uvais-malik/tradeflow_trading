import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

export function MarketWatch() {
  const [stocks, setStocks] = useState<any[]>([]);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    api.get('/markets').then(res => setStocks(res.data));
    
    const socket = io('http://localhost:3000/live', {
      auth: { token }
    });

    socket.on('market:tick', (data: any) => {
      setStocks(prev => prev.map(s => s.symbol === data.symbol ? { ...s, currentPrice: data.price } : s));
    });

    return () => { socket.disconnect(); };
  }, [token]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Live Market Watch</h3>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase sticky top-0 bg-slate-800">
            <tr>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Change</th>
              <th className="py-2 font-medium text-right">Vol</th>
              <th className="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {stocks.map(s => (
              <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="py-2 font-bold text-slate-200">{s.symbol}</td>
                <td className="py-2 text-right font-mono text-white">₹{Number(s.currentPrice).toFixed(2)}</td>
                <td className="py-2 text-right font-bold text-green-400">▲1.4%</td>
                <td className="py-2 text-right text-slate-400 font-mono">1.2M</td>
                <td className="py-2 text-right">
                  <button className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/40">Trade</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
