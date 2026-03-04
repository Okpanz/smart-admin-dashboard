import axios from 'axios';

// In dev, use a relative base URL so Vite's proxy forwards /api → rivers.thesmartapps.org (no CORS).
// In production, use the env var or fall back to the production API origin.
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://rivers.thesmartapps.org/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
