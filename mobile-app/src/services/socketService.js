import io from 'socket.io-client';
import store from '../store';
import { SOCKET_URL } from '../config';

let socket = null;
let incomingRequestCallback = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('request_accepted', (data) => {
    store.dispatch({
      type: 'booking/setActiveBooking',
      payload: data
    });
  });

  socket.on('request_expired', () => {
    store.dispatch({
      type: 'booking/setSearchingForProvider',
      payload: false
    });
  });

  socket.on('provider:location', (data) => {
    store.dispatch({
      type: 'booking/setProviderLocation',
      payload: data
    });
  });

  socket.on('status_changed', (data) => {
    store.dispatch({
      type: 'booking/updateActiveBookingStatus',
      payload: data
    });
  });

  socket.on('new_request', (data) => {
    if (incomingRequestCallback) {
      incomingRequestCallback(data);
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitLocation = (lat, lng, bookingId) => {
  if (socket) {
    socket.emit('provider:location_update', { lat, lng, booking_id: bookingId });
  }
};

export const acceptBooking = (bookingId) => {
  if (socket) {
    socket.emit('booking:accept', { booking_id: bookingId });
  }
};

export const emitToggleOnline = (isOnline, lat, lng) => {
  if (socket) {
    socket.emit('provider:toggle_online', { is_online: isOnline, lat, lng });
  }
};

export const emitStatusUpdate = (bookingId, status) => {
  if (socket) {
    socket.emit('booking:status_update', { booking_id: bookingId, status });
  }
};

export const joinBookingRoom = (bookingId) => {
  if (socket) {
    socket.emit('booking:join', { booking_id: bookingId });
  }
};

export const setIncomingRequestCallback = (callback) => {
  incomingRequestCallback = callback;
};

export const getSocket = () => socket;
