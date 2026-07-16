import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000'),
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // We removed the hard redirect so public pages can gracefully degrade to unauthenticated state.
      // ProtectedRoute components will automatically redirect to /login when state.token becomes null.
    }
    return Promise.reject(error);
  }
);
