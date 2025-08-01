const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all bookings with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, room_id, guest_id, check_in_from, check_in_to, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT b.*, 
             g.first_name as guest_first_name, g.last_name as guest_last_name, g.email as guest_email, g.phone as guest_phone,
             r.room_number, rt.name as room_type_name,
             s.first_name as created_by_name, s.last_name as created_by_last_name
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN staff s ON b.created_by = s.id
    `;
    
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (room_id) {
      conditions.push('b.room_id = ?');
      params.push(room_id);
    }

    if (guest_id) {
      conditions.push('b.guest_id = ?');
      params.push(guest_id);
    }

    if (check_in_from) {
      conditions.push('b.check_in_date >= ?');
      params.push(check_in_from);
    }

    if (check_in_to) {
      conditions.push('b.check_in_date <= ?');
      params.push(check_in_to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY b.created_at DESC';

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await db.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM bookings b`;
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    res.json({
      bookings: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*, 
             g.first_name as guest_first_name, g.last_name as guest_last_name, g.email as guest_email, 
             g.phone as guest_phone, g.address as guest_address, g.id_type, g.id_number,
             r.room_number, r.floor, rt.name as room_type_name, rt.description, rt.base_price, rt.amenities,
             s.first_name as created_by_name, s.last_name as created_by_last_name
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN staff s ON b.created_by = s.id
      WHERE b.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = {
      ...rows[0],
      amenities: rows[0].amenities ? JSON.parse(rows[0].amenities) : []
    };

    // Get booking services
    const [services] = await db.execute(`
      SELECT bs.*, s.name as service_name, s.description, s.category
      FROM booking_services bs
      LEFT JOIN services s ON bs.service_id = s.id
      WHERE bs.booking_id = ?
      ORDER BY bs.service_date DESC
    `, [req.params.id]);

    booking.services = services;

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new booking
router.post('/', [
  authMiddleware,
  body('guest_id').isInt({ min: 1 }),
  body('room_id').isInt({ min: 1 }),
  body('check_in_date').isISO8601(),
  body('check_out_date').isISO8601(),
  body('total_amount').isFloat({ min: 0 }),
  body('advance_payment').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { guest_id, room_id, check_in_date, check_out_date, total_amount, advance_payment, special_requests } = req.body;

    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    
    if (checkIn >= checkOut) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (checkIn < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    // Check room availability
    const [conflicts] = await db.execute(`
      SELECT id FROM bookings 
      WHERE room_id = ? AND status IN ('confirmed', 'checked_in')
      AND (
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date < ? AND check_out_date >= ?) OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `, [room_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Room is not available for the selected dates' });
    }

    // Create booking
    const [result] = await db.execute(`
      INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, total_amount, advance_payment, special_requests, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [guest_id, room_id, check_in_date, check_out_date, total_amount, advance_payment || 0, special_requests, req.user.id]);

    res.status(201).json({ 
      message: 'Booking created successfully', 
      bookingId: result.insertId 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check-in
router.post('/:id/checkin', [
  authMiddleware,
  authorize('admin', 'manager', 'receptionist')
], async (req, res) => {
  try {
    // Get booking details
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND status = "confirmed"',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found or already checked in' });
    }

    const booking = bookings[0];
    const today = new Date().toISOString().split('T')[0];

    // Check if it's check-in date
    if (booking.check_in_date > today) {
      return res.status(400).json({ message: 'Cannot check in before the scheduled date' });
    }

    // Update booking status and actual check-in time
    await db.execute(
      'UPDATE bookings SET status = "checked_in", actual_check_in = NOW() WHERE id = ?',
      [req.params.id]
    );

    // Update room status to occupied
    await db.execute(
      'UPDATE rooms SET status = "occupied" WHERE id = ?',
      [booking.room_id]
    );

    res.json({ message: 'Check-in successful' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check-out
router.post('/:id/checkout', [
  authMiddleware,
  authorize('admin', 'manager', 'receptionist'),
  body('additional_charges').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const { additional_charges } = req.body;

    // Get booking details
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND status = "checked_in"',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not checked in' });
    }

    const booking = bookings[0];

    // Calculate final amount including services and additional charges
    const [serviceTotal] = await db.execute(
      'SELECT COALESCE(SUM(total_price), 0) as total FROM booking_services WHERE booking_id = ?',
      [req.params.id]
    );

    const finalAmount = parseFloat(booking.total_amount) + parseFloat(serviceTotal[0].total) + parseFloat(additional_charges || 0);

    // Update booking status and actual check-out time
    await db.execute(
      'UPDATE bookings SET status = "checked_out", actual_check_out = NOW(), total_amount = ? WHERE id = ?',
      [finalAmount, req.params.id]
    );

    // Update room status to cleaning
    await db.execute(
      'UPDATE rooms SET status = "cleaning" WHERE id = ?',
      [booking.room_id]
    );

    res.json({ 
      message: 'Check-out successful',
      finalAmount: finalAmount,
      balanceAmount: finalAmount - parseFloat(booking.advance_payment)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.post('/:id/cancel', [
  authMiddleware,
  authorize('admin', 'manager', 'receptionist')
], async (req, res) => {
  try {
    // Check if booking exists and can be cancelled
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND status IN ("confirmed", "checked_in")',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found or cannot be cancelled' });
    }

    const booking = bookings[0];

    // Update booking status
    await db.execute(
      'UPDATE bookings SET status = "cancelled" WHERE id = ?',
      [req.params.id]
    );

    // If room was occupied, update to cleaning
    if (booking.status === 'checked_in') {
      await db.execute(
        'UPDATE rooms SET status = "cleaning" WHERE id = ?',
        [booking.room_id]
      );
    }

    res.json({ message: 'Booking cancelled successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add service to booking
router.post('/:id/services', [
  authMiddleware,
  body('service_id').isInt({ min: 1 }),
  body('quantity').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const { service_id, quantity = 1 } = req.body;

    // Check if booking exists and is active
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND status IN ("confirmed", "checked_in")',
      [req.params.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not active' });
    }

    // Get service details
    const [services] = await db.execute(
      'SELECT * FROM services WHERE id = ? AND is_active = true',
      [service_id]
    );

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found or not available' });
    }

    const service = services[0];
    const totalPrice = parseFloat(service.price) * quantity;

    // Add service to booking
    await db.execute(`
      INSERT INTO booking_services (booking_id, service_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.id, service_id, quantity, service.price, totalPrice]);

    res.json({ message: 'Service added successfully', totalPrice });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;