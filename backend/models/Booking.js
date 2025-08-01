const BaseModel = require('./BaseModel');

class Booking extends BaseModel {
  constructor() {
    super('bookings');
  }

  // Get booking with related data (guest, room, staff)
  async findWithDetails(id) {
    const [booking] = await this.query(`
      SELECT b.*, 
             g.name as guest_name, g.phone as guest_phone, g.email as guest_email,
             g.address as guest_address, g.id_type, g.id_number,
             r.room_number, r.room_type, r.amenities, r.price_per_night,
             s.name as created_by_name
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN staff s ON b.created_by = s.id
      WHERE b.id = ?
    `, [id]);

    if (!booking) return null;

    // Get payment history
    const payments = await this.query(`
      SELECT p.*, s.name as created_by_name
      FROM payments p
      LEFT JOIN staff s ON p.created_by = s.id
      WHERE p.booking_id = ?
      ORDER BY p.payment_date DESC
    `, [id]);

    return {
      ...booking,
      payments
    };
  }

  // Get bookings with pagination and filters
  async findWithPagination(options = {}) {
    const { status, room_id, guest_id, start_date, end_date, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT b.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email,
             r.room_number, r.room_type, s.name as created_by_name
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN staff s ON b.created_by = s.id
      WHERE 1=1
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM bookings b WHERE 1=1';
    const params = [];
    const countParams = [];

    // Add filters
    if (status) {
      query += ' AND b.booking_status = ?';
      countQuery += ' AND b.booking_status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (room_id) {
      query += ' AND b.room_id = ?';
      countQuery += ' AND b.room_id = ?';
      params.push(room_id);
      countParams.push(room_id);
    }

    if (guest_id) {
      query += ' AND b.guest_id = ?';
      countQuery += ' AND b.guest_id = ?';
      params.push(guest_id);
      countParams.push(guest_id);
    }

    if (start_date) {
      query += ' AND b.check_in_date >= ?';
      countQuery += ' AND b.check_in_date >= ?';
      params.push(start_date);
      countParams.push(start_date);
    }

    if (end_date) {
      query += ' AND b.check_out_date <= ?';
      countQuery += ' AND b.check_out_date <= ?';
      params.push(end_date);
      countParams.push(end_date);
    }

    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [bookings, countResult] = await Promise.all([
      this.query(query, params),
      this.query(countQuery, countParams)
    ]);

    return {
      bookings,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  }

  // Check room availability for booking dates
  async checkRoomAvailability(roomId, checkInDate, checkOutDate, excludeBookingId = null) {
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
    return result[0].conflicts === 0;
  }

  // Get bookings for today's check-ins
  async getTodayCheckIns() {
    const today = new Date().toISOString().split('T')[0];
    return this.query(`
      SELECT b.*, g.name as guest_name, g.phone as guest_phone, r.room_number
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.check_in_date = ? AND b.booking_status = 'confirmed'
      ORDER BY b.check_in_date ASC
    `, [today]);
  }

  // Get bookings for today's check-outs
  async getTodayCheckOuts() {
    const today = new Date().toISOString().split('T')[0];
    return this.query(`
      SELECT b.*, g.name as guest_name, g.phone as guest_phone, r.room_number
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.check_out_date = ? AND b.booking_status = 'checked_in'
      ORDER BY b.check_out_date ASC
    `, [today]);
  }

  // Check-in a booking
  async checkIn(id, staffId) {
    const now = new Date().toISOString();
    
    // Update booking status
    const booking = await this.update(id, {
      booking_status: 'checked_in',
      actual_check_in: now
    });

    if (booking) {
      // Update room status to occupied
      await this.query('UPDATE rooms SET status = ? WHERE id = ?', ['occupied', booking.room_id]);
    }

    return booking;
  }

  // Check-out a booking
  async checkOut(id, staffId) {
    const booking = await this.findById(id);
    if (!booking) return null;

    // Check if payment is complete
    const remainingAmount = booking.total_amount - booking.paid_amount;
    if (remainingAmount > 0) {
      throw new Error(`Payment incomplete. Remaining amount: $${remainingAmount.toFixed(2)}`);
    }

    const now = new Date().toISOString();
    
    // Update booking status
    const updatedBooking = await this.update(id, {
      booking_status: 'checked_out',
      actual_check_out: now
    });

    if (updatedBooking) {
      // Update room status to cleaning
      await this.query('UPDATE rooms SET status = ? WHERE id = ?', ['cleaning', booking.room_id]);
    }

    return updatedBooking;
  }

  // Cancel a booking
  async cancel(id) {
    const booking = await this.findById(id);
    if (!booking) return null;

    if (['checked_out', 'cancelled'].includes(booking.booking_status)) {
      throw new Error('Cannot cancel completed or already cancelled booking');
    }

    // Update booking status
    const updatedBooking = await this.update(id, { booking_status: 'cancelled' });

    // If room was occupied, set it to cleaning
    if (booking.booking_status === 'checked_in') {
      await this.query('UPDATE rooms SET status = ? WHERE id = ?', ['cleaning', booking.room_id]);
    }

    return updatedBooking;
  }

  // Add payment to booking
  async addPayment(bookingId, paymentData, staffId) {
    const { amount, payment_method, reference_number, notes } = paymentData;

    // Get booking details
    const booking = await this.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const remainingAmount = booking.total_amount - booking.paid_amount;
    
    if (amount > remainingAmount) {
      throw new Error(`Payment amount exceeds remaining balance of $${remainingAmount.toFixed(2)}`);
    }

    // Add payment record
    await this.query(`
      INSERT INTO payments (booking_id, amount, payment_method, reference_number, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [bookingId, amount, payment_method, reference_number, notes, staffId]);

    // Update booking paid amount and payment status
    const newPaidAmount = parseFloat(booking.paid_amount) + parseFloat(amount);
    let paymentStatus = 'partial';
    
    if (newPaidAmount >= booking.total_amount) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    await this.update(bookingId, {
      paid_amount: newPaidAmount,
      payment_status: paymentStatus
    });

    return {
      remainingAmount: booking.total_amount - newPaidAmount
    };
  }

  // Get booking statistics
  async getStats() {
    const [stats] = await this.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN booking_status = 'checked_in' THEN 1 ELSE 0 END) as checked_in,
        SUM(CASE WHEN booking_status = 'checked_out' THEN 1 ELSE 0 END) as checked_out,
        SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(total_amount) as total_revenue,
        SUM(paid_amount) as total_paid,
        AVG(total_amount) as avg_booking_value
      FROM bookings
    `);
    return stats[0];
  }

  // Get recent bookings
  async getRecent(limit = 10) {
    return this.query(`
      SELECT b.id, b.booking_status, b.check_in_date, b.check_out_date, b.total_amount,
             g.name as guest_name, r.room_number, r.room_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
      LIMIT ?
    `, [limit]);
  }

  // Get revenue for a date range
  async getRevenue(startDate, endDate) {
    const [revenue] = await this.query(`
      SELECT 
        SUM(paid_amount) as total_revenue,
        COUNT(*) as total_bookings,
        AVG(paid_amount) as avg_revenue_per_booking
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
    `, [startDate, endDate]);
    
    return revenue[0];
  }
}

module.exports = new Booking();