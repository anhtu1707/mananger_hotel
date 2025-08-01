const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get overall dashboard statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Get room statistics
    const [roomStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms,
        COUNT(CASE WHEN status = 'cleaning' THEN 1 END) as cleaning_rooms
      FROM rooms
    `);

    // Get booking statistics for today
    const [todayBookings] = await db.execute(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in_bookings,
        COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as checked_out_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings 
      WHERE DATE(created_at) = CURDATE()
    `);

    // Get check-ins and check-outs for today
    const [todayCheckIns] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE check_in_date = CURDATE() AND status IN ('confirmed', 'checked_in')
    `);

    const [todayCheckOuts] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE check_out_date = CURDATE() AND status = 'checked_in'
    `);

    // Get revenue statistics
    const [revenueStats] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount END), 0) as today_revenue,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN total_amount END), 0) as month_revenue,
        COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) THEN total_amount END), 0) as year_revenue
      FROM bookings 
      WHERE status = 'checked_out'
    `);

    // Get guest statistics
    const [guestStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_guests,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_guests_today
      FROM guests
    `);

    // Calculate occupancy rate
    const occupancyRate = roomStats[0].total_rooms > 0 ? 
      ((roomStats[0].occupied_rooms / roomStats[0].total_rooms) * 100).toFixed(2) : 0;

    res.json({
      rooms: roomStats[0],
      occupancy_rate: parseFloat(occupancyRate),
      today_bookings: todayBookings[0],
      today_checkins: todayCheckIns[0].count,
      today_checkouts: todayCheckOuts[0].count,
      revenue: revenueStats[0],
      guests: guestStats[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent activities
router.get('/recent-activities', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    // Get recent bookings
    const [recentBookings] = await db.execute(`
      SELECT 
        b.id, b.status, b.created_at, b.check_in_date, b.check_out_date,
        CONCAT(g.first_name, ' ', g.last_name) as guest_name,
        r.room_number,
        CONCAT(s.first_name, ' ', s.last_name) as created_by_name,
        'booking' as activity_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN staff s ON b.created_by = s.id
      ORDER BY b.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    // Get recent check-ins
    const [recentCheckIns] = await db.execute(`
      SELECT 
        b.id, b.actual_check_in as activity_time,
        CONCAT(g.first_name, ' ', g.last_name) as guest_name,
        r.room_number,
        'checkin' as activity_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.actual_check_in IS NOT NULL
      ORDER BY b.actual_check_in DESC
      LIMIT ?
    `, [parseInt(limit)]);

    // Get recent check-outs
    const [recentCheckOuts] = await db.execute(`
      SELECT 
        b.id, b.actual_check_out as activity_time,
        CONCAT(g.first_name, ' ', g.last_name) as guest_name,
        r.room_number,
        'checkout' as activity_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.actual_check_out IS NOT NULL
      ORDER BY b.actual_check_out DESC
      LIMIT ?
    `, [parseInt(limit)]);

    // Combine and sort activities
    const activities = [
      ...recentBookings.map(b => ({
        ...b,
        activity_time: b.created_at,
        description: `New booking for ${b.guest_name} in room ${b.room_number}`
      })),
      ...recentCheckIns.map(c => ({
        ...c,
        description: `${c.guest_name} checked in to room ${c.room_number}`
      })),
      ...recentCheckOuts.map(c => ({
        ...c,
        description: `${c.guest_name} checked out from room ${c.room_number}`
      }))
    ].sort((a, b) => new Date(b.activity_time) - new Date(a.activity_time)).slice(0, limit);

    res.json(activities);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monthly revenue chart data
router.get('/revenue-chart', authMiddleware, async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    const [monthlyRevenue] = await db.execute(`
      SELECT 
        MONTH(created_at) as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as bookings_count
      FROM bookings 
      WHERE YEAR(created_at) = ? AND status = 'checked_out'
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `, [year]);

    // Fill missing months with zero values
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = monthNames.map((month, index) => {
      const monthData = monthlyRevenue.find(m => m.month === index + 1);
      return {
        month,
        revenue: monthData ? parseFloat(monthData.revenue) : 0,
        bookings: monthData ? monthData.bookings_count : 0
      };
    });

    res.json(chartData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room type occupancy distribution
router.get('/room-occupancy', authMiddleware, async (req, res) => {
  try {
    const [roomOccupancy] = await db.execute(`
      SELECT 
        rt.name as room_type,
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
        ROUND((COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) / COUNT(r.id)) * 100, 2) as occupancy_rate
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      GROUP BY rt.id, rt.name
      ORDER BY rt.base_price
    `);

    res.json(roomOccupancy);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming check-ins and check-outs
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const days = req.query.days || 7;

    // Get upcoming check-ins
    const [upcomingCheckIns] = await db.execute(`
      SELECT 
        b.id, b.check_in_date, b.status,
        CONCAT(g.first_name, ' ', g.last_name) as guest_name,
        g.phone as guest_phone,
        r.room_number,
        rt.name as room_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE b.check_in_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND b.status = 'confirmed'
      ORDER BY b.check_in_date, r.room_number
    `, [days]);

    // Get upcoming check-outs
    const [upcomingCheckOuts] = await db.execute(`
      SELECT 
        b.id, b.check_out_date, b.status,
        CONCAT(g.first_name, ' ', g.last_name) as guest_name,
        g.phone as guest_phone,
        r.room_number,
        rt.name as room_type
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE b.check_out_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND b.status = 'checked_in'
      ORDER BY b.check_out_date, r.room_number
    `, [days]);

    res.json({
      checkins: upcomingCheckIns,
      checkouts: upcomingCheckOuts
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available services
router.get('/services', authMiddleware, async (req, res) => {
  try {
    const [services] = await db.execute(
      'SELECT * FROM services WHERE is_active = true ORDER BY category, name'
    );

    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;