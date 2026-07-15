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
    <div className="min-h-screen bg-[#0B1220] text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 bg-[#0B1220]/80 backdrop-blur-xl flex items-center justify-between px-6 z-50 flex-shrink-0">
        <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
          TradeFlow
        </h1>
        <div className="flex items-center gap-4">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-[#0B1220]/50 backdrop-blur-xl p-4 hidden lg:flex flex-col gap-2 flex-shrink-0">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className="text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-lg transition-colors">
              {link.name}
            </Link>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* 12-Column CSS Grid for Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
              
              {/* ROW 1: Portfolio Summary (col 1-4), Market Overview (col 5-9), Notifications (col 10-12) */}
              <div className="md:col-span-4 lg:col-span-4 min-h-[14rem] h-full">
                <PortfolioSummary summary={summary} user={me} />
              </div>
              <div className="md:col-span-8 lg:col-span-5 min-h-[14rem] h-full">
                <MarketOverview />
              </div>
              <div className="md:col-span-12 lg:col-span-3 min-h-[14rem] h-full">
                <NotificationsWidget />
              </div>

              {/* ROW 2: Live Market Watch (col 1-8), Quick Actions (col 9-12) */}
              <div className="md:col-span-8 min-h-[18rem] h-full">
                <MarketWatch />
              </div>
              <div className="md:col-span-4 min-h-[18rem] h-full space-y-6 flex flex-col">
                <div className="flex-1 h-full"><QuickActions /></div>
                <div className="flex-1 h-full"><SystemStatus /></div>
              </div>

              {/* ROW 3: Open Orders (col 1-6), Recent Trades (col 7-12) */}
              <div className="md:col-span-6 min-h-[16rem] h-full">
                <OpenOrders />
              </div>
              <div className="md:col-span-6 min-h-[16rem] h-full">
                <RecentTrades />
              </div>

              {/* ROW 4: Portfolio Allocation (col 1-4), PnL Trend (col 5-8), Portfolio Holdings (col 9-12) */}
              <div className="md:col-span-4 min-h-[16rem] h-full">
                <PortfolioAllocation />
              </div>
              <div className="md:col-span-4 min-h-[16rem] h-full">
                <PnLTrend />
              </div>
              <div className="md:col-span-4 min-h-[16rem] h-full">
                <PortfolioHoldings />
              </div>

              {/* ROW 5: Watchlist (col 1-3), Risk Summary (col 4-6), Activity Timeline (col 7-9), Mini Analytics (col 10-12) */}
              <div className="md:col-span-3 h-[20rem]">
                <Watchlist />
              </div>
              <div className="md:col-span-3 h-[20rem]">
                <RiskSummary />
              </div>
              <div className="md:col-span-3 h-[20rem]">
                <ActivityTimeline />
              </div>
              <div className="md:col-span-3 h-[20rem]">
                <MiniAnalytics />
              </div>

              {/* ROW 6: Extra Optional Widgets */}
              <div className="md:col-span-3 h-[20rem]">
                <NewsWidget />
              </div>
              <div className="md:col-span-3 h-[20rem]">
                <CalendarWidget />
              </div>
              <div className="md:col-span-3 h-[20rem]">
                <PriceAlerts />
              </div>
              <div className="md:col-span-3 h-[20rem]">
                <AiInsights />
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
