const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all guests with search and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT g.*, 
             COUNT(b.id) as total_bookings,
             MAX(b.check_out_date) as last_visit
      FROM guests g
      LEFT JOIN bookings b ON g.id = b.guest_id
    `;
    
    const params = [];

    if (search) {
      query += ` WHERE (g.first_name LIKE ? OR g.last_name LIKE ? OR g.email LIKE ? OR g.phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY g.id ORDER BY g.created_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await db.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(DISTINCT g.id) as total FROM guests g`;
    if (search) {
      countQuery += ` WHERE (g.first_name LIKE ? OR g.last_name LIKE ? OR g.email LIKE ? OR g.phone LIKE ?)`;
    }

    const [countResult] = await db.execute(countQuery, params.slice(0, search ? 4 : 0));
    const total = countResult[0].total;

    res.json({
      guests: rows,
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

// Get guest by ID with booking history
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [guests] = await db.execute(
      'SELECT * FROM guests WHERE id = ?',
      [req.params.id]
    );

    if (guests.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    const guest = guests[0];

    // Get booking history
    const [bookings] = await db.execute(`
      SELECT b.*, r.room_number, rt.name as room_type_name
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE b.guest_id = ?
      ORDER BY b.check_in_date DESC
    `, [req.params.id]);

    guest.bookings = bookings;

    res.json(guest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new guest
router.post('/', [
  authMiddleware,
  body('first_name').notEmpty().isLength({ min: 1, max: 100 }),
  body('last_name').notEmpty().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isLength({ min: 10, max: 20 }),
  body('id_type').optional().isIn(['passport', 'driver_license', 'national_id']),
  body('date_of_birth').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      first_name, last_name, email, phone, address,
      id_type, id_number, date_of_birth, nationality
    } = req.body;

    // Check if email already exists (if provided)
    if (email) {
      const [existing] = await db.execute(
        'SELECT id FROM guests WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Insert new guest
    const [result] = await db.execute(`
      INSERT INTO guests (first_name, last_name, email, phone, address, id_type, id_number, date_of_birth, nationality)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [first_name, last_name, email, phone, address, id_type, id_number, date_of_birth, nationality]);

    res.status(201).json({ 
      message: 'Guest created successfully', 
      guestId: result.insertId 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update guest
router.put('/:id', [
  authMiddleware,
  body('first_name').optional().isLength({ min: 1, max: 100 }),
  body('last_name').optional().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isLength({ min: 10, max: 20 }),
  body('id_type').optional().isIn(['passport', 'driver_license', 'national_id']),
  body('date_of_birth').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      first_name, last_name, email, phone, address,
      id_type, id_number, date_of_birth, nationality
    } = req.body;

    // Check if guest exists
    const [existing] = await db.execute('SELECT id FROM guests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Check if email already exists (excluding current guest)
    if (email) {
      const [duplicate] = await db.execute(
        'SELECT id FROM guests WHERE email = ? AND id != ?',
        [email, req.params.id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update guest
    const updateFields = [];
    const updateValues = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (id_type !== undefined) {
      updateFields.push('id_type = ?');
      updateValues.push(id_type);
    }
    if (id_number !== undefined) {
      updateFields.push('id_number = ?');
      updateValues.push(id_number);
    }
    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth);
    }
    if (nationality !== undefined) {
      updateFields.push('nationality = ?');
      updateValues.push(nationality);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(req.params.id);

    await db.execute(
      `UPDATE guests SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Guest updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete guest
router.delete('/:id', [
  authMiddleware,
  authorize('admin', 'manager')
], async (req, res) => {
  try {
    // Check if guest has active bookings
    const [bookings] = await db.execute(
      'SELECT id FROM bookings WHERE guest_id = ? AND status IN ("confirmed", "checked_in")',
      [req.params.id]
    );

    if (bookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete guest with active bookings' 
      });
    }

    // Delete guest
    const [result] = await db.execute('DELETE FROM guests WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json({ message: 'Guest deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search guests by name, email, or phone
router.get('/search/:term', authMiddleware, async (req, res) => {
  try {
    const searchTerm = `%${req.params.term}%`;
    
    const [rows] = await db.execute(`
      SELECT id, first_name, last_name, email, phone
      FROM guests 
      WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY first_name, last_name
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm, searchTerm]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;