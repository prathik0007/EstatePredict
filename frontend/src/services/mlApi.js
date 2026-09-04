import axios from 'axios';

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/ml` : '/api/ml')
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

export default mlApi;
