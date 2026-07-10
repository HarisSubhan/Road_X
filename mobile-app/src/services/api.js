import axios from 'axios';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('Session expired. Please login again.');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token } = response.data;
        
        await AsyncStorage.multiSet([
          ['accessToken', access_token],
          ['refreshToken', refresh_token]
        ]);

        processQueue(null, access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Navigate to login screen (handle in your app)
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============ AUTH API ============
export const authAPI = {
  // Phone number verification (OTP)
  sendOTP: (phoneNumber) => {
    return api.post('/auth/send-otp', { phone_number: phoneNumber });
  },

  verifyOTP: (data) => {
    return api.post('/auth/verify-otp', {
      phone_number: data.phone_number,
      otp_code: data.otp_code,
      full_name: data.full_name,
      username: data.username,
      password: data.password
    });
  },

  // Login with email and password
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  // Refresh token
  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh', { refresh_token: refreshToken });
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Update profile
  updateProfile: (data) => {
    // If data contains FormData (profile image), use multipart/form-data
    if (data instanceof FormData) {
      return api.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put('/auth/profile', data);
  },

  // Update FCM token
  updateFCMToken: (fcmToken) => {
    return api.put('/auth/fcm-token', { fcm_token: fcmToken });
  },

  // Verify OTP only (no user creation - for provider registration)
  verifyOTPOnly: (phoneNumber, otpCode) => {
    return api.post('/auth/verify-otp-only', {
      phone_number: phoneNumber,
      otp_code: otpCode
    });
  },
};

// ============ CATEGORIES API ============
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
};

// ============ FARE API ============
export const fareAPI = {
  estimate: (data) => api.post('/fare/estimate', data),
};

// ============ BOOKINGS API ============
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  rate: (id, rating, review) => api.post(`/bookings/${id}/rate`, { rating, review }),
  getProviderActive: () => api.get('/bookings/provider/active'),
  getProviderHistory: () => api.get('/bookings/provider/history'),
  confirmCash: (id) => api.post(`/bookings/${id}/confirm-cash`),
  getStatusHistory: (id) => api.get(`/bookings/${id}/history`),
};

// ============ PROVIDERS API ============
export const providersAPI = {
  register: (data) => api.post('/providers/register', data),
  uploadDocuments: (formData) => api.post('/providers/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMe: () => api.get('/providers/me'),
  updateAvailability: (data) => api.put('/providers/availability', data),
  getNearby: (params) => api.get('/providers/nearby', { params }),
  getEarnings: (period) => api.get(`/providers/earnings?period=${period}`),
};

// ============ PAYMENTS API ============
export const paymentsAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  getStatus: (bookingId) => api.get(`/payments/status/${bookingId}`),
};

// ============ HELPER FUNCTIONS ============
export const storeAuthData = async (accessToken, refreshToken, user) => {
  try {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)]
    ]);
  } catch (error) {
    console.error('Error storing auth data:', error);
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

export const getAuthHeader = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    return {};
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  } catch (error) {
    return false;
  }
};

export default api;