import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      // The backend returns accessToken and refreshToken
      // In a real app we decode the JWT to get user info. For now, mock it or decode it:
      const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
      setAuth(res.data.accessToken, {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#0B1220] selection:bg-indigo-500/30 p-4">
      <div className="w-full max-w-md p-8 glass-card">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">TradeFlow Login</h2>
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded mb-4 text-sm font-medium">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="block w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500" 
              value={email} onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="block w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500" 
              value={password} onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold p-2.5 rounded-lg hover:bg-indigo-700 transition shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account? <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Register</Link>
        </p>
      </div>
    </div>
  );
}
