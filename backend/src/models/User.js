const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async findByPhone(phoneNumber) {
    const [users] = await db.query(
      'SELECT * FROM users WHERE phone_number = ?',
      [phoneNumber]
    );
    return users[0] || null;
  }

  static async findByEmail(email) {
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  static async findByUsername(username) {
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return users[0] || null;
  }

  static async findById(id) {
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  static async create(data) {
    const fields = ['phone_number', 'full_name', 'role', 'preferred_language', 'email'];
    const values = [data.phone_number, data.full_name || null, data.role || 'customer', data.preferred_language || 'en', data.email || null];
    
    // Add username and password if provided
    if (data.username) {
      fields.push('username');
      values.push(data.username);
    }
    if (data.password) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(data.password, 10);
      fields.push('password_hash');
      values.push(passwordHash);
    }
    
    const query = `INSERT INTO users (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
    const [result] = await db.query(query, values);
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.phone_number !== undefined) {
      fields.push('phone_number = ?');
      values.push(data.phone_number);
    }
    if (data.preferred_language !== undefined) {
      fields.push('preferred_language = ?');
      values.push(data.preferred_language);
    }
    if (data.fcm_token !== undefined) {
      fields.push('fcm_token = ?');
      values.push(data.fcm_token);
    }
    if (data.profile_image !== undefined) {
      fields.push('profile_image = ?');
      values.push(data.profile_image);
    }
    if (data.cnic !== undefined) {
      fields.push('cnic = ?');
      values.push(data.cnic);
    }
    if (data.vehicle_type !== undefined) {
      fields.push('vehicle_type = ?');
      values.push(data.vehicle_type);
    }
    if (data.vehicle_plate !== undefined) {
      fields.push('vehicle_plate = ?');
      values.push(data.vehicle_plate);
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
    if (data.username !== undefined) {
      fields.push('username = ?');
      values.push(data.username);
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.password_hash);
    }
    if (data.email_verified !== undefined) {
      fields.push('email_verified = ?');
      values.push(data.email_verified ? 1 : 0);
    }
    if (data.is_blocked !== undefined) {
      fields.push('is_blocked = ?');
      values.push(data.is_blocked ? 1 : 0);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async updateOTP(id, otpCode, expiresAt) {
    await db.query(
      'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
      [otpCode, expiresAt, id]
    );
  }

  static async clearOTP(id) {
    await db.query(
      'UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
      [id]
    );
  }

  static async getCustomerStats() {
    const [result] = await db.query(
      'SELECT COUNT(*) as total FROM users WHERE role = ? AND is_active = 1',
      ['customer']
    );
    return result[0].total;
  }

  static async getCustomers(page = 1, limit = 20, search = '', status = 'all') {
    let query = 'SELECT id, phone_number, email, full_name, preferred_language, is_active, is_blocked, created_at FROM users WHERE role = ?';
    const params = ['customer'];
    
    if (search) {
      query += ' AND (full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status === 'active') {
      query += ' AND is_active = 1 AND is_blocked = 0';
    } else if (status === 'blocked') {
      query += ' AND is_blocked = 1';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    
    const [users] = await db.query(query, params);
    return users;
  }
}

module.exports = User;
