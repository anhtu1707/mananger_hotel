const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

const router = express.Router();

// Get all bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, room_id, guest_id, start_date, end_date, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT b.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email,
             r.room_number, r.room_type, s.name as created_by_name
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN staff s ON b.created_by = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND b.booking_status = ?';
      params.push(status);
    }

    if (room_id) {
      query += ' AND b.room_id = ?';
      params.push(room_id);
    }

    if (guest_id) {
      query += ' AND b.guest_id = ?';
      params.push(guest_id);
    }

    if (start_date) {
      query += ' AND b.check_in_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND b.check_out_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [bookings] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM bookings b WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND b.booking_status = ?';
      countParams.push(status);
    }
    if (room_id) {
      countQuery += ' AND b.room_id = ?';
      countParams.push(room_id);
    }
    if (guest_id) {
      countQuery += ' AND b.guest_id = ?';
      countParams.push(guest_id);
    }
    if (start_date) {
      countQuery += ' AND b.check_in_date >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ' AND b.check_out_date <= ?';
      countParams.push(end_date);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    
    res.json({
      bookings,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await db.execute(`
      SELECT b.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email,
             g.address as guest_address, g.id_type, g.id_number,
             r.room_number, r.room_type, r.amenities, s.name as created_by_name
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN staff s ON b.created_by = s.id
      WHERE b.id = ?
    `, [req.params.id]);

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get payment history
    const [payments] = await db.execute(`
      SELECT p.*, s.name as created_by_name
      FROM payments p
      LEFT JOIN staff s ON p.created_by = s.id
      WHERE p.booking_id = ?
      ORDER BY p.payment_date DESC
    `, [req.params.id]);

    res.json({
      ...bookings[0],
      payments
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new booking
router.post('/', authenticateToken, validateBooking, async (req, res) => {
  try {
    const { guest_id, room_id, check_in_date, check_out_date, total_amount, special_requests } = req.body;

    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Check room availability
    const [conflictBookings] = await db.execute(`
      SELECT id FROM bookings 
      WHERE room_id = ? AND booking_status IN ('confirmed', 'checked_in')
      AND (
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date < ? AND check_out_date >= ?) OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `, [room_id, check_out_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);

    if (conflictBookings.length > 0) {
      return res.status(400).json({ message: 'Room is not available for the selected dates' });
    }

    // Verify guest and room exist
    const [guests] = await db.execute('SELECT id FROM guests WHERE id = ?', [guest_id]);
    const [rooms] = await db.execute('SELECT id FROM rooms WHERE id = ?', [room_id]);

    if (guests.length === 0) {
      return res.status(400).json({ message: 'Guest not found' });
    }

    if (rooms.length === 0) {
      return res.status(400).json({ message: 'Room not found' });
    }

    const [result] = await db.execute(
      'INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, total_amount, special_requests, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [guest_id, room_id, check_in_date, check_out_date, total_amount, special_requests, req.user.id]
    );

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update booking
router.put('/:id', authenticateToken, validateBooking, async (req, res) => {
  try {
    const { guest_id, room_id, check_in_date, check_out_date, total_amount, special_requests } = req.body;

    // Check if booking exists and can be modified
    const [existingBookings] = await db.execute(
      'SELECT booking_status FROM bookings WHERE id = ?',
      [req.params.id]
    );

    if (existingBookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (['checked_out', 'cancelled'].includes(existingBookings[0].booking_status)) {
      return res.status(400).json({ message: 'Cannot modify completed or cancelled booking' });
    }

    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Check room availability (excluding current booking)
    const [conflictBookings] = await db.execute(`
      SELECT id FROM bookings 
      WHERE room_id = ? AND id != ? AND booking_status IN ('confirmed', 'checked_in')
      AND (
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date < ? AND check_out_date >= ?) OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `, [room_id, req.params.id, check_out_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);

    if (conflictBookings.length > 0) {
      return res.status(400).json({ message: 'Room is not available for the selected dates' });
    }

    await db.execute(
      'UPDATE bookings SET guest_id = ?, room_id = ?, check_in_date = ?, check_out_date = ?, total_amount = ?, special_requests = ? WHERE id = ?',
      [guest_id, room_id, check_in_date, check_out_date, total_amount, special_requests, req.params.id]
    );

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check-in
router.post('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await db.execute(
      'SELECT booking_status, room_id FROM bookings WHERE id = ?',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (bookings[0].booking_status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be checked in' });
    }

    const now = new Date();

    // Update booking status and check-in time
    await db.execute(
      'UPDATE bookings SET booking_status = "checked_in", actual_check_in = ? WHERE id = ?',
      [now, req.params.id]
    );

    // Update room status to occupied
    await db.execute(
      'UPDATE rooms SET status = "occupied" WHERE id = ?',
      [bookings[0].room_id]
    );

    res.json({ message: 'Check-in completed successfully' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check-out
router.post('/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await db.execute(
      'SELECT booking_status, room_id, total_amount, paid_amount FROM bookings WHERE id = ?',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (bookings[0].booking_status !== 'checked_in') {
      return res.status(400).json({ message: 'Only checked-in bookings can be checked out' });
    }

    // Check if payment is complete (optional - you might want to allow partial payments)
    const remainingAmount = bookings[0].total_amount - bookings[0].paid_amount;
    if (remainingAmount > 0) {
      return res.status(400).json({ 
        message: `Payment incomplete. Remaining amount: $${remainingAmount.toFixed(2)}` 
      });
    }

    const now = new Date();

    // Update booking status and check-out time
    await db.execute(
      'UPDATE bookings SET booking_status = "checked_out", actual_check_out = ? WHERE id = ?',
      [now, req.params.id]
    );

    // Update room status to cleaning
    await db.execute(
      'UPDATE rooms SET status = "cleaning" WHERE id = ?',
      [bookings[0].room_id]
    );

    res.json({ message: 'Check-out completed successfully' });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel booking
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await db.execute(
      'SELECT booking_status, room_id FROM bookings WHERE id = ?',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (['checked_out', 'cancelled'].includes(bookings[0].booking_status)) {
      return res.status(400).json({ message: 'Cannot cancel completed or already cancelled booking' });
    }

    // Update booking status
    await db.execute(
      'UPDATE bookings SET booking_status = "cancelled" WHERE id = ?',
      [req.params.id]
    );

    // If room was occupied, set it to cleaning
    if (bookings[0].booking_status === 'checked_in') {
      await db.execute(
        'UPDATE rooms SET status = "cleaning" WHERE id = ?',
        [bookings[0].room_id]
      );
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add payment
router.post('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { amount, payment_method, reference_number, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    if (!['cash', 'card', 'transfer', 'check'].includes(payment_method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Get booking details
    const [bookings] = await db.execute(
      'SELECT total_amount, paid_amount FROM bookings WHERE id = ?',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const remainingAmount = bookings[0].total_amount - bookings[0].paid_amount;
    
    if (amount > remainingAmount) {
      return res.status(400).json({ 
        message: `Payment amount exceeds remaining balance of $${remainingAmount.toFixed(2)}` 
      });
    }

    // Add payment record
    await db.execute(
      'INSERT INTO payments (booking_id, amount, payment_method, reference_number, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, amount, payment_method, reference_number, notes, req.user.id]
    );

    // Update booking paid amount and payment status
    const newPaidAmount = parseFloat(bookings[0].paid_amount) + parseFloat(amount);
    let paymentStatus = 'partial';
    
    if (newPaidAmount >= bookings[0].total_amount) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    await db.execute(
      'UPDATE bookings SET paid_amount = ?, payment_status = ? WHERE id = ?',
      [newPaidAmount, paymentStatus, req.params.id]
    );

    res.json({ 
      message: 'Payment added successfully',
      remainingAmount: bookings[0].total_amount - newPaidAmount
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;