const jwt = require('jsonwebtoken');
const db = require('./db');

let io = null;

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [users] = await db.query(
        'SELECT id, role, is_active FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (!users.length || !users[0].is_active) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = users[0];
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const role = socket.user.role;
    
    console.log(`User connected: ${userId} (${role})`);

    socket.join(`user_${userId}`);

    if (role === 'provider') {
      socket.on('provider:toggle_online', async (data) => {
        try {
          await db.query(
            'UPDATE service_providers SET is_online = ?, current_lat = ?, current_lng = ? WHERE user_id = ?',
            [data.is_online ? 1 : 0, data.lat || null, data.lng || null, userId]
          );
          socket.emit('online_status_changed', { is_online: data.is_online });
        } catch (error) {
          socket.emit('error', { message: 'Failed to update online status' });
        }
      });

      socket.on('provider:location_update', async (data) => {
        try {
          await db.query(
            'UPDATE provider_locations SET latitude = ?, longitude = ?, heading = ?, speed = ?, updated_at = NOW() WHERE provider_id = ?',
            [data.lat, data.lng, data.heading || 0, data.speed || 0, data.provider_id]
          );
          
          const [booking] = await db.query(
            'SELECT customer_id FROM bookings WHERE id = ? AND provider_id = (SELECT id FROM service_providers WHERE user_id = ?)',
            [data.booking_id, userId]
          );

          if (booking.length) {
            io.to(`user_${booking[0].customer_id}`).emit('provider:location', {
              lat: data.lat,
              lng: data.lng
            });
          }
        } catch (error) {
          console.error('Location update error:', error);
        }
      });

      socket.on('booking:accept', async (data) => {
        try {
          const [booking] = await db.query(
            'SELECT * FROM bookings WHERE id = ? AND status = ?',
            [data.booking_id, 'pending']
          );

          if (!booking.length) {
            socket.emit('accept_failed', { message: 'Booking not available' });
            return;
          }

          const [provider] = await db.query(
            'SELECT id FROM service_providers WHERE user_id = ? AND approval_status = ? AND is_online = 1',
            [userId, 'approved']
          );

          if (!provider.length) {
            socket.emit('accept_failed', { message: 'Provider not approved or offline' });
            return;
          }

          await db.query(
            'UPDATE bookings SET provider_id = ?, status = ?, updated_at = NOW() WHERE id = ?',
            [provider[0].id, 'accepted', data.booking_id]
          );

          await db.query(
            'INSERT INTO booking_status_history (booking_id, status, changed_by, changed_by_role) VALUES (?, ?, ?, ?)',
            [data.booking_id, 'accepted', userId, 'provider']
          );

          io.to(`user_${booking[0].customer_id}`).emit('request_accepted', {
            booking_id: data.booking_id,
            provider_id: provider[0].id
          });

          socket.emit('accept_success', { booking_id: data.booking_id });
        } catch (error) {
          socket.emit('accept_failed', { message: 'Failed to accept booking' });
        }
      });
    }

    socket.on('booking:join', (data) => {
      socket.join(`booking_${data.booking_id}`);
    });

    socket.on('booking:status_update', async (data) => {
      try {
        const [booking] = await db.query(
          'SELECT * FROM bookings WHERE id = ?',
          [data.booking_id]
        );

        if (!booking.length) return;

        await db.query(
          'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
          [data.status, data.booking_id]
        );

        await db.query(
          'INSERT INTO booking_status_history (booking_id, status, changed_by, changed_by_role) VALUES (?, ?, ?, ?)',
          [data.booking_id, data.status, userId, role]
        );

        io.to(`booking_${data.booking_id}`).emit('status_changed', {
          booking_id: data.booking_id,
          new_status: data.status
        });

        if (data.status === 'completed') {
          await db.query(
            'UPDATE bookings SET completed_at = NOW() WHERE id = ?',
            [data.booking_id]
          );
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

const broadcastNewRequest = async (booking, categoryId, radiusKm) => {
  if (!io) return;

  try {
    const [providers] = await db.query(`
      SELECT sp.user_id, sp.id, pl.latitude, pl.longitude
      FROM service_providers sp
      LEFT JOIN provider_locations pl ON sp.id = pl.provider_id
      WHERE sp.service_category_id = ? 
        AND sp.approval_status = 'approved' 
        AND sp.is_online = 1
    `, [categoryId]);

    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    providers.forEach(provider => {
      if (provider.latitude && provider.longitude) {
        const distance = haversine(
          booking.pickup_lat, booking.pickup_lng,
          provider.latitude, provider.longitude
        );

        if (distance <= radiusKm) {
          io.to(`user_${provider.user_id}`).emit('new_request', {
            booking: booking,
            distance_km: Math.round(distance * 100) / 100
          });
        }
      }
    });

    const timeout = parseInt(process.env.PROVIDER_REQUEST_TIMEOUT_SECONDS || '45') * 1000;
    setTimeout(() => {
      io.to(`user_${booking.customer_id}`).emit('request_expired', {
        booking_id: booking.id
      });
    }, timeout);

  } catch (error) {
    console.error('Broadcast error:', error);
  }
};

module.exports = { initializeSocket, broadcastNewRequest, getIo: () => io };
