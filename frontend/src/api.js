import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('triad_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or invalid and unauthorized, handle gracefully
    if (error.response?.status === 401 && localStorage.getItem('triad_token')) {
      // Don't auto-logout on deliberate unauthorized checks
    }
    return Promise.reject(error);
  }
);

export default api;
