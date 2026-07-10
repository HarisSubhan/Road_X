// API Configuration
// Update this based on your testing environment:

// For Android Emulator: use '10.0.2.2'
// For iOS Simulator: use 'localhost'
// For Physical Device: use your PC's local IP address
const API_HOST = '10.0.2.2';
const API_PORT = '5000';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

// Socket.io Configuration
export const SOCKET_URL = `http://${API_HOST}:${API_PORT}`;

// App Configuration
export const APP_CONFIG = {
  DEFAULT_COUNTRY: 'PK',
  DEFAULT_CURRENCY: 'PKR',
  DEFAULT_LANGUAGE: 'en',
  OTP_EXPIRY_MINUTES: 5,
  MAX_OTP_ATTEMPTS: 3,
  PROVIDER_REQUEST_TIMEOUT_SECONDS: 30,
  DEFAULT_SEARCH_RADIUS_KM: 5,
  MAX_SEARCH_RADIUS_KM: 20,
};
