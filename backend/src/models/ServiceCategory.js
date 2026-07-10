const db = require('../config/db');

class ServiceCategory {
  static async findAll(includeInactive = false) {
    let query = 'SELECT * FROM service_categories';
    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY sort_order ASC';
    
    const [categories] = await db.query(query);
    return categories;
  }

  static async findById(id) {
    const [categories] = await db.query(
      'SELECT * FROM service_categories WHERE id = ?',
      [id]
    );
    return categories[0] || null;
  }

  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO service_categories (name_en, name_ur, icon_emoji, base_fare, price_per_km, estimated_time_minutes, is_active, required_fields, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.name_en,
        data.name_ur || null,
        data.icon_emoji || null,
        data.base_fare || 0,
        data.price_per_km || 0,
        data.estimated_time_minutes || 30,
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
        JSON.stringify(data.required_fields || []),
        data.sort_order || 0
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.name_en !== undefined) {
      fields.push('name_en = ?');
      values.push(data.name_en);
    }
    if (data.name_ur !== undefined) {
      fields.push('name_ur = ?');
      values.push(data.name_ur);
    }
    if (data.icon_emoji !== undefined) {
      fields.push('icon_emoji = ?');
      values.push(data.icon_emoji);
    }
    if (data.base_fare !== undefined) {
      fields.push('base_fare = ?');
      values.push(data.base_fare);
    }
    if (data.price_per_km !== undefined) {
      fields.push('price_per_km = ?');
      values.push(data.price_per_km);
    }
    if (data.estimated_time_minutes !== undefined) {
      fields.push('estimated_time_minutes = ?');
      values.push(data.estimated_time_minutes);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    if (data.required_fields !== undefined) {
      fields.push('required_fields = ?');
      values.push(JSON.stringify(data.required_fields));
    }
    if (data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(data.sort_order);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await db.query(
      `UPDATE service_categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async softDelete(id) {
    await db.query(
      'UPDATE service_categories SET is_active = 0 WHERE id = ?',
      [id]
    );
  }

  static async delete(id) {
    await db.query(
      'DELETE FROM service_categories WHERE id = ?',
      [id]
    );
  }

  static async getStats(id) {
    const [result] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM service_providers WHERE service_category_id = ?) as provider_count,
        (SELECT COUNT(*) FROM bookings WHERE category_id = ?) as booking_count,
        (SELECT COALESCE(SUM(final_fare), 0) FROM bookings WHERE category_id = ? AND payment_status = 'paid') as revenue
    `, [id, id, id]);
    return result[0];
  }
}

module.exports = ServiceCategory;
