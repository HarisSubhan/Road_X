const db = require('../config/db');

class Transaction {
  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO transactions (booking_id, customer_id, provider_id, amount, commission_percentage, commission_amount, provider_amount, payment_method, payment_status, gateway_reference, gateway_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.booking_id,
        data.customer_id,
        data.provider_id,
        data.amount,
        data.commission_percentage,
        data.commission_amount,
        data.provider_amount,
        data.payment_method,
        data.payment_status || 'pending',
        data.gateway_reference || null,
        data.gateway_response ? JSON.stringify(data.gateway_response) : null
      ]
    );
    return result.insertId;
  }

  static async findByBookingId(bookingId) {
    const [transactions] = await db.query(
      'SELECT * FROM transactions WHERE booking_id = ?',
      [bookingId]
    );
    return transactions[0] || null;
  }

  static async updateStatus(id, paymentStatus, gatewayResponse = null) {
    const fields = ['payment_status = ?'];
    const values = [paymentStatus];
    
    if (gatewayResponse) {
      fields.push('gateway_response = ?');
      values.push(JSON.stringify(gatewayResponse));
    }
    
    values.push(id);
    await db.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async getEarningsReport(dateFrom, dateTo, groupBy = 'day') {
    let dateFormat = '';
    if (groupBy === 'day') dateFormat = '%Y-%m-%d';
    else if (groupBy === 'week') dateFormat = '%Y-%u';
    else if (groupBy === 'month') dateFormat = '%Y-%m';
    
    const [result] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '${dateFormat}') as period,
        COUNT(*) as transactions,
        SUM(amount) as gross_revenue,
        SUM(commission_amount) as commission,
        SUM(provider_amount) as provider_payout
      FROM transactions
      WHERE payment_status = 'paid' 
        AND DATE(created_at) >= ? 
        AND DATE(created_at) <= ?
      GROUP BY period
      ORDER BY period ASC
    `, [dateFrom, dateTo]);
    
    return result;
  }

  static async getTopProviders(dateFrom, dateTo, limit = 10) {
    const [result] = await db.query(`
      SELECT 
        sp.id,
        u.full_name,
        sp.rating_average,
        COUNT(t.id) as job_count,
        SUM(t.provider_amount) as earnings
      FROM transactions t
      JOIN service_providers sp ON t.provider_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE t.payment_status = 'paid' 
        AND DATE(t.created_at) >= ? 
        AND DATE(t.created_at) <= ?
      GROUP BY sp.id
      ORDER BY earnings DESC
      LIMIT ?
    `, [dateFrom, dateTo, limit]);
    
    return result;
  }

  static async getPaymentMethodBreakdown(dateFrom, dateTo) {
    const [result] = await db.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM transactions
      WHERE payment_status = 'paid' 
        AND DATE(created_at) >= ? 
        AND DATE(created_at) <= ?
      GROUP BY payment_method
    `, [dateFrom, dateTo]);
    
    return result;
  }
}

module.exports = Transaction;
