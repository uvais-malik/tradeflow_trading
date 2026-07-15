import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  PresentationChartLineIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';


interface FirmSummary {
  totalFirmCash: number;
  totalFirmPortfolioValue: number;
  totalFirmAUM: number;
  totalFirmUnrealizedPnL: number;
  topPerformers: { name: string; pnl: number; portfolioValue: number }[];
  topHoldings: { symbol: string; totalValue: number }[];
}

interface Trade {
  id: string;
  price: number;
  quantity: number;
  executedAt: string;
  stock: { symbol: string };
  buyOrder: { user: { fullName: string } };
  sellOrder: { user: { fullName: string } };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function FirmDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery<FirmSummary>({
    queryKey: ['firmSummary'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/portfolio/firm-summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    refetchInterval: 5000,
  });

  const { data: trades = [], isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ['firmTrades'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/portfolio/firm-trades`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    refetchInterval: 3000,
  });

  if (isLoadingSummary) {
    return <div className="p-8 text-center text-gray-500">Loading Firm Overview...</div>;
  }

  const chartData = summary?.topHoldings.map((h) => ({
    name: h.symbol,
    value: Number(h.totalValue),
  })) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Firm Portfolio Overview</h1>
          <p className="text-gray-400 mt-1">Aggregated AUM, P&L, and Top Performers across all traders.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex items-center text-gray-400 mb-2">
            <PresentationChartLineIcon className="h-5 w-5 mr-2 text-blue-400" />
            Total AUM
          </div>
          <div className="text-3xl font-bold text-white">
            ${summary?.totalFirmAUM.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex items-center text-gray-400 mb-2">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-400" />
            Total Equities Value
          </div>
          <div className="text-3xl font-bold text-white">
            ${summary?.totalFirmPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="flex items-center text-gray-400 mb-2">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-emerald-400" />
            Available Cash
          </div>
          <div className="text-3xl font-bold text-white">
            ${summary?.totalFirmCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-center text-gray-400 mb-2">
            <TrophyIcon className="h-5 w-5 mr-2 text-yellow-400" />
            Firm Unrealized P&L
          </div>
          <div className={`text-3xl font-bold ${(summary?.totalFirmUnrealizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {(summary?.totalFirmUnrealizedPnL || 0) >= 0 ? '+' : ''}
            ${summary?.totalFirmUnrealizedPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performing Traders</h2>
          <div className="space-y-4">
            {summary?.topPerformers.map((trader, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <div className="text-sm font-medium text-white">{trader.name}</div>
                  <div className="text-xs text-gray-400">AUM: ${trader.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className={`text-sm font-bold ${trader.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trader.pnl >= 0 ? '+' : ''}${trader.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Firm Asset Allocation */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Top 5 Firm Holdings</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center text-xs text-gray-400">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Firm Activity */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Global Trades</h2>
          <div className="overflow-y-auto max-h-[350px] pr-2 space-y-3">
            {isLoadingTrades ? (
              <div className="text-sm text-gray-500 text-center">Loading trades...</div>
            ) : (
              trades.map((trade) => (
                <div key={trade.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-bold text-white">{trade.stock.symbol}</span>
                    <span className="text-xs text-gray-500">{new Date(trade.executedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-400">
                      <span className="text-emerald-400">{trade.buyOrder.user.fullName}</span> bought from <span className="text-red-400">{trade.sellOrder.user.fullName}</span>
                    </div>
                    <div className="text-sm font-mono text-gray-300">
                      {trade.quantity} @ ${Number(trade.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
