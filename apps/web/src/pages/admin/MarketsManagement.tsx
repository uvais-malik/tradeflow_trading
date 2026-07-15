import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

interface Market {
  id: string;
  symbol: string;
  name: string;
  currentPrice: string;
  isTradingHalted: boolean;
}

export default function MarketsManagement() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const { token } = useAuthStore();
  const { toast } = useToast();

  const fetchMarkets = async () => {
    try {
      const res = await fetch('http://localhost:3000/markets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMarkets(await res.json());
      }
    } catch (err) {
      toast('Error fetching markets', 'error');
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [token]);

  const toggleHalt = async (id: string, currentlyHalted: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/markets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isTradingHalted: !currentlyHalted })
      });
      if (res.ok) {
        toast(`Market ${!currentlyHalted ? 'halted' : 'resumed'}`, 'success');
        fetchMarkets();
      }
    } catch (err) {
      toast('Error updating market', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      symbol: formData.get('symbol'),
      name: formData.get('name'),
      currentPrice: Number(formData.get('price'))
    };

    try {
      const res = await fetch('http://localhost:3000/markets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast('Market created successfully', 'success');
        fetchMarkets();
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      toast('Error creating market', 'error');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Markets Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-gray-300">Symbol</th>
                <th className="p-4 font-semibold text-gray-300">Name</th>
                <th className="p-4 font-semibold text-gray-300 text-right">Current Price</th>
                <th className="p-4 font-semibold text-gray-300 text-center">Status</th>
                <th className="p-4 font-semibold text-gray-300 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {markets.map(m => (
                <tr key={m.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="p-4 font-bold">{m.symbol}</td>
                  <td className="p-4 text-gray-300">{m.name}</td>
                  <td className="p-4 text-right font-mono">${Number(m.currentPrice).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      m.isTradingHalted ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'
                    }`}>
                      {m.isTradingHalted ? 'HALTED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => toggleHalt(m.id, m.isTradingHalted)}
                      className={`px-3 py-1 rounded text-sm transition ${
                        m.isTradingHalted 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {m.isTradingHalted ? 'Resume' : 'Halt'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-8">
            <h3 className="text-lg font-bold mb-4">Add New Market</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Symbol (e.g. AAPL)</label>
                <input 
                  type="text" 
                  name="symbol" 
                  required 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Initial Price ($)</label>
                <input 
                  type="number" 
                  name="price" 
                  step="0.01" 
                  required 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
              >
                Create Market
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
