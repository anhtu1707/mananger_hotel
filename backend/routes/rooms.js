const express = require('express');
const { Room } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRoom } = require('../middleware/validation');

const router = express.Router();

// Get all rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, room_type, available_from, available_to } = req.query;
    
    // Use model's filtering if simple filters
    if (!available_from || !available_to) {
      const filters = {};
      if (status) filters.status = status;
      if (room_type) filters.room_type = room_type;
      
      const rooms = await Room.findAll(filters, { 
        orderBy: 'room_number', 
        orderDirection: 'ASC' 
      });
      return res.json(rooms);
    }

    // Use model's availability check for date range
    const rooms = await Room.getAvailableRooms(available_from, available_to);
    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single room
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
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
    const exists = await Room.roomNumberExists(room_number);
    if (exists) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = await Room.create({
      room_number,
      room_type,
      price_per_night,
      capacity,
      amenities,
      description
    });

    res.status(201).json({
      message: 'Room created successfully',
      room
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
    const existingRoom = await Room.findById(req.params.id);
    if (!existingRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room number is being changed and if it conflicts
    const conflicts = await Room.roomNumberExists(room_number, req.params.id);
    if (conflicts) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const updatedRoom = await Room.update(req.params.id, {
      room_number,
      room_type,
      price_per_night,
      capacity,
      amenities,
      status,
      description
    });

    res.json({ 
      message: 'Room updated successfully',
      room: updatedRoom
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete room
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Check if room has booking conflicts
    const hasConflicts = await Room.hasBookingConflict(req.params.id, new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    
    if (hasConflicts) {
      return res.status(400).json({ 
        message: 'Cannot delete room with active bookings' 
      });
    }

    const deleted = await Room.delete(req.params.id);
    
    if (!deleted) {
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

    const updated = await Room.updateStatus(req.params.id, status);
    
    if (!updated) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room status updated successfully' });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get room statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Room.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Room stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;