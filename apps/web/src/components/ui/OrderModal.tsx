import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

import { useToast } from './ToastProvider';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: any;
  initialSide: 'BUY' | 'SELL';
}

export default function OrderModal({ isOpen, onClose, stock, initialSide }: OrderModalProps) {
  const [side, setSide] = useState(initialSide);
  const [orderType, setOrderType] = useState('MARKET');
  const [validity, setValidity] = useState('DAY');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(Number(stock?.currentPrice || 0));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (newOrder: any) => api.post('/orders', newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
      // We rely on WebSocket for success notification, but we can do a fallback here if we want.
      // For now, just close modal. The WS will trigger a success toast.
    },
    onError: (error: any) => {
      toast(error.response?.data?.message || 'Failed to place order', 'error');
    }
  });

  if (!isOpen || !stock) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      stockId: stock.id,
      side,
      orderType,
      validity,
      quantity: Number(quantity),
      price: orderType === 'MARKET' ? Number(stock.currentPrice) : Number(price)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative border border-slate-700 overflow-hidden">
        <div className="bg-slate-800/50 p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-slate-100">Place Order - <span className="text-indigo-400">{stock.symbol}</span></h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex space-x-3 mb-6 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
              <button type="button" onClick={() => setSide('BUY')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>Buy</button>
              <button type="button" onClick={() => setSide('SELL')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${side === 'SELL' ? 'bg-rose-500/20 text-rose-400 shadow-sm border border-rose-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>Sell</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Type</label>
                <select value={orderType} onChange={e => setOrderType(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5">
                  <option value="MARKET">Market</option>
                  <option value="LIMIT">Limit</option>
                  <option value="STOP_LOSS">Stop Loss</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-mono" />
              </div>

              {orderType !== 'MARKET' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price</label>
                  <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-mono" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Validity</label>
                <select value={validity} onChange={e => setValidity(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5">
                  <option value="DAY">Day</option>
                  <option value="IOC">IOC (Immediate or Cancel)</option>
                  <option value="GTC">GTC (Good Till Cancelled)</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl hover:bg-indigo-500 focus:ring-4 focus:outline-none focus:ring-indigo-500/50 transition-colors disabled:opacity-50">
                {mutation.isPending ? 'Placing...' : `Confirm ${side} Order`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
