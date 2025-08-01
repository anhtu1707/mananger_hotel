const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateGuest } = require('../middleware/validation');

const router = express.Router();

// Get all guests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM guests WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [guests] = await db.execute(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM guests WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id_number LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    
    res.json({
      guests,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single guest with booking history
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [guests] = await db.execute(
      'SELECT * FROM guests WHERE id = ?',
      [req.params.id]
    );

    if (guests.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Get booking history
    const [bookings] = await db.execute(`
      SELECT b.*, r.room_number, r.room_type, s.name as created_by_name
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN staff s ON b.created_by = s.id
      WHERE b.guest_id = ?
      ORDER BY b.created_at DESC
    `, [req.params.id]);

    res.json({
      ...guests[0],
      bookings
    });
  } catch (error) {
    console.error('Get guest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new guest
router.post('/', authenticateToken, validateGuest, async (req, res) => {
  try {
    const { name, email, phone, address, id_type, id_number } = req.body;

    // Check if guest with same ID already exists
    const [existingGuests] = await db.execute(
      'SELECT id FROM guests WHERE id_type = ? AND id_number = ?',
      [id_type, id_number]
    );

    if (existingGuests.length > 0) {
      return res.status(400).json({ message: 'Guest with this ID already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO guests (name, email, phone, address, id_type, id_number) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, address, id_type, id_number]
    );

    res.status(201).json({
      message: 'Guest created successfully',
      guestId: result.insertId
    });
  } catch (error) {
    console.error('Create guest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update guest
router.put('/:id', authenticateToken, validateGuest, async (req, res) => {
  try {
    const { name, email, phone, address, id_type, id_number } = req.body;

    // Check if guest exists
    const [existingGuests] = await db.execute(
      'SELECT id FROM guests WHERE id = ?',
      [req.params.id]
    );

    if (existingGuests.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Check if ID is being changed and if it conflicts
    const [conflictGuests] = await db.execute(
      'SELECT id FROM guests WHERE id_type = ? AND id_number = ? AND id != ?',
      [id_type, id_number, req.params.id]
    );

    if (conflictGuests.length > 0) {
      return res.status(400).json({ message: 'Guest with this ID already exists' });
    }

    await db.execute(
      'UPDATE guests SET name = ?, email = ?, phone = ?, address = ?, id_type = ?, id_number = ? WHERE id = ?',
      [name, email, phone, address, id_type, id_number, req.params.id]
    );

    res.json({ message: 'Guest updated successfully' });
  } catch (error) {
    console.error('Update guest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete guest
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    // Check if guest has active bookings
    const [activeBookings] = await db.execute(
      'SELECT id FROM bookings WHERE guest_id = ? AND booking_status IN ("confirmed", "checked_in")',
      [req.params.id]
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete guest with active bookings' 
      });
    }

    const [result] = await db.execute(
      'DELETE FROM guests WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Delete guest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search guests (for booking forms)
router.get('/search/:term', authenticateToken, async (req, res) => {
  try {
    const searchTerm = `%${req.params.term}%`;
    
    const [guests] = await db.execute(
      'SELECT id, name, email, phone FROM guests WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? LIMIT 10',
      [searchTerm, searchTerm, searchTerm]
    );

    res.json(guests);
  } catch (error) {
    console.error('Search guests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;