import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AUDITOR' && user.role !== 'COMPLIANCE_OFFICER')) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Unauthorized</h1>
          <p className="mb-6 text-gray-400">You do not have permission to view the admin portal.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Analytics', path: '/admin' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Markets', path: '/admin/markets' },
    { name: 'Audit Logs', path: '/admin/audit' },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            TradeFlow Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">Role: {user.role}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.email || 'Unknown User'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-gray-800 hover:bg-red-600/20 hover:text-red-400 text-gray-300 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-900">
        <Outlet />
      </div>
    </div>
  );
}
