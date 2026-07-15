import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/trader/Dashboard';
import Markets from './pages/trader/Markets';
import Orders from './pages/trader/Orders';
import Executions from './pages/trader/Executions';
import Portfolio from './pages/trader/Portfolio';
import Wallet from './pages/trader/Wallet';
import ReplayEngine from './pages/trader/ReplayEngine';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import MarketsManagement from './pages/admin/MarketsManagement';
import AuditLogsView from './pages/admin/AuditLogsView';
import AdminLayout from './components/layout/AdminLayout';
import ComplianceDashboard from './pages/compliance/ComplianceDashboard';
import RiskDashboard from './pages/risk/RiskDashboard';
import FirmDashboard from './pages/portfolio-manager/FirmDashboard';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ui/ToastProvider';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useToast } from './components/ui/ToastProvider';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GlobalNotificationListener() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  useEffect(() => {
    if (!token || !user) return;
    const socket = io('http://localhost:3000/live');
    
    socket.on('notification:new', (data) => {
      if (data.userId === user.userId) {
        toast(data.message, data.type || 'info');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, toast]);

  return null;
}

function App() {
  return (
    <ToastProvider>
      <GlobalNotificationListener />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/executions" element={<ProtectedRoute><Executions /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/replay" element={<ProtectedRoute><ReplayEngine /></ProtectedRoute>} />
          <Route path="/risk" element={<ProtectedRoute><RiskDashboard /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><ComplianceDashboard /></ProtectedRoute>} />
          <Route path="/firm-dashboard" element={<ProtectedRoute><FirmDashboard /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AnalyticsDashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="markets" element={<MarketsManagement />} />
            <Route path="audit" element={<AuditLogsView />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
