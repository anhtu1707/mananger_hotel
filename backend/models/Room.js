const BaseModel = require('./BaseModel');

class Room extends BaseModel {
  constructor() {
    super('rooms');
  }

  // Check if room number exists
  async roomNumberExists(roomNumber, excludeId = null) {
    if (excludeId) {
      const [rows] = await this.query(
        'SELECT COUNT(*) as count FROM rooms WHERE room_number = ? AND id != ?',
        [roomNumber, excludeId]
      );
      return rows[0].count > 0;
    }
    return this.exists({ room_number: roomNumber });
  }

  // Get rooms by status
  async findByStatus(status) {
    return this.findAll({ status }, { 
      orderBy: 'room_number', 
      orderDirection: 'ASC' 
    });
  }

  // Get rooms by type
  async findByType(roomType) {
    return this.findAll({ room_type: roomType }, { 
      orderBy: 'room_number', 
      orderDirection: 'ASC' 
    });
  }

  // Get available rooms for date range
  async getAvailableRooms(checkInDate, checkOutDate, excludeBookingId = null) {
    let query = `
      SELECT r.* FROM rooms r 
      WHERE r.status = 'available' 
      AND r.id NOT IN (
        SELECT room_id FROM bookings 
        WHERE booking_status IN ('confirmed', 'checked_in') 
        AND (
          (check_in_date <= ? AND check_out_date > ?) OR
          (check_in_date < ? AND check_out_date >= ?) OR
          (check_in_date >= ? AND check_out_date <= ?)
        )
    `;
    
    const params = [checkOutDate, checkInDate, checkOutDate, checkOutDate, checkInDate, checkOutDate];
    
    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }
    
    query += ') ORDER BY room_number ASC';
    
    return this.query(query, params);
  }

  // Update room status
  async updateStatus(id, status) {
    return this.update(id, { status });
  }

  // Get room statistics
  async getStats() {
    const [stats] = await this.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN status = 'cleaning' THEN 1 ELSE 0 END) as cleaning,
        SUM(CASE WHEN room_type = 'single' THEN 1 ELSE 0 END) as single_rooms,
        SUM(CASE WHEN room_type = 'double' THEN 1 ELSE 0 END) as double_rooms,
        SUM(CASE WHEN room_type = 'suite' THEN 1 ELSE 0 END) as suite_rooms,
        SUM(CASE WHEN room_type = 'deluxe' THEN 1 ELSE 0 END) as deluxe_rooms,
        AVG(price_per_night) as avg_price
      FROM rooms
    `);
    return stats[0];
  }

  // Get rooms with filters
  async findWithFilters(filters = {}) {
    const { status, room_type, min_price, max_price, capacity, search } = filters;
    let conditions = {};
    let additionalWhere = [];
    let params = [];

    // Basic equality conditions
    if (status) conditions.status = status;
    if (room_type) conditions.room_type = room_type;
    if (capacity) conditions.capacity = capacity;

    // Price range
    if (min_price) {
      additionalWhere.push('price_per_night >= ?');
      params.push(min_price);
    }
    if (max_price) {
      additionalWhere.push('price_per_night <= ?');
      params.push(max_price);
    }

    // Search in room number, amenities, or description
    if (search) {
      additionalWhere.push('(room_number LIKE ? OR amenities LIKE ? OR description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Build query
    let query = 'SELECT * FROM rooms';
    let queryParams = [];

    // Add basic conditions
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      queryParams.push(...Object.values(conditions));
    }

    // Add additional conditions
    if (additionalWhere.length > 0) {
      const connector = Object.keys(conditions).length > 0 ? ' AND ' : ' WHERE ';
      query += connector + additionalWhere.join(' AND ');
      queryParams.push(...params);
    }

    query += ' ORDER BY room_number ASC';

    return this.query(query, queryParams);
  }

  // Check room availability conflicts
  async hasBookingConflict(roomId, checkInDate, checkOutDate, excludeBookingId = null) {
    let query = `
      SELECT COUNT(*) as conflicts FROM bookings 
      WHERE room_id = ? AND booking_status IN ('confirmed', 'checked_in')
      AND (
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date < ? AND check_out_date >= ?) OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `;
    
    const params = [roomId, checkOutDate, checkInDate, checkOutDate, checkOutDate, checkInDate, checkOutDate];
    
    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }
    
    const [result] = await this.query(query, params);
    return result[0].conflicts > 0;
  }
}

module.exports = new Room();