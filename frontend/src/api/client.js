import axios from 'axios';

const PRODUCTION_API = 'https://supermarket-pos-b88b.onrender.com/api';
const configured = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const apiBase =
  configured && configured !== '/api'
    ? configured
    : import.meta.env.DEV
      ? '/api'
      : PRODUCTION_API;

const api = axios.create({
  baseURL: apiBase,
});

export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const origin = apiBase.replace(/\/api$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
