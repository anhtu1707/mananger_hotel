const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview stats
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    // Total rooms
    const [totalRoomsResult] = await db.execute('SELECT COUNT(*) as total FROM rooms');
    
    // Available rooms
    const [availableRoomsResult] = await db.execute('SELECT COUNT(*) as total FROM rooms WHERE status = "available"');
    
    // Occupied rooms
    const [occupiedRoomsResult] = await db.execute('SELECT COUNT(*) as total FROM rooms WHERE status = "occupied"');
    
    // Total bookings today
    const today = new Date().toISOString().split('T')[0];
    const [todayBookingsResult] = await db.execute(
      'SELECT COUNT(*) as total FROM bookings WHERE DATE(created_at) = ?',
      [today]
    );
    
    // Check-ins today
    const [todayCheckInsResult] = await db.execute(
      'SELECT COUNT(*) as total FROM bookings WHERE check_in_date = ? AND booking_status = "confirmed"',
      [today]
    );
    
    // Check-outs today
    const [todayCheckOutsResult] = await db.execute(
      'SELECT COUNT(*) as total FROM bookings WHERE check_out_date = ? AND booking_status = "checked_in"',
      [today]
    );
    
    // Total revenue this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const [monthlyRevenueResult] = await db.execute(
      'SELECT COALESCE(SUM(paid_amount), 0) as total FROM bookings WHERE DATE_FORMAT(created_at, "%Y-%m") = ?',
      [currentMonth]
    );
    
    // Total guests
    const [totalGuestsResult] = await db.execute('SELECT COUNT(*) as total FROM guests');

    res.json({
      totalRooms: totalRoomsResult[0].total,
      availableRooms: availableRoomsResult[0].total,
      occupiedRooms: occupiedRoomsResult[0].total,
      todayBookings: todayBookingsResult[0].total,
      todayCheckIns: todayCheckInsResult[0].total,
      todayCheckOuts: todayCheckOutsResult[0].total,
      monthlyRevenue: parseFloat(monthlyRevenueResult[0].total || 0),
      totalGuests: totalGuestsResult[0].total
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get recent bookings
router.get('/recent-bookings', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await db.execute(`
      SELECT b.id, b.booking_status, b.check_in_date, b.check_out_date, b.total_amount,
             g.name as guest_name, r.room_number, r.room_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    res.json(bookings);
  } catch (error) {
    console.error('Recent bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;