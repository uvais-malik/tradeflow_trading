import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface PriceChartProps {
  stockId: string;
  symbol: string;
  livePrice?: number;
}

export default function PriceChart({ stockId, symbol, livePrice }: PriceChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['markets', stockId, 'chart'],
    queryFn: async () => {
      const res = await api.get(`/markets/${stockId}/chart`);
      return res.data;
    },
    enabled: !!stockId,
    refetchInterval: 5000 // Refetch every 5s to keep historical chart moving
  });

  if (isLoading || !chartData) {
    return <div className="h-64 flex items-center justify-center text-gray-500">Loading chart data...</div>;
  }

  // Determine if the trend is generally positive or negative to color the chart
  const startPrice = chartData.length > 0 ? chartData[0].price : 0;
  const endPrice = livePrice || (chartData.length > 0 ? chartData[chartData.length - 1].price : 0);
  const isPositive = endPrice >= startPrice;

  const color = isPositive ? '#22c55e' : '#ef4444'; // Green or Red
  const gradientId = `colorPrice-${symbol}`;

  // If we have a live price, we can append it as the final data point (optional, but makes it perfectly in sync)
  const renderData = [...chartData];
  if (livePrice && renderData.length > 0) {
    renderData[renderData.length - 1] = {
       ...renderData[renderData.length - 1],
       price: livePrice
    };
  }

  const minPrice = Math.min(...renderData.map((d: any) => d.price));
  const maxPrice = Math.max(...renderData.map((d: any) => d.price));
  // Add some padding to domain
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 mb-6 shadow-xl w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            <span className="text-indigo-400 mr-2">{symbol}</span> 
            Price History
          </h2>
        </div>
        <div className="text-right bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
          <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${Number(endPrice).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={renderData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
              tickMargin={10}
              minTickGap={30}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[minPrice - padding, maxPrice + padding]} 
              tickFormatter={(val) => `$${val.toFixed(2)}`}
              tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              orientation="right"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#${gradientId})`} 
              isAnimationActive={false} // Disable animation so live updates don't bounce
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
