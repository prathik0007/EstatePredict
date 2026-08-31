import axios from 'axios';

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL || 'https://rental-price-prediction-1.onrender.com/api'
});

export default mlApi;
