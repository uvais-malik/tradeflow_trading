import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', { email, password, fullName });
      const payload = JSON.parse(atob(res.data.accessToken.split('.')[1]));
      setAuth(res.data.accessToken, {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">TradeFlow Register</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              required 
              className="mt-1 block w-full rounded border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              value={fullName} onChange={e => setFullName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              required 
              className="mt-1 block w-full rounded border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              value={email} onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              required 
              className="mt-1 block w-full rounded border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              value={password} onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition">
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
