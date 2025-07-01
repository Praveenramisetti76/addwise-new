import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/signin', credentials),
  register: (userData) => api.post('/api/auth/signup', userData),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/me'),
  refreshToken: () => api.post('/api/auth/refresh'),
  changePassword: (passwords) => api.post('/api/auth/change-password', passwords),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (profileData) => api.put('/api/users/profile', profileData),
  deleteProfile: () => api.delete('/api/users/profile'),
  getUser: (userId) => api.get(`/api/users/${userId}`),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getUser: (userId) => api.get(`/api/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  activateUser: (userId) => api.post(`/api/admin/users/${userId}/activate`),
  deactivateUser: (userId) => api.post(`/api/admin/users/${userId}/deactivate`),
  getDashboardStats: () => api.get('/api/admin/dashboard'),
};

// Super Admin API
export const superAdminAPI = {
  getUsers: (params) => api.get('/api/superadmin/users', { params }),
  createUser: (userData) => api.post('/api/superadmin/users', userData),
  updateUser: (userId, userData) => api.put(`/api/superadmin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/api/superadmin/users/${userId}`),
  resetPassword: (userId, newPassword) => api.post(`/api/superadmin/users/${userId}/reset-password`, { newPassword }),
  unlockUser: (userId) => api.post(`/api/superadmin/users/${userId}/unlock`),
  getDashboardStats: () => api.get('/api/superadmin/dashboard'),
};

export default api; 