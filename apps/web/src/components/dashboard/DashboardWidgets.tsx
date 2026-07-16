import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, BellIcon, BeakerIcon, LightBulbIcon, GlobeAltIcon,
  CalendarDaysIcon, MagnifyingGlassIcon, XMarkIcon, ChevronRightIcon, ShieldExclamationIcon
} from '@heroicons/react/24/outline';

// 2. Market Overview
export function MarketOverview() {
  const indices = [
    { name: 'NIFTY', val: '▲1.3%', color: 'text-green-400' },
    { name: 'Sensex', val: '▲0.9%', color: 'text-green-400' },
    { name: 'NASDAQ', val: '▼0.3%', color: 'text-red-400' },
    { name: 'BTC', val: '▲2.8%', color: 'text-green-400' },
    { name: 'Gold', val: '▼0.4%', color: 'text-red-400' },
  ];

  return (
    <div className="glass-card p-5 flex flex-wrap gap-4 items-center justify-between h-full">
      {indices.map(idx => (
        <div key={idx.name} className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400">{idx.name}</span>
          <span className={`text-sm font-bold ${idx.color}`}>{idx.val}</span>
        </div>
      ))}
    </div>
  );
}

// 4. Watchlist
export function Watchlist() {
  const list = [
    { name: 'Apple', price: '$180', change: '+3%', color: 'text-green-400' },
    { name: 'Tesla', price: '$250', change: '-2%', color: 'text-red-400' },
    { name: 'Reliance', price: '$2900', change: '+1%', color: 'text-green-400' },
  ];
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Watchlist</h3>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {list.map((item, i) => (
          <div key={i} className="flex justify-between items-center border-b border-slate-700/50 pb-2 last:border-0">
            <span className="font-semibold text-slate-200">{item.name}</span>
            <div className="text-right">
              <div className="text-sm text-white font-mono">{item.price}</div>
              <div className={`text-xs font-bold ${item.color}`}>{item.change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 10. Risk Summary
export function RiskSummary() {
  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShieldExclamationIcon className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Risk Summary</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Risk Level</p>
          <p className="text-sm font-bold text-amber-400">Medium</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Exposure</p>
          <p className="text-sm font-bold text-slate-200 font-mono">$8,20,000</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Largest Position</p>
          <p className="text-sm font-bold text-blue-400">Apple</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Daily Limit Used</p>
          <p className="text-sm font-bold text-slate-200">62%</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">Rejected Orders</p>
          <p className="text-sm font-bold text-red-400">3</p>
        </div>
      </div>
    </div>
  );
}

// 11. Notifications
export function NotificationsWidget() {
  return (
    <div className="glass-card p-5 h-full relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <BellIcon className="w-4 h-4" /> Notifications
        </h3>
        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3 New</span>
      </div>
      <div className="space-y-3 text-sm flex-1 overflow-y-auto">
        <div className="flex items-start gap-2">
          <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-300">Trade Executed <span className="block text-[10px] text-slate-500">Apple 100 Qty</span></p>
        </div>
        <div className="border-t border-slate-700/50" />
        <div className="flex items-start gap-2">
          <XMarkIcon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-300">Order Cancelled <span className="block text-[10px] text-slate-500">Tesla 20 Qty</span></p>
        </div>
        <div className="border-t border-slate-700/50" />
        <div className="flex items-start gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-300">Risk Alert <span className="block text-[10px] text-slate-500">Margin approaching 80%</span></p>
        </div>
      </div>
    </div>
  );
}

// 12. System Status
export function SystemStatus() {
  return (
    <div className="glass-card p-5 h-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <GlobeAltIcon className="w-4 h-4" /> System Status
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Market</span>
          <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">OPEN</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Order Engine</span>
          <span className="text-xs font-bold text-green-400">Healthy</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">WebSocket</span>
          <span className="text-xs font-bold text-blue-400">Connected</span>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">Last Update</span>
          <span className="text-xs text-slate-500 font-mono">10:32:11</span>
        </div>
      </div>
    </div>
  );
}

// 13. Quick Actions
export function QuickActions() {
  const navigate = useNavigate();
  
  const handleGenerateReport = async () => {
    try {
      const res = await api.get(`/orders/executions/csv`);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Failed to generate report', e);
    }
  };

  return (
    <div className="glass-card p-5 h-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/markets')} className="bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-2 rounded text-xs font-bold border border-green-500/20 transition-colors">Buy</button>
        <button onClick={() => navigate('/markets')} className="bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-2 rounded text-xs font-bold border border-red-500/20 transition-colors">Sell</button>
        <button onClick={() => navigate('/wallet')} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-3 py-2 rounded text-xs font-bold border border-indigo-500/20 transition-colors">Deposit Funds</button>
        <button onClick={() => navigate('/wallet')} className="bg-slate-700/50 text-slate-300 hover:bg-slate-700 px-3 py-2 rounded text-xs font-bold border border-slate-600/50 transition-colors">Withdraw</button>
        <button onClick={handleGenerateReport} className="col-span-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-2 rounded text-xs font-bold border border-blue-500/20 transition-colors">Generate Report</button>
      </div>
    </div>
  );
}

// 14. Global Search
export function GlobalSearch() {
  return (
    <div className="relative w-full max-w-md hidden md:block">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input 
        type="text" 
        placeholder="Search Stocks, Orders, Trades, Accounts..." 
        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500"
      />
    </div>
  );
}

// 15. Activity Timeline
export function ActivityTimeline() {
  const steps = [
    { time: '10:31', text: 'Buy Order Created' },
    { time: '10:31', text: 'Risk Validation Passed' },
    { time: '10:31', text: 'Waiting Match' },
    { time: '10:32', text: 'Matched' },
    { time: '10:32', text: 'Executed' },
    { time: '10:32', text: 'Portfolio Updated' },
  ];
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
      <div className="relative border-l border-slate-700 ml-2 space-y-4 flex-1 overflow-y-auto">
        {steps.map((step, i) => (
          <div key={i} className="relative pl-4">
            <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-800 ${i === steps.length - 1 ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-indigo-400'}`} />
            <p className="text-xs text-slate-500 font-mono">{step.time}</p>
            <p className="text-sm font-medium text-slate-300">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 16. Mini Analytics
export function MiniAnalytics() {
  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Mini Analytics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Today's Trades</p>
          <p className="text-lg font-bold text-slate-200">58</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg Exec Time</p>
          <p className="text-lg font-bold text-blue-400">170 ms</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Success Rate</p>
          <p className="text-lg font-bold text-emerald-400">99.6%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Rejected</p>
          <p className="text-lg font-bold text-rose-400">2</p>
        </div>
      </div>
    </div>
  );
}

export function NewsWidget() {
  const user = useAuthStore((state) => state.user);
  const { data: apiNews } = useQuery<{id: number, headline: string; source: string, datetime: number, url?: string, image?: string, summary?: string}[]>({
    queryKey: ['news'],
    queryFn: async () => {
      const res = await api.get(`/markets/news`);
      return res.data;
    },
    enabled: !!user
  });

  const mockNews = [
    { id: 1, headline: 'Options trading volumes surge as VIX hits 3-month high', source: 'Bloomberg', datetime: Date.now()/1000 - 3600 },
    { id: 2, headline: 'Apple (AAPL) calls see heavy institutional buying ahead of earnings', source: 'Reuters', datetime: Date.now()/1000 - 7200 },
    { id: 3, headline: 'Federal Reserve hints at potential rate cut in Q4', source: 'WSJ', datetime: Date.now()/1000 - 14400 },
    { id: 4, headline: 'Tech sector options skew indicates bearish sentiment building', source: 'CNBC', datetime: Date.now()/1000 - 28800 },
    { id: 5, headline: 'Zero-DTE options now account for 45% of SPX volume', source: 'Financial Times', datetime: Date.now()/1000 - 86400 }
  ];

  const news = (apiNews && apiNews.length > 0) ? apiNews : mockNews;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex-shrink-0">Market News</h3>
      <ul className="space-y-4 overflow-y-auto flex-1 pr-2">
        {news.map((n, i) => (
          <li key={n.id || i} className="text-sm cursor-pointer group" onClick={() => n.url && window.open(n.url, '_blank')}>
            <div className="flex gap-3 items-start">
              {n.image ? (
                <img src={n.image} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-700/30 flex-shrink-0 flex items-center justify-center">
                  <GlobeAltIcon className="w-6 h-6 text-slate-500 opacity-50" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-slate-300 group-hover:text-indigo-400 font-medium line-clamp-2 leading-tight transition-colors">
                  {n.headline}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded uppercase">{n.source}</span>
                  {n.datetime && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.datetime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 18. Calendar
export function CalendarWidget() {
  const user = useAuthStore((state) => state.user);
  const { data: apiEvents } = useQuery<{event: string; type: string}[]>({
    queryKey: ['calendar'],
    queryFn: async () => {
      const res = await api.get(`/markets/calendar`);
      return res.data;
    },
    enabled: !!user
  });

  const mockEvents = [
    { type: 'Macro', event: 'US CPI Data Release (8:30 AM EST)' },
    { type: 'Earnings', event: 'NVIDIA Corp (NVDA) Q3 Earnings' },
    { type: 'Macro', event: 'Fed Chair Powell Speaks (2:00 PM EST)' },
    { type: 'Dividend', event: 'Microsoft (MSFT) Ex-Dividend Date' },
    { type: 'IPO', event: 'Stripe Inc Initial Public Offering' },
    { type: 'Earnings', event: 'Tesla (TSLA) Q4 Earnings' },
  ];

  const events = (apiEvents && apiEvents.length > 0) ? apiEvents : mockEvents;

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 flex-shrink-0">
        <CalendarDaysIcon className="w-4 h-4" /> Calendar
      </h3>
      <div className="space-y-2 text-sm text-slate-300 flex-1 overflow-y-auto pr-2">
        {events.map((e, i) => (
          <div key={i} className="flex justify-between">
            <span className={e.type === 'IPO' ? 'text-blue-400' : e.type === 'Earnings' ? 'text-purple-400' : e.type === 'Dividend' ? 'text-emerald-400' : 'text-rose-400'}>
              {e.type}
            </span>
            <span>{e.event}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 19. Price Alerts
export function PriceAlerts() {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex-shrink-0">Price Alerts</h3>
      <div className="space-y-2 text-sm font-mono flex-1 overflow-y-auto pr-2">
        <div className="flex items-center gap-2 text-slate-300"><span className="text-blue-400 font-bold">AAPL</span> {'>'} $190</div>
        <div className="flex items-center gap-2 text-slate-300"><span className="text-rose-400 font-bold">TSLA</span> {'<'} $240</div>
        <div className="flex items-center gap-2 text-slate-300"><span className="text-emerald-400 font-bold">RELIANCE</span> {'>'} $3000</div>
      </div>
    </div>
  );
}

// 20. AI Insights
export function AiInsights() {
  const user = useAuthStore((state) => state.user);
  const { data: insights = [] } = useQuery<{type: string; title: string; description: string}[]>({
    queryKey: ['insights'],
    queryFn: async () => {
      const res = await api.get(`/portfolio/insights`);
      return res.data;
    },
    enabled: !!user
  });

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md rounded-xl p-4 border border-indigo-500/30 h-full relative overflow-hidden group flex flex-col">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-all pointer-events-none" />
      <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10 flex-shrink-0">
        <LightBulbIcon className="w-4 h-4" /> AI Insights
      </h3>
      <div className="space-y-3 text-sm text-slate-200 relative z-10 flex-1 overflow-y-auto pr-2">
        {insights.map((insight, i) => (
          <p key={i}>
            <span className={`font-semibold ${insight.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{insight.title}: </span><br/>
            {insight.description}
          </p>
        ))}
      </div>
    </div>
  );
}
