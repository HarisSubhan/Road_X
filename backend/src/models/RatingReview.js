const db = require('../config/db');

class RatingReview {
  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO ratings_reviews (booking_id, customer_id, provider_id, rating, review) VALUES (?, ?, ?, ?, ?)',
      [data.booking_id, data.customer_id, data.provider_id, data.rating, data.review || null]
    );
    return result.insertId;
  }

  static async findByBookingId(bookingId) {
    const [ratings] = await db.query(
      'SELECT * FROM ratings_reviews WHERE booking_id = ?',
      [bookingId]
    );
    return ratings[0] || null;
  }

  static async findByProviderId(providerId, page = 1, limit = 20) {
    const [ratings] = await db.query(`
      SELECT r.*, u.full_name as customer_name
      FROM ratings_reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.provider_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [providerId, limit, (page - 1) * limit]);
    return ratings;
  }

  static async updateProviderRating(providerId) {
    const [result] = await db.query(`
      UPDATE service_providers 
      SET rating_average = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM ratings_reviews 
        WHERE provider_id = ?
      )
      WHERE id = ?
    `, [providerId, providerId]);
  }
}

module.exports = RatingReview;
