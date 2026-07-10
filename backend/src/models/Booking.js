const db = require('../config/db');

class Booking {
  static async findById(id) {
    const [bookings] = await db.query(`
      SELECT b.*, 
             c.full_name as customer_name, c.phone_number as customer_phone,
             p.user_id as provider_user_id, p.vehicle_make, p.vehicle_plate,
             cat.name_en as category_name, cat.name_ur as category_name_ur, cat.icon_emoji
      FROM bookings b
      JOIN users c ON b.customer_id = c.id
      LEFT JOIN service_providers p ON b.provider_id = p.id
      LEFT JOIN service_categories cat ON b.category_id = cat.id
      WHERE b.id = ?
    `, [id]);
    return bookings[0] || null;
  }

  static async findByRef(bookingRef) {
    const [bookings] = await db.query(`
      SELECT b.*, 
             c.full_name as customer_name, c.phone_number as customer_phone,
             p.user_id as provider_user_id, p.vehicle_make, p.vehicle_plate,
             cat.name_en as category_name, cat.icon_emoji
      FROM bookings b
      JOIN users c ON b.customer_id = c.id
      LEFT JOIN service_providers p ON b.provider_id = p.id
      LEFT JOIN service_categories cat ON b.category_id = cat.id
      WHERE b.booking_ref = ?
    `, [bookingRef]);
    return bookings[0] || null;
  }

  static async create(data) {
    const bookingRef = `RX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    const [result] = await db.query(
      'INSERT INTO bookings (booking_ref, customer_id, category_id, pickup_lat, pickup_lng, pickup_address, status, estimated_fare, distance_km, payment_method, additional_fields, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        bookingRef,
        data.customer_id,
        data.category_id,
        data.pickup_lat,
        data.pickup_lng,
        data.pickup_address,
        'pending',
        data.estimated_fare,
        data.distance_km,
        data.payment_method || 'cash',
        JSON.stringify(data.additional_fields || {}),
        data.notes || null
      ]
    );
    
    const bookingId = result.insertId;
    await db.query(
      'INSERT INTO booking_status_history (booking_id, status, changed_by, changed_by_role) VALUES (?, ?, ?, ?)',
      [bookingId, 'pending', data.customer_id, 'customer']
    );
    
    return { id: bookingId, booking_ref: bookingRef };
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.provider_id !== undefined) {
      fields.push('provider_id = ?');
      values.push(data.provider_id);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.final_fare !== undefined) {
      fields.push('final_fare = ?');
      values.push(data.final_fare);
    }
    if (data.payment_status !== undefined) {
      fields.push('payment_status = ?');
      values.push(data.payment_status);
    }
    if (data.distance_km !== undefined) {
      fields.push('distance_km = ?');
      values.push(data.distance_km);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await db.query(
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async addStatusHistory(bookingId, status, changedBy, changedByRole, notes = null) {
    await db.query(
      'INSERT INTO booking_status_history (booking_id, status, changed_by, changed_by_role, notes) VALUES (?, ?, ?, ?, ?)',
      [bookingId, status, changedBy, changedByRole, notes]
    );
  }

  static async getStatusHistory(bookingId) {
    const [history] = await db.query(
      'SELECT * FROM booking_status_history WHERE booking_id = ? ORDER BY created_at ASC',
      [bookingId]
    );
    return history;
  }

  static async getCustomerBookings(customerId, page = 1, limit = 20) {
    const [bookings] = await db.query(`
      SELECT b.*, cat.name_en as category_name, cat.icon_emoji
      FROM bookings b
      LEFT JOIN service_categories cat ON b.category_id = cat.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `, [customerId, limit, (page - 1) * limit]);
    return bookings;
  }

  static async getProviderBookings(providerId, page = 1, limit = 20) {
    const [bookings] = await db.query(`
      SELECT b.*, cat.name_en as category_name, cat.icon_emoji,
             c.full_name as customer_name, c.phone_number as customer_phone
      FROM bookings b
      LEFT JOIN service_categories cat ON b.category_id = cat.id
      JOIN users c ON b.customer_id = c.id
      WHERE b.provider_id = ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `, [providerId, limit, (page - 1) * limit]);
    return bookings;
  }

  static async getProviderActiveBooking(providerId) {
    const [bookings] = await db.query(`
      SELECT b.*, cat.name_en as category_name, cat.icon_emoji,
             c.full_name as customer_name, c.phone_number as customer_phone
      FROM bookings b
      LEFT JOIN service_categories cat ON b.category_id = cat.id
      JOIN users c ON b.customer_id = c.id
      WHERE b.provider_id = ? AND b.status IN ('accepted', 'en_route', 'arrived', 'in_progress')
      ORDER BY b.created_at DESC
      LIMIT 1
    `, [providerId]);
    return bookings[0] || null;
  }

  static async getAllBookings(filters = {}) {
    let query = `
      SELECT b.*, 
             c.full_name as customer_name, c.phone_number as customer_phone,
             p.user_id as provider_user_id, u.full_name as provider_name,
             cat.name_en as category_name, cat.icon_emoji
      FROM bookings b
      JOIN users c ON b.customer_id = c.id
      LEFT JOIN service_providers p ON b.provider_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN service_categories cat ON b.category_id = cat.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }
    
    if (filters.category_id) {
      query += ' AND b.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.payment_method) {
      query += ' AND b.payment_method = ?';
      params.push(filters.payment_method);
    }
    
    if (filters.date_from) {
      query += ' AND DATE(b.created_at) >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      query += ' AND DATE(b.created_at) <= ?';
      params.push(filters.date_to);
    }
    
    if (filters.search) {
      query += ' AND (b.booking_ref LIKE ? OR c.full_name LIKE ? OR u.full_name LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, (filters.page - 1) * filters.limit);
    }
    
    const [bookings] = await db.query(query, params);
    return bookings;
  }

  static async getStats() {
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURDATE()) as today_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status IN ('accepted', 'en_route', 'arrived', 'in_progress')) as active_bookings,
        (SELECT COALESCE(SUM(final_fare), 0) FROM bookings WHERE DATE(created_at) = CURDATE() AND payment_status = 'paid') as today_revenue,
        (SELECT COALESCE(SUM(final_fare), 0) FROM bookings WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND payment_status = 'paid') as month_revenue
    `);
    return result[0];
  }
}

module.exports = Booking;
