const db = require('../config/db');

class ProviderDocument {
  static async findByProviderId(providerId) {
    const [documents] = await db.query(
      'SELECT * FROM provider_documents WHERE provider_id = ? ORDER BY document_type',
      [providerId]
    );
    return documents;
  }

  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO provider_documents (provider_id, document_type, file_url, file_name) VALUES (?, ?, ?, ?)',
      [data.provider_id, data.document_type, data.file_url, data.file_name]
    );
    return result.insertId;
  }

  static async delete(id) {
    await db.query(
      'DELETE FROM provider_documents WHERE id = ?',
      [id]
    );
  }

  static async deleteByProviderId(providerId) {
    await db.query(
      'DELETE FROM provider_documents WHERE provider_id = ?',
      [providerId]
    );
  }
}

module.exports = ProviderDocument;
