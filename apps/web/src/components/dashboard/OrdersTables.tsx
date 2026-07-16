import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function OpenOrders() {
  const { data: apiOrders } = useQuery({
    queryKey: ['orders', 'open'],
    queryFn: async () => (await api.get('/orders')).data
  });

  const mockOpenOrders = [
    { id: '1', stock: { symbol: 'AAPL' }, side: 'BUY', quantity: 100, filledQuantity: 0, price: 175.50, status: 'OPEN' },
    { id: '2', stock: { symbol: 'TSLA' }, side: 'SELL', quantity: 50, filledQuantity: 20, price: 260.00, status: 'PARTIALLY_FILLED' },
    { id: '3', stock: { symbol: 'RELIANCE' }, side: 'BUY', quantity: 200, filledQuantity: 0, price: 2850.00, status: 'OPEN' },
    { id: '4', stock: { symbol: 'NVDA' }, side: 'SELL', quantity: 10, filledQuantity: 0, price: 450.00, status: 'OPEN' }
  ];

  const rawOrders = (apiOrders && apiOrders.length > 0) ? apiOrders : mockOpenOrders;
  const openOrders = rawOrders.filter((o: any) => ['OPEN', 'PARTIALLY_FILLED'].includes(o.status));

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Open Orders</h3>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase sticky top-0 bg-slate-800">
            <tr>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium">Side</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {openOrders.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-slate-500">No open orders</td></tr>
            )}
            {openOrders.map((o: any) => (
              <tr key={o.id} className="hover:bg-slate-700/30">
                <td className="py-2 font-bold text-slate-200">{o.stock?.symbol || o.stockId}</td>
                <td className={`py-2 font-bold ${o.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{o.side}</td>
                <td className="py-2 text-slate-300">{o.quantity - o.filledQuantity}/{o.quantity}</td>
                <td className="py-2 text-right font-mono text-white">${o.price ? Number(o.price).toFixed(2) : 'MKT'}</td>
                <td className="py-2 text-right">
                  <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RecentTrades() {
  const { data: executions = [] } = useQuery({
    queryKey: ['orders', 'executions'],
    queryFn: async () => (await api.get('/orders/executions')).data
  });

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Trades</h3>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase sticky top-0 bg-slate-800">
            <tr>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium">Side</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {executions.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-slate-500">No recent trades</td></tr>
            )}
            {executions.slice(0, 10).map((e: any) => (
              <tr key={e.id} className="hover:bg-slate-700/30">
                <td className="py-2 font-bold text-slate-200">{e.order?.stock?.symbol}</td>
                <td className={`py-2 font-bold ${e.order?.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {e.order?.side === 'BUY' ? 'Bought' : 'Sold'}
                </td>
                <td className="py-2 text-slate-300">{e.quantity}</td>
                <td className="py-2 text-right font-mono text-white">${Number(e.price).toFixed(2)}</td>
                <td className="py-2 text-right text-xs text-slate-500">
                  {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
