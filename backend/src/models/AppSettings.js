const db = require('../config/db');

class AppSettings {
  static async getAll() {
    const [settings] = await db.query(
      'SELECT * FROM app_settings ORDER BY category, setting_key'
    );
    
    const grouped = {};
    settings.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });
    
    return grouped;
  }

  static async get(key) {
    const [settings] = await db.query(
      'SELECT * FROM app_settings WHERE setting_key = ?',
      [key]
    );
    return settings[0] || null;
  }

  static async set(key, value, type = 'string', updatedBy = null) {
    let dbValue = value;
    if (type === 'boolean') {
      dbValue = value ? 'true' : 'false';
    } else if (type === 'number') {
      dbValue = String(value);
    } else if (type === 'json') {
      dbValue = JSON.stringify(value);
    }
    
    await db.query(
      'INSERT INTO app_settings (setting_key, setting_value, setting_type, updated_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?, updated_at = NOW(), updated_by = ?',
      [key, dbValue, type, updatedBy, dbValue, type, updatedBy]
    );
  }

  static async update(key, value, updatedBy = null) {
    const setting = await this.get(key);
    if (!setting) return null;
    
    let dbValue = value;
    if (setting.setting_type === 'boolean') {
      dbValue = value ? 'true' : 'false';
    } else if (setting.setting_type === 'number') {
      dbValue = String(value);
    } else if (setting.setting_type === 'json') {
      dbValue = JSON.stringify(value);
    }
    
    await db.query(
      'UPDATE app_settings SET setting_value = ?, updated_at = NOW(), updated_by = ? WHERE setting_key = ?',
      [dbValue, updatedBy, key]
    );
    
    return await this.get(key);
  }
}

module.exports = AppSettings;
