import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

// Import all the newly created widgets
import { PortfolioSummary } from '../../components/dashboard/PortfolioSummary';
import { MarketWatch } from '../../components/dashboard/MarketWatch';
import { OpenOrders, RecentTrades } from '../../components/dashboard/OrdersTables';
import { PortfolioHoldings } from '../../components/dashboard/PortfolioHoldings';
import { PortfolioAllocation, PnLTrend } from '../../components/dashboard/Charts';
import { 
  MarketOverview, Watchlist, RiskSummary, NotificationsWidget, 
  SystemStatus, QuickActions, GlobalSearch, ActivityTimeline, 
  MiniAnalytics, NewsWidget, CalendarWidget, PriceAlerts, AiInsights 
} from '../../components/dashboard/DashboardWidgets';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => (await api.get('/users/me')).data
  });

  const { data: summary } = useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => (await api.get('/portfolio/summary')).data
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Markets', path: '/markets' },
    { name: 'Orders', path: '/orders' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Wallet', path: '/wallet' },
    { name: 'Reports', path: '/executions' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 p-2 sm:p-4 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* ROW 1: Header & Nav */}
        <header className="flex flex-wrap justify-between items-center bg-slate-800/40 backdrop-blur-xl px-6 py-4 rounded-xl border border-slate-700/50 gap-4">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              TradeFlow
            </h1>
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            <GlobalSearch />
            
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:bg-rose-400/10 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-all">
                <ShieldExclamationIcon className="w-4 h-4" /> Admin
              </Link>
            )}
            
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 12-Column CSS Grid for Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
          
          {/* ROW 2: Portfolio Summary (col 1-4), Market Overview (col 5-9), Notifications (col 10-12) */}
          <div className="md:col-span-4 lg:col-span-4 min-h-[14rem] h-full">
            <PortfolioSummary summary={summary} user={me} />
          </div>
          <div className="md:col-span-8 lg:col-span-5 min-h-[14rem] h-full">
            <MarketOverview />
          </div>
          <div className="md:col-span-12 lg:col-span-3 min-h-[14rem] h-full">
            <NotificationsWidget />
          </div>

          {/* ROW 3: Live Market Watch (col 1-8), Quick Actions (col 9-12) */}
          <div className="md:col-span-8 min-h-[18rem] h-full">
            <MarketWatch />
          </div>
          <div className="md:col-span-4 min-h-[18rem] h-full space-y-4 flex flex-col">
            <div className="flex-1 h-full"><QuickActions /></div>
            <div className="flex-1 h-full"><SystemStatus /></div>
          </div>

          {/* ROW 4: Open Orders (col 1-6), Recent Trades (col 7-12) */}
          <div className="md:col-span-6 min-h-[16rem] h-full">
            <OpenOrders />
          </div>
          <div className="md:col-span-6 min-h-[16rem] h-full">
            <RecentTrades />
          </div>

          {/* ROW 5: Portfolio Allocation (col 1-4), PnL Trend (col 5-8), Portfolio Holdings (col 9-12) */}
          <div className="md:col-span-4 min-h-[16rem] h-full">
            <PortfolioAllocation />
          </div>
          <div className="md:col-span-4 min-h-[16rem] h-full">
            <PnLTrend />
          </div>
          <div className="md:col-span-4 min-h-[16rem] h-full">
            <PortfolioHoldings />
          </div>

          {/* ROW 6: Watchlist (col 1-3), Risk Summary (col 4-6), Activity Timeline (col 7-9), Mini Analytics (col 10-12) */}
          <div className="md:col-span-3 min-h-[18rem] h-full">
            <Watchlist />
          </div>
          <div className="md:col-span-3 min-h-[18rem] h-full">
            <RiskSummary />
          </div>
          <div className="md:col-span-3 min-h-[18rem] h-full">
            <ActivityTimeline />
          </div>
          <div className="md:col-span-3 min-h-[18rem] h-full">
            <MiniAnalytics />
          </div>

          {/* ROW 7: Extra Optional Widgets */}
          <div className="md:col-span-3 min-h-[12rem] h-full">
            <NewsWidget />
          </div>
          <div className="md:col-span-3 min-h-[12rem] h-full">
            <CalendarWidget />
          </div>
          <div className="md:col-span-3 min-h-[12rem] h-full">
            <PriceAlerts />
          </div>
          <div className="md:col-span-3 min-h-[12rem] h-full">
            <AiInsights />
          </div>

        </div>

      </div>
    </div>
  );
}
