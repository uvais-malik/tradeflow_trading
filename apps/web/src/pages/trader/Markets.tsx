import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import OrderModal from '../../components/ui/OrderModal';
import OrderBook from '../../components/ui/OrderBook';
import PriceChart from '../../components/ui/PriceChart';

interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: string;
}

export default function Markets() {
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [modalSide, setModalSide] = useState<'BUY' | 'SELL'>('BUY');
  const [isModalOpen, setModalOpen] = useState(false);

  const { data: stocks, isLoading } = useQuery<Stock[]>({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await api.get('/markets');
      return res.data;
    }
  });

  useEffect(() => {
    const socket = io('${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/live');
    socket.on('price:update', (data: { symbol: string, price: number }) => {
      setLivePrices(prev => ({ ...prev, [data.symbol]: data.price }));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const openOrderModal = (stock: Stock, side: 'BUY' | 'SELL') => {
    setSelectedStock(stock);
    setModalSide(side);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex justify-between items-center bg-slate-800/40 backdrop-blur-xl px-6 py-4 rounded-xl border border-slate-700/50">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Live Markets
          </h1>
          <Link to="/dashboard" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Back to Dashboard
          </Link>
        </header>

        <div className="flex gap-6 flex-col lg:flex-row">
          <div className="bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden flex-1 shadow-xl">
            {isLoading ? (
              <p className="p-6 text-slate-400">Loading markets...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700/50">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Symbol</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stocks?.map(stock => {
                      const price = livePrices[stock.symbol] || Number(stock.currentPrice);
                      return (
                        <tr key={stock.id} className="hover:bg-slate-700/30 transition-colors cursor-pointer group" onClick={() => setSelectedStock(stock)}>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-400">{stock.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">{stock.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-slate-100">
                            ${Number(price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={(e) => { e.stopPropagation(); openOrderModal(stock, 'BUY'); }} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-lg mr-2 hover:bg-emerald-500/30 transition-colors text-sm font-bold shadow-lg shadow-emerald-900/20">Buy</button>
                            <button onClick={(e) => { e.stopPropagation(); openOrderModal(stock, 'SELL'); }} className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-1.5 rounded-lg hover:bg-rose-500/30 transition-colors text-sm font-bold shadow-lg shadow-rose-900/20">Sell</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-96 shrink-0 space-y-6">
             {selectedStock ? (
               <>
                 <div className="bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-1 shadow-xl">
                   <PriceChart 
                     stockId={selectedStock.id} 
                     symbol={selectedStock.symbol} 
                     livePrice={livePrices[selectedStock.symbol] || Number(selectedStock.currentPrice)} 
                   />
                 </div>
                 <div className="bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-1 shadow-xl">
                   <OrderBook stockId={selectedStock.id} symbol={selectedStock.symbol} />
                 </div>
               </>
             ) : (
               <div className="bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center text-slate-500 shadow-xl flex items-center justify-center h-64">
                 Select a stock to view its live chart and order book.
               </div>
             )}
          </div>
        </div>
      </div>
      <OrderModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        stock={selectedStock} 
        initialSide={modalSide} 
      />
    </div>
  );
}
