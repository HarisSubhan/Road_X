import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:5000/api';

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create booking');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_BASE_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bookings');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'booking/updateBookingStatus',
  async ({ bookingId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`${API_BASE_URL}/bookings/${bookingId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update status');
    }
  }
);

export const rateBooking = createAsyncThunk(
  'booking/rateBooking',
  async ({ bookingId, rating, review }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_BASE_URL}/bookings/${bookingId}/rate`, { rating, review }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to submit rating');
    }
  }
);

export const fetchProviderActiveBooking = createAsyncThunk(
  'booking/fetchProviderActiveBooking',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_BASE_URL}/bookings/provider/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch active booking');
    }
  }
);

export const fetchProviderHistory = createAsyncThunk(
  'booking/fetchProviderHistory',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_BASE_URL}/bookings/provider/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch history');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    activeBooking: null,
    providerLocation: null,
    searchingForProvider: false,
    myBookings: [],
    providerBookings: [],
    pendingBookingData: null,
    isLoading: false,
    error: null
  },
  reducers: {
    setActiveBooking: (state, action) => {
      state.activeBooking = action.payload.booking;
      state.searchingForProvider = false;
    },
    setProviderLocation: (state, action) => {
      state.providerLocation = action.payload;
    },
    updateActiveBookingStatus: (state, action) => {
      if (state.activeBooking) {
        state.activeBooking.status = action.payload.new_status;
      }
    },
    clearActiveBooking: (state) => {
      state.activeBooking = null;
      state.providerLocation = null;
    },
    setSearchingForProvider: (state, action) => {
      state.searchingForProvider = action.payload;
    },
    setPendingBookingData: (state, action) => {
      state.pendingBookingData = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchingForProvider = true;
        state.pendingBookingData = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookings = action.payload;
      })
      .addCase(fetchProviderActiveBooking.fulfilled, (state, action) => {
        state.activeBooking = action.payload;
      })
      .addCase(fetchProviderHistory.fulfilled, (state, action) => {
        state.providerBookings = action.payload;
      });
  }
});

export const {
  setActiveBooking,
  setProviderLocation,
  updateActiveBookingStatus,
  clearActiveBooking,
  setSearchingForProvider,
  setPendingBookingData,
  clearError
} = bookingSlice.actions;

export default bookingSlice.reducer;
