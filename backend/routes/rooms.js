const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRoom } = require('../middleware/validation');

const router = express.Router();

// Get all rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, room_type, available_from, available_to } = req.query;
    
    let query = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (room_type) {
      query += ' AND room_type = ?';
      params.push(room_type);
    }

    // Check availability for specific date range
    if (available_from && available_to) {
      query += ` AND id NOT IN (
        SELECT room_id FROM bookings 
        WHERE booking_status IN ('confirmed', 'checked_in') 
        AND (
          (check_in_date <= ? AND check_out_date > ?) OR
          (check_in_date < ? AND check_out_date >= ?) OR
          (check_in_date >= ? AND check_out_date <= ?)
        )
      )`;
      params.push(available_to, available_from, available_to, available_to, available_from, available_to);
    }

    query += ' ORDER BY room_number';

    const [rooms] = await db.execute(query, params);
    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single room
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rooms] = await db.execute(
      'SELECT * FROM rooms WHERE id = ?',
      [req.params.id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(rooms[0]);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new room
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), validateRoom, async (req, res) => {
  try {
    const { room_number, room_type, price_per_night, capacity, amenities, description } = req.body;

    // Check if room number already exists
    const [existingRooms] = await db.execute(
      'SELECT id FROM rooms WHERE room_number = ?',
      [room_number]
    );

    if (existingRooms.length > 0) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO rooms (room_number, room_type, price_per_night, capacity, amenities, description) VALUES (?, ?, ?, ?, ?, ?)',
      [room_number, room_type, price_per_night, capacity, amenities, description]
    );

    res.status(201).json({
      message: 'Room created successfully',
      roomId: result.insertId
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update room
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), validateRoom, async (req, res) => {
  try {
    const { room_number, room_type, price_per_night, capacity, amenities, status, description } = req.body;

    // Check if room exists
    const [existingRooms] = await db.execute(
      'SELECT id FROM rooms WHERE id = ?',
      [req.params.id]
    );

    if (existingRooms.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room number is being changed and if it conflicts
    const [conflictRooms] = await db.execute(
      'SELECT id FROM rooms WHERE room_number = ? AND id != ?',
      [room_number, req.params.id]
    );

    if (conflictRooms.length > 0) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    await db.execute(
      'UPDATE rooms SET room_number = ?, room_type = ?, price_per_night = ?, capacity = ?, amenities = ?, status = ?, description = ? WHERE id = ?',
      [room_number, room_type, price_per_night, capacity, amenities, status, description, req.params.id]
    );

    res.json({ message: 'Room updated successfully' });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete room
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Check if room has active bookings
    const [activeBookings] = await db.execute(
      'SELECT id FROM bookings WHERE room_id = ? AND booking_status IN ("confirmed", "checked_in")',
      [req.params.id]
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete room with active bookings' 
      });
    }

    const [result] = await db.execute(
      'DELETE FROM rooms WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update room status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'occupied', 'maintenance', 'cleaning'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.execute(
      'UPDATE rooms SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ message: 'Room status updated successfully' });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;