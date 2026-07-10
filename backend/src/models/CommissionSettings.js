const db = require('../config/db');

class CommissionSettings {
  static async getAll() {
    const [settings] = await db.query(`
      SELECT cs.*, sc.name_en as category_name
      FROM commission_settings cs
      LEFT JOIN service_categories sc ON cs.category_id = sc.id
      WHERE cs.is_active = 1
      ORDER BY cs.is_global DESC, cs.effective_from DESC
    `);
    return settings;
  }

  static async getGlobal() {
    const [settings] = await db.query(
      'SELECT * FROM commission_settings WHERE is_global = 1 AND is_active = 1 ORDER BY effective_from DESC LIMIT 1'
    );
    return settings[0] || null;
  }

  static async getByCategoryId(categoryId) {
    const [settings] = await db.query(
      'SELECT * FROM commission_settings WHERE category_id = ? AND is_active = 1 ORDER BY effective_from DESC LIMIT 1',
      [categoryId]
    );
    return settings[0] || null;
  }

  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO commission_settings (category_id, commission_percentage, is_global, created_by, is_active) VALUES (?, ?, ?, ?, 1)',
      [
        data.category_id || null,
        data.commission_percentage,
        data.is_global ? 1 : 0,
        data.created_by || null
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.commission_percentage !== undefined) {
      fields.push('commission_percentage = ?');
      values.push(data.commission_percentage);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await db.query(
      `UPDATE commission_settings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
}

module.exports = CommissionSettings;
