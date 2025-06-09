import axios from 'axios';
const API_URL = 'https://thecodeworks.in/quarksfinance/api';
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getAdvice = async (symbol: string) => {
  const response = await api.get(`/advice/${symbol}`);
  return response.data;
};

export const login = async (username: string, password: string) => {
  const response = await api.post('/login', { username, password });
  return response.data;
};

export const register = async (username: string, password: string) => {
  const response = await api.post('/register', { username, password });
  return response.data;
};

// Add this function to your existing api.ts file

export const runBacktest = async (backtestParams: {
  symbol: string;
  strategy_type: string;
  start_date: string;
  end_date: string;
  initial_cash?: number;
}) => {
  const response = await fetch('https://thecodeworks.in/quarksfinance/api/backtest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(backtestParams)
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return await response.json();
};

export default api;