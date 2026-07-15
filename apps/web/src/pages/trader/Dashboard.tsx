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
    queryFn: async () => (await api.get('/users/me')).data,
    enabled: !!user
  });

  const { data: summary } = useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => (await api.get('/portfolio/summary')).data,
    enabled: !!user
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
    <div className="max-w-[1600px] mx-auto space-y-6">
      {!user && (
        <div className="glass-card p-8 text-center border-indigo-500/30">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to TradeFlow</h2>
          <p className="text-slate-400 mb-6">Log in to view your portfolio, open orders, and execute trades.</p>
          <div className="flex justify-center gap-4">
            <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors">Log In</Link>
            <Link to="/register" className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition-colors">Sign Up</Link>
          </div>
        </div>
      )}

      {/* 12-Column CSS Grid for Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        
        {/* ROW 1: Portfolio Summary (col 1-4), Market Overview (col 5-9), Notifications (col 10-12) */}
        {user ? (
          <>
            <div className="md:col-span-4 lg:col-span-4 min-h-[14rem] h-full">
              <PortfolioSummary summary={summary} user={me} />
            </div>
            <div className="md:col-span-8 lg:col-span-5 min-h-[14rem] h-full">
              <MarketOverview />
            </div>
            <div className="md:col-span-12 lg:col-span-3 min-h-[14rem] h-full">
              <NotificationsWidget />
            </div>
          </>
        ) : (
          <div className="md:col-span-12 min-h-[14rem] h-full">
            <MarketOverview />
          </div>
        )}

        {/* ROW 2: Live Market Watch (col 1-8), Quick Actions (col 9-12) */}
        <div className={`min-h-[18rem] h-full ${user ? 'md:col-span-8' : 'md:col-span-12'}`}>
          <MarketWatch />
        </div>
        {user && (
          <div className="md:col-span-4 min-h-[18rem] h-full space-y-6 flex flex-col">
            <div className="flex-1 h-full"><QuickActions /></div>
            <div className="flex-1 h-full"><SystemStatus /></div>
          </div>
        )}

        {/* ROW 3: Open Orders (col 1-6), Recent Trades (col 7-12) */}
        {user && (
          <>
            <div className="md:col-span-6 min-h-[16rem] h-full">
              <OpenOrders />
            </div>
            <div className="md:col-span-6 min-h-[16rem] h-full">
              <RecentTrades />
            </div>
          </>
        )}

        {/* ROW 4: Portfolio Allocation (col 1-4), PnL Trend (col 5-8), Portfolio Holdings (col 9-12) */}
        {user && (
          <>
            <div className="md:col-span-4 min-h-[16rem] h-full">
              <PortfolioAllocation />
            </div>
            <div className="md:col-span-4 min-h-[16rem] h-full">
              <PnLTrend />
            </div>
            <div className="md:col-span-4 min-h-[16rem] h-full">
              <PortfolioHoldings />
            </div>
          </>
        )}

        {/* ROW 5: Watchlist (col 1-3), Risk Summary (col 4-6), Activity Timeline (col 7-9), Mini Analytics (col 10-12) */}
        {user && (
          <>
            <div className="md:col-span-3 h-[15rem]">
              <Watchlist />
            </div>
            <div className="md:col-span-3 h-[15rem]">
              <RiskSummary />
            </div>
            <div className="md:col-span-3 h-[15rem]">
              <ActivityTimeline />
            </div>
            <div className="md:col-span-3 h-[15rem]">
              <MiniAnalytics />
            </div>
          </>
        )}

        {/* ROW 6: Extra Optional Widgets */}
        <div className="md:col-span-3 h-[15rem]">
          <NewsWidget />
        </div>
        <div className="md:col-span-3 h-[15rem]">
          <CalendarWidget />
        </div>
        <div className="md:col-span-3 h-[15rem]">
          <PriceAlerts />
        </div>
        <div className="md:col-span-3 h-[15rem]">
          <AiInsights />
        </div>

      </div>
    </div>
  );
}
