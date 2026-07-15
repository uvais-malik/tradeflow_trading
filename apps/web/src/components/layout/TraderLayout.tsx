import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ArrowRightOnRectangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { GlobalSearch } from '../dashboard/DashboardWidgets';

export default function TraderLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
          
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:bg-rose-400/10 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-all">
                  <ShieldExclamationIcon className="w-4 h-4" /> Admin
                </Link>
              )}
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition-colors">Sign Up</Link>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-[#0B1220]/50 backdrop-blur-xl p-4 hidden md:flex flex-col gap-2 flex-shrink-0">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `text-sm font-semibold px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
