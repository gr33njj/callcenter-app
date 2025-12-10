import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => 
  api.post('/auth/login', { username, password });

export const changePassword = (username, oldPassword, newPassword) =>
  api.post('/auth/change-password', { username, oldPassword, newPassword });

// Operators
export const getOperators = () => api.get('/operators');
export const getOperator = (id) => api.get(`/operators/${id}`);
export const createOperator = (data) => api.post('/operators', data);
export const updateOperator = (id, data) => api.put(`/operators/${id}`, data);
export const deleteOperator = (id) => api.delete(`/operators/${id}`);

// Reports
export const getReports = (params) => api.get('/reports', { params });
export const getReport = (id) => api.get(`/reports/${id}`);
export const createReport = (data) => api.post('/reports', data);
export const deleteReport = (id) => api.delete(`/reports/${id}`);
export const getDailyStats = (params) => api.get('/reports/stats/daily', { params });
export const getMonthlyStats = (params) => api.get('/reports/stats/monthly', { params });

export default api;
