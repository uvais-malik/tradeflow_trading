import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AnalyticsDashboard() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data
  });

  const { data: volumeData } = useQuery({
    queryKey: ['analytics', 'volume'],
    queryFn: async () => (await api.get('/analytics/volume')).data
  });

  const { data: largestTrades } = useQuery({
    queryKey: ['analytics', 'largest-trades'],
    queryFn: async () => (await api.get('/analytics/largest-trades')).data
  });

  const { data: orderStatus } = useQuery({
    queryKey: ['analytics', 'order-status'],
    queryFn: async () => (await api.get('/analytics/order-status')).data
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Exchange Analytics</h1>
            <p className="text-gray-500 mt-1">Real-time macro monitoring of the trading engine.</p>
          </div>
          <Link to="/dashboard" className="text-blue-600 font-semibold hover:underline bg-blue-50 px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Volume Executed</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${overview?.totalVolume ? (overview.totalVolume / 1000000).toFixed(2) + 'M' : '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-green-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed Trades</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overview?.totalTradesCount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Traders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overview?.totalUsers?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Open Limit Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overview?.openOrders?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-96">
          
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Historical Daily Volume</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`} />
                  <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']} />
                  <Line type="monotone" dataKey="volume" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Order Pipeline Health</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderStatus?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Bottom Row - Largest Trades */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Recent Whale Trades (Top 10)</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Executed At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {largestTrades?.map((trade: any) => (
                <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">{trade.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">${trade.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{trade.quantity.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                    ${trade.totalValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                    {new Date(trade.executedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!largestTrades?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No trades recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
