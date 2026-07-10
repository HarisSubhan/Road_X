const db = require('../config/db');
const bcrypt = require('bcryptjs');

class AdminUser {
  static async findByUsername(username) {
    const [admins] = await db.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );
    return admins[0] || null;
  }

  static async findById(id) {
    const [admins] = await db.query(
      'SELECT * FROM admin_users WHERE id = ?',
      [id]
    );
    return admins[0] || null;
  }

  static async updateLastLogin(id) {
    await db.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [id]
    );
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, 10);
  }
}

module.exports = AdminUser;
