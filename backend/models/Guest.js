const BaseModel = require('./BaseModel');

class Guest extends BaseModel {
  constructor() {
    super('guests');
  }

  // Check if guest with same ID document exists
  async idExists(idType, idNumber, excludeId = null) {
    if (excludeId) {
      const [rows] = await this.query(
        'SELECT COUNT(*) as count FROM guests WHERE id_type = ? AND id_number = ? AND id != ?',
        [idType, idNumber, excludeId]
      );
      return rows[0].count > 0;
    }
    return this.exists({ id_type: idType, id_number: idNumber });
  }

  // Search guests by various fields
  async search(searchTerm, limit = 10) {
    const term = `%${searchTerm}%`;
    return this.query(`
      SELECT * FROM guests 
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR id_number LIKE ?
      ORDER BY name ASC
      LIMIT ?
    `, [term, term, term, term, limit]);
  }

  // Get guest with booking history
  async findWithBookings(id) {
    const guest = await this.findById(id);
    if (!guest) return null;

    const bookings = await this.query(`
      SELECT b.*, r.room_number, r.room_type, s.name as created_by_name
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN staff s ON b.created_by = s.id
      WHERE b.guest_id = ?
      ORDER BY b.created_at DESC
    `, [id]);

    return {
      ...guest,
      bookings
    };
  }

  // Get guests with pagination and search
  async findWithPagination(options = {}) {
    const { search, limit = 50, offset = 0 } = options;
    let query = 'SELECT * FROM guests';
    let countQuery = 'SELECT COUNT(*) as total FROM guests';
    const params = [];
    const countParams = [];

    if (search) {
      const searchClause = ' WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id_number LIKE ?)';
      query += searchClause;
      countQuery += searchClause;
      
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [guests, countResult] = await Promise.all([
      this.query(query, params),
      this.query(countQuery, countParams)
    ]);

    return {
      guests,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  }

  // Get guest statistics
  async getStats() {
    const [stats] = await this.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT email) as unique_emails,
        SUM(CASE WHEN id_type = 'passport' THEN 1 ELSE 0 END) as passport_holders,
        SUM(CASE WHEN id_type = 'license' THEN 1 ELSE 0 END) as license_holders,
        SUM(CASE WHEN id_type = 'national_id' THEN 1 ELSE 0 END) as national_id_holders
      FROM guests
    `);
    return stats[0];
  }

  // Get recent guests
  async getRecent(limit = 10) {
    return this.findAll({}, {
      orderBy: 'created_at',
      orderDirection: 'DESC',
      limit
    });
  }

  // Get guests with active bookings
  async getWithActiveBookings() {
    return this.query(`
      SELECT DISTINCT g.*, b.booking_status, b.check_in_date, b.check_out_date
      FROM guests g
      INNER JOIN bookings b ON g.id = b.guest_id
      WHERE b.booking_status IN ('confirmed', 'checked_in')
      ORDER BY g.name ASC
    `);
  }

  // Get guest booking summary
  async getBookingSummary(id) {
    const [summary] = await this.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN booking_status = 'checked_in' THEN 1 ELSE 0 END) as checked_in_bookings,
        SUM(CASE WHEN booking_status = 'checked_out' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(total_amount) as total_spent,
        SUM(paid_amount) as total_paid,
        MAX(created_at) as last_booking_date
      FROM bookings
      WHERE guest_id = ?
    `, [id]);
    
    return summary[0];
  }

  // Check if guest has active bookings (prevent deletion)
  async hasActiveBookings(id) {
    const [result] = await this.query(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE guest_id = ? AND booking_status IN ('confirmed', 'checked_in')
    `, [id]);
    
    return result[0].count > 0;
  }
}

module.exports = new Guest();