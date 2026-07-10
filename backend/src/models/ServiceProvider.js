const db = require('../config/db');

class ServiceProvider {
  static async findByUserId(userId) {
    const [providers] = await db.query(
      'SELECT sp.*, sc.name_en as category_name, sc.name_ur as category_name_ur FROM service_providers sp LEFT JOIN service_categories sc ON sp.service_category_id = sc.id WHERE sp.user_id = ?',
      [userId]
    );
    return providers[0] || null;
  }

  static async findById(id) {
    const [providers] = await db.query(
      'SELECT sp.*, u.full_name, u.phone_number, u.email, sc.name_en as category_name FROM service_providers sp JOIN users u ON sp.user_id = u.id LEFT JOIN service_categories sc ON sp.service_category_id = sc.id WHERE sp.id = ?',
      [id]
    );
    return providers[0] || null;
  }

  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO service_providers (user_id, cnic_number, service_category_id, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.user_id,
        data.cnic_number || null,
        data.service_category_id || null,
        data.vehicle_make || null,
        data.vehicle_model || null,
        data.vehicle_year || null,
        data.vehicle_plate || null,
        'pending'
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.cnic_number !== undefined) {
      fields.push('cnic_number = ?');
      values.push(data.cnic_number);
    }
    if (data.service_category_id !== undefined) {
      fields.push('service_category_id = ?');
      values.push(data.service_category_id);
    }
    if (data.vehicle_make !== undefined) {
      fields.push('vehicle_make = ?');
      values.push(data.vehicle_make);
    }
    if (data.vehicle_model !== undefined) {
      fields.push('vehicle_model = ?');
      values.push(data.vehicle_model);
    }
    if (data.vehicle_year !== undefined) {
      fields.push('vehicle_year = ?');
      values.push(data.vehicle_year);
    }
    if (data.vehicle_plate !== undefined) {
      fields.push('vehicle_plate = ?');
      values.push(data.vehicle_plate);
    }
    if (data.approval_status !== undefined) {
      fields.push('approval_status = ?');
      values.push(data.approval_status);
    }
    if (data.rejection_reason !== undefined) {
      fields.push('rejection_reason = ?');
      values.push(data.rejection_reason);
    }
    if (data.approved_at !== undefined) {
      fields.push('approved_at = ?');
      values.push(data.approved_at);
    }
    if (data.approved_by !== undefined) {
      fields.push('approved_by = ?');
      values.push(data.approved_by);
    }
    if (data.is_online !== undefined) {
      fields.push('is_online = ?');
      values.push(data.is_online ? 1 : 0);
    }
    if (data.current_lat !== undefined) {
      fields.push('current_lat = ?');
      values.push(data.current_lat);
    }
    if (data.current_lng !== undefined) {
      fields.push('current_lng = ?');
      values.push(data.current_lng);
    }
    if (data.rating_average !== undefined) {
      fields.push('rating_average = ?');
      values.push(data.rating_average);
    }
    if (data.total_jobs !== undefined) {
      fields.push('total_jobs = ?');
      values.push(data.total_jobs);
    }
    if (data.total_earnings !== undefined) {
      fields.push('total_earnings = ?');
      values.push(data.total_earnings);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await db.query(
      `UPDATE service_providers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async getProviders(filters = {}) {
    let query = `
      SELECT sp.*, u.full_name, u.phone_number, u.email, u.created_at,
             sc.name_en as category_name, sc.icon_emoji,
             (SELECT COUNT(*) FROM provider_documents WHERE provider_id = sp.id) as document_count
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN service_categories sc ON sp.service_category_id = sc.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.approval_status) {
      query += ' AND sp.approval_status = ?';
      params.push(filters.approval_status);
    }
    
    if (filters.category_id) {
      query += ' AND sp.service_category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.search) {
      query += ' AND (u.full_name LIKE ? OR u.phone_number LIKE ? OR sp.cnic_number LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY sp.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, (filters.page - 1) * filters.limit);
    }
    
    const [providers] = await db.query(query, params);
    return providers;
  }

  static async getStats() {
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM service_providers WHERE approval_status = 'approved') as approved_count,
        (SELECT COUNT(*) FROM service_providers WHERE approval_status = 'pending') as pending_count,
        (SELECT COUNT(*) FROM service_providers WHERE approval_status = 'approved' AND is_online = 1) as online_count
    `);
    return result[0];
  }

  static async getNearbyProviders(lat, lng, categoryId, radiusKm) {
    const [providers] = await db.query(`
      SELECT sp.*, pl.latitude, pl.longitude,
             (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(pl.latitude)) * 
              COS(RADIANS(pl.longitude) - RADIANS(?)) + 
              SIN(RADIANS(?)) * SIN(RADIANS(pl.latitude)))) as distance
      FROM service_providers sp
      LEFT JOIN provider_locations pl ON sp.id = pl.provider_id
      WHERE sp.service_category_id = ? 
        AND sp.approval_status = 'approved' 
        AND sp.is_online = 1
        AND pl.latitude IS NOT NULL
        AND pl.longitude IS NOT NULL
      HAVING distance <= ?
      ORDER BY distance ASC
    `, [lat, lng, lat, categoryId, radiusKm]);
    
    return providers;
  }

  static async getEarnings(providerId, period = 'day') {
    let dateCondition = '';
    if (period === 'day') {
      dateCondition = 'DATE(t.created_at) = CURDATE()';
    } else if (period === 'week') {
      dateCondition = 't.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateCondition = 't.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }
    
    const [result] = await db.query(`
      SELECT 
        COALESCE(SUM(t.amount), 0) as gross,
        COALESCE(SUM(t.commission_amount), 0) as commission,
        COALESCE(SUM(t.provider_amount), 0) as net,
        COUNT(*) as transactions
      FROM transactions t
      WHERE t.provider_id = ? AND ${dateCondition}
    `, [providerId]);
    
    return result[0];
  }
}

module.exports = ServiceProvider;
