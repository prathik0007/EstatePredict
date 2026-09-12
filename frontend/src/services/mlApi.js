import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '');

const defaultApiBase = isLocalhost 
  ? (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5001/api')
  : 'https://rental-price-prediction-1ez4.onrender.com/api';

const defaultMlBase = isLocalhost
  ? (import.meta.env.DEV ? '/api/ml' : 'http://127.0.0.1:5001/api/ml')
  : 'https://rental-price-prediction-1ez4.onrender.com/api/ml';

const apiBase = import.meta.env.VITE_API_URL || defaultApiBase;
const mlBase = import.meta.env.VITE_ML_API_URL || defaultMlBase;

const mlApi = axios.create({
  baseURL: mlBase
});

// Request interceptor to attach JWT Token
mlApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized cleanly
mlApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default mlApi;
