import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { io, Socket } from 'socket.io-client';
import OrderBook from '../../components/ui/OrderBook';

interface Stock {
  id: string;
  symbol: string;
  name: string;
}

interface Trade {
  id: string;
  price: number;
  quantity: number;
  executedAt: string;
}

export default function ReplayEngine() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [speed, setSpeed] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [virtualTime, setVirtualTime] = useState<number>(0);
  const [tradeTape, setTradeTape] = useState<Trade[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const { data: stocks } = useQuery<Stock[]>({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await api.get('/markets');
      return res.data;
    }
  });

  useEffect(() => {
    const s = io('http://localhost:3000/replay');
    setSocket(s);

    s.on('replay:trade', (trade: Trade) => {
      setTradeTape(prev => [trade, ...prev].slice(0, 50));
    });

    s.on('replay:price', (data: { price: number, virtualTime: number }) => {
      setCurrentPrice(data.price);
    });

    s.on('replay:time', (data: { virtualTime: number }) => {
      setVirtualTime(data.virtualTime);
    });

    s.on('replay:finished', () => {
      setIsPlaying(false);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Pass custom socket to OrderBook? 
  // Wait, the existing OrderBook component hardcodes the `socket = io('/live')`.
  // I should create a ReplayOrderBook or modify OrderBook to accept an optional socket or depth prop.
  
  const startReplay = () => {
    if (!selectedStock || !socket) return;
    setTradeTape([]);
    setIsPlaying(true);
    socket.emit('replay:start', { stockId: selectedStock, speed });
  };

  const stopReplay = () => {
    if (socket) {
      socket.emit('replay:stop');
      setIsPlaying(false);
    }
  };

  const selectedStockData = stocks?.find(s => s.id === selectedStock);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-gray-800 p-6 rounded shadow-xl border border-blue-500">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Time Machine (Replay Engine)</h1>
            <p className="text-gray-400 text-sm mt-1">Reconstruct historical market states with microsecond precision.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Virtual Time</div>
            <div className="text-2xl font-mono text-green-400">
              {virtualTime > 0 ? new Date(virtualTime).toLocaleString() : '00:00:00'}
            </div>
          </div>
        </header>

        <div className="bg-gray-800 p-6 rounded shadow-xl flex items-center space-x-6 border border-gray-700">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Select Market</label>
            <select 
              value={selectedStock} 
              onChange={e => setSelectedStock(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
              disabled={isPlaying}
            >
              <option value="">-- Choose Stock --</option>
              {stocks?.map(s => (
                <option key={s.id} value={s.id}>{s.symbol} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm text-gray-400 mb-2">Playback Speed</label>
            <select 
              value={speed} 
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
              disabled={isPlaying}
            >
              <option value="1">1x (Realtime)</option>
              <option value="10">10x Speed</option>
              <option value="100">100x Speed</option>
              <option value="1000">1000x Speed</option>
              <option value="5000">5000x Speed (Stress Test)</option>
            </select>
          </div>

          <div className="flex items-end h-full mt-6">
            {!isPlaying ? (
              <button onClick={startReplay} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded">
                ▶ Start Replay
              </button>
            ) : (
              <button onClick={stopReplay} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded">
                ⏸ Stop Replay
              </button>
            )}
          </div>
        </div>

        {selectedStock && (
          <div className="flex gap-6">
            {/* Replay Order Book Placeholder */}
            <div className="w-80 shrink-0">
               <ReplayOrderBook socket={socket} stockId={selectedStock} symbol={selectedStockData?.symbol || ''} />
            </div>

            <div className="flex-1 bg-gray-800 rounded p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-300">Live Trade Tape</h3>
                {currentPrice && (
                  <span className="text-xl font-mono text-blue-400">${Number(currentPrice).toFixed(2)}</span>
                )}
              </div>
              <div className="h-[500px] overflow-y-auto space-y-1 font-mono text-sm pr-2">
                {tradeTape.map((trade, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-800 hover:bg-gray-750 transition-colors">
                    <span className="text-gray-500">{new Date(trade.executedAt || virtualTime).toLocaleTimeString()}</span>
                    <span className="text-white">{trade.quantity} shares</span>
                    <span className="text-green-400 font-bold">${Number(trade.price).toFixed(2)}</span>
                  </div>
                ))}
                {tradeTape.length === 0 && (
                  <div className="text-center text-gray-600 py-10">Awaiting executions...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// A specialized Replay Order Book that listens to the injected socket instead of the global Live socket
function ReplayOrderBook({ socket, stockId, symbol }: { socket: Socket | null, stockId: string, symbol: string }) {
  const [depth, setDepth] = useState<{bids: any[], asks: any[]}>({ bids: [], asks: [] });

  useEffect(() => {
    if (!socket) return;
    
    setDepth({ bids: [], asks: [] });
    
    const handler = (data: { stockId: string, depth: any }) => {
      if (data.stockId === stockId) {
        setDepth(data.depth);
      }
    };

    socket.on('replay:orderbook', handler);
    return () => {
      socket.off('replay:orderbook', handler);
    };
  }, [socket, stockId]);

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 shadow-xl font-mono text-sm w-full border border-gray-700">
      <h3 className="font-bold text-center mb-4 text-blue-400">Replay Book: {symbol}</h3>
      
      <div className="flex justify-between text-gray-500 mb-2 px-2">
        <span>Size</span>
        <span>Price</span>
      </div>

      <div className="flex flex-col-reverse h-48 overflow-y-auto">
        {depth.asks.slice().reverse().map((ask, i) => (
          <div key={`ask-${i}`} className="flex justify-between text-red-400 hover:bg-gray-800 px-2 cursor-pointer transition-colors">
            <span>{ask.quantity}</span>
            <span>{Number(ask.price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="text-center py-2 text-gray-600 border-y border-gray-800 my-2 text-xs">
        Spread
      </div>

      <div className="flex flex-col h-48 overflow-y-auto">
        {depth.bids.map((bid, i) => (
          <div key={`bid-${i}`} className="flex justify-between text-green-400 hover:bg-gray-800 px-2 cursor-pointer transition-colors">
            <span>{bid.quantity}</span>
            <span>{Number(bid.price).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      {depth.bids.length === 0 && depth.asks.length === 0 && (
        <div className="text-center text-gray-600 py-8">Book is empty</div>
      )}
    </div>
  );
}
