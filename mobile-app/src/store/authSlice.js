import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, storeAuthData, clearAuthData } from '../services/api';

// Use your actual backend IP address here
// For Android emulator: http://10.0.2.2:5000/api
// For iOS simulator: http://localhost:5000/api
// For physical device: http://YOUR_PC_IP:5000/api
const API_BASE_URL = 'http://10.0.2.2:5000/api';

// ============ PHONE NUMBER VERIFICATION (OTP) ============
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      const response = await authAPI.sendOTP(phoneNumber);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send OTP');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phone_number, otp_code, full_name, username, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyOTP({
        phone_number,
        otp_code,
        full_name,
        username,
        password
      });
      
      // Store auth data
      await storeAuthData(
        response.data.access_token,
        response.data.refresh_token,
        response.data.user
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to verify OTP');
    }
  }
);

// ============ LOGIN WITH EMAIL & PASSWORD ============
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      
      // Store auth data
      await storeAuthData(
        response.data.access_token,
        response.data.refresh_token,
        response.data.user
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

// ============ LOAD STORED AUTH ============
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      const [token, refreshToken, user] = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
        'user'
      ]);
      
      if (token[1] && user[1]) {
        return {
          token: token[1],
          refreshToken: refreshToken[1],
          user: JSON.parse(user[1])
        };
      }
      return null;
    } catch (error) {
      return rejectWithValue('Failed to load stored auth');
    }
  }
);

// ============ LOGOUT ============
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      await clearAuthData();
      return null;
    } catch (error) {
      // Even if logout fails, clear local storage
      await clearAuthData();
      return null;
    }
  }
);

// ============ UPDATE PROFILE ============
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
    }
  }
);

// ============ UPDATE FCM TOKEN ============
export const updateFCMToken = createAsyncThunk(
  'auth/updateFCMToken',
  async (fcmToken, { rejectWithValue }) => {
    try {
      await authAPI.updateFCMToken(fcmToken);
      return fcmToken;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update FCM token');
    }
  }
);

// ============ SLICE ============
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isBootstrapping: true,
    isLoading: false,
    error: null,
    // Phone verification states
    phoneNumber: '',
    phoneVerified: false,
    otpSent: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    resetAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.otpSent = false;
      state.phoneVerified = false;
      state.phoneNumber = '';
    },
    clearVerificationState: (state) => {
      state.otpSent = false;
      state.phoneVerified = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ============ SEND OTP ============
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.phoneNumber = action.meta.arg; // Store phone number
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ============ VERIFY OTP ============
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.phoneVerified = true;
        state.otpSent = false;
        state.phoneNumber = action.payload.user.phone_number || state.phoneNumber;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ============ LOGIN ============
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ============ LOAD STORED AUTH ============
      .addCase(loadStoredAuth.pending, (state) => {
        state.isBootstrapping = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isBootstrapping = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isBootstrapping = false;
      })

      // ============ LOGOUT ============
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.phoneNumber = '';
        state.phoneVerified = false;
        state.otpSent = false;
      })

      // ============ UPDATE PROFILE ============
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      })

      // ============ UPDATE FCM TOKEN ============
      .addCase(updateFCMToken.fulfilled, (state, action) => {
        if (state.user) {
          state.user.fcm_token = action.payload;
        }
      })

  }
});

// ============ EXPORT ACTIONS ============
export const { 
  clearError, 
  setPhoneNumber, 
  updateUser,
  resetAuthState,
  clearVerificationState
} = authSlice.actions;

// ============ SELECTORS ============
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectIsBootstrapping = (state) => state.auth.isBootstrapping;
export const selectPhoneNumber = (state) => state.auth.phoneNumber;
export const selectPhoneVerified = (state) => state.auth.phoneVerified;
export const selectOtpSent = (state) => state.auth.otpSent;

export default authSlice.reducer;