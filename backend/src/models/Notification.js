const db = require('../config/db');

class Notification {
  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title_en, title_ur, body_en, body_ur, type, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        data.user_id || null,
        data.title_en,
        data.title_ur || null,
        data.body_en,
        data.body_ur || null,
        data.type || 'system',
        JSON.stringify(data.data || {})
      ]
    );
    return result.insertId;
  }

  static async findByUserId(userId, page = 1, limit = 20) {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?',
      [userId, limit, (page - 1) * limit]
    );
    return notifications;
  }

  static async markAsRead(id) {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );
  }

  static async markAllAsRead(userId) {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
  }

  static async getUnreadCount(userId) {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result[0].count;
  }

  static async getHistory(page = 1, limit = 20) {
    const [notifications] = await db.query(`
      SELECT n.*, u.full_name as user_name, u.role
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.sent_at DESC
      LIMIT ? OFFSET ?
    `, [limit, (page - 1) * limit]);
    return notifications;
  }
}

module.exports = Notification;
