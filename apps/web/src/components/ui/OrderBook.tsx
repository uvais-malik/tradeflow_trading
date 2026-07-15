import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

interface Level {
  price: number;
  quantity: number;
}

interface Depth {
  bids: Level[];
  asks: Level[];
}

interface OrderBookProps {
  stockId: string;
  symbol: string;
}

export default function OrderBook({ stockId, symbol }: OrderBookProps) {
  const [depth, setDepth] = useState<Depth>({ bids: [], asks: [] });

  useEffect(() => {
    // Note: We could fetch initial depth via a REST API, but for MVP
    // we'll rely on the websocket stream to populate it when an order is placed.
    setDepth({ bids: [], asks: [] });
    
    const socket = io('${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/live');
    
    socket.on('orderbook:update', (data: { stockId: string, depth: Depth }) => {
      if (data.stockId === stockId) {
        setDepth(data.depth);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [stockId]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-xl font-mono text-sm w-full max-w-sm h-full flex flex-col">
      <h3 className="font-bold text-center mb-4 text-slate-300 tracking-wider text-xs uppercase">Order Book: <span className="text-indigo-400">{symbol}</span></h3>
      
      <div className="flex justify-between text-slate-500 mb-2 px-2 text-xs font-bold uppercase tracking-wider">
        <span>Size</span>
        <span>Price</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {/* Asks (Sell Orders) - Red, highest price at top */}
        <div className="flex flex-col-reverse">
          {depth.asks.slice().reverse().map((ask, i) => (
            <div key={`ask-${i}`} className="flex justify-between text-rose-400 hover:bg-slate-700/50 px-2 py-0.5 cursor-pointer transition-colors rounded">
              <span>{ask.quantity}</span>
              <span>{Number(ask.price).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="text-center py-2 text-slate-500 border-y border-slate-700/50 my-2 text-xs font-bold tracking-widest uppercase bg-slate-800/30">
          Spread
        </div>

        {/* Bids (Buy Orders) - Green, highest price at top */}
        <div className="flex flex-col">
          {depth.bids.map((bid, i) => (
            <div key={`bid-${i}`} className="flex justify-between text-emerald-400 hover:bg-slate-700/50 px-2 py-0.5 cursor-pointer transition-colors rounded">
              <span>{bid.quantity}</span>
              <span>{Number(bid.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        {depth.bids.length === 0 && depth.asks.length === 0 && (
          <div className="text-center text-slate-500 py-12 flex flex-col items-center">
            <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Book is empty
          </div>
        )}
      </div>
    </div>
  );
}
