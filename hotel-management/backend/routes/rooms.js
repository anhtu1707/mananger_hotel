const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all rooms with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, floor, room_type, available_from, available_to } = req.query;
    
    let query = `
      SELECT r.*, rt.name as room_type_name, rt.description, rt.base_price, rt.max_occupancy, rt.amenities
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
    `;
    
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (floor) {
      conditions.push('r.floor = ?');
      params.push(floor);
    }

    if (room_type) {
      conditions.push('r.room_type_id = ?');
      params.push(room_type);
    }

    // Check availability for date range
    if (available_from && available_to) {
      conditions.push(`
        r.id NOT IN (
          SELECT room_id FROM bookings 
          WHERE status IN ('confirmed', 'checked_in') 
          AND (
            (check_in_date <= ? AND check_out_date > ?) OR
            (check_in_date < ? AND check_out_date >= ?) OR
            (check_in_date >= ? AND check_out_date <= ?)
          )
        )
      `);
      params.push(available_from, available_from, available_to, available_to, available_from, available_to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.floor, r.room_number';

    const [rows] = await db.execute(query, params);
    
    // Parse amenities JSON
    const rooms = rows.map(room => ({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : []
    }));

    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.*, rt.name as room_type_name, rt.description, rt.base_price, rt.max_occupancy, rt.amenities
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = {
      ...rows[0],
      amenities: rows[0].amenities ? JSON.parse(rows[0].amenities) : []
    };

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new room
router.post('/', [
  authMiddleware,
  authorize('admin', 'manager'),
  body('room_number').notEmpty().isLength({ min: 1, max: 10 }),
  body('room_type_id').isInt({ min: 1 }),
  body('floor').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room_number, room_type_id, floor, notes } = req.body;

    // Check if room number already exists
    const [existing] = await db.execute(
      'SELECT id FROM rooms WHERE room_number = ?',
      [room_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    // Insert new room
    const [result] = await db.execute(
      'INSERT INTO rooms (room_number, room_type_id, floor, notes, last_cleaned) VALUES (?, ?, ?, ?, NOW())',
      [room_number, room_type_id, floor, notes || null]
    );

    res.status(201).json({ 
      message: 'Room created successfully', 
      roomId: result.insertId 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room
router.put('/:id', [
  authMiddleware,
  authorize('admin', 'manager'),
  body('room_number').optional().isLength({ min: 1, max: 10 }),
  body('room_type_id').optional().isInt({ min: 1 }),
  body('floor').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['available', 'occupied', 'maintenance', 'cleaning'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room_number, room_type_id, floor, status, notes } = req.body;

    // Check if room exists
    const [existing] = await db.execute('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room number already exists (excluding current room)
    if (room_number) {
      const [duplicate] = await db.execute(
        'SELECT id FROM rooms WHERE room_number = ? AND id != ?',
        [room_number, req.params.id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    // Update room
    const updateFields = [];
    const updateValues = [];

    if (room_number !== undefined) {
      updateFields.push('room_number = ?');
      updateValues.push(room_number);
    }
    if (room_type_id !== undefined) {
      updateFields.push('room_type_id = ?');
      updateValues.push(room_type_id);
    }
    if (floor !== undefined) {
      updateFields.push('floor = ?');
      updateValues.push(floor);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // Update last_cleaned if status changed to available
      if (status === 'available') {
        updateFields.push('last_cleaned = NOW()');
      }
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(req.params.id);

    await db.execute(
      `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Room updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete room
router.delete('/:id', [
  authMiddleware,
  authorize('admin')
], async (req, res) => {
  try {
    // Check if room has active bookings
    const [bookings] = await db.execute(
      'SELECT id FROM bookings WHERE room_id = ? AND status IN ("confirmed", "checked_in")',
      [req.params.id]
    );

    if (bookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete room with active bookings' 
      });
    }

    // Delete room
    const [result] = await db.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room types
router.get('/types/all', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM room_types ORDER BY base_price'
    );

    const roomTypes = rows.map(type => ({
      ...type,
      amenities: type.amenities ? JSON.parse(type.amenities) : []
    }));

    res.json(roomTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;