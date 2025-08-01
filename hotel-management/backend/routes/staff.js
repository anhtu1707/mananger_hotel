const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all staff members
router.get('/', [
  authMiddleware,
  authorize('admin', 'manager')
], async (req, res) => {
  try {
    const { role, is_active, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT id, email, first_name, last_name, phone, role, hire_date, salary, is_active, created_at
      FROM staff
    `;
    
    const conditions = [];
    const params = [];

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (is_active !== undefined) {
      conditions.push('is_active = ?');
      params.push(is_active === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await db.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM staff`;
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    res.json({
      staff: rows,
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

// Get staff member by ID
router.get('/:id', [
  authMiddleware,
  authorize('admin', 'manager')
], async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, email, first_name, last_name, phone, role, hire_date, salary, is_active, created_at FROM staff WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new staff member
router.post('/', [
  authMiddleware,
  authorize('admin', 'manager'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').notEmpty().isLength({ min: 1, max: 100 }),
  body('last_name').notEmpty().isLength({ min: 1, max: 100 }),
  body('phone').optional().isLength({ min: 10, max: 20 }),
  body('role').isIn(['admin', 'manager', 'receptionist', 'housekeeping']),
  body('hire_date').optional().isISO8601(),
  body('salary').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name, phone, role, hire_date, salary } = req.body;

    // Check if email already exists
    const [existing] = await db.execute(
      'SELECT id FROM staff WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new staff member
    const [result] = await db.execute(`
      INSERT INTO staff (email, password, first_name, last_name, phone, role, hire_date, salary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [email, hashedPassword, first_name, last_name, phone, role, hire_date || new Date().toISOString().split('T')[0], salary || 0]);

    res.status(201).json({ 
      message: 'Staff member created successfully', 
      staffId: result.insertId 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update staff member
router.put('/:id', [
  authMiddleware,
  authorize('admin', 'manager'),
  body('email').optional().isEmail().normalizeEmail(),
  body('first_name').optional().isLength({ min: 1, max: 100 }),
  body('last_name').optional().isLength({ min: 1, max: 100 }),
  body('phone').optional().isLength({ min: 10, max: 20 }),
  body('role').optional().isIn(['admin', 'manager', 'receptionist', 'housekeeping']),
  body('hire_date').optional().isISO8601(),
  body('salary').optional().isFloat({ min: 0 }),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, first_name, last_name, phone, role, hire_date, salary, is_active } = req.body;

    // Check if staff member exists
    const [existing] = await db.execute('SELECT id FROM staff WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if email already exists (excluding current staff member)
    if (email) {
      const [duplicate] = await db.execute(
        'SELECT id FROM staff WHERE email = ? AND id != ?',
        [email, req.params.id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Prevent self-deactivation for admin users
    if (is_active === false && req.user.id == req.params.id && req.user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate your own admin account' });
    }

    // Update staff member
    const updateFields = [];
    const updateValues = [];

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (hire_date !== undefined) {
      updateFields.push('hire_date = ?');
      updateValues.push(hire_date);
    }
    if (salary !== undefined) {
      updateFields.push('salary = ?');
      updateValues.push(salary);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(req.params.id);

    await db.execute(
      `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Staff member updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset staff password
router.put('/:id/reset-password', [
  authMiddleware,
  authorize('admin'),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;

    // Check if staff member exists
    const [existing] = await db.execute('SELECT id FROM staff WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.execute(
      'UPDATE staff SET password = ? WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete staff member
router.delete('/:id', [
  authMiddleware,
  authorize('admin')
], async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.user.id == req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if staff member has created bookings
    const [bookings] = await db.execute(
      'SELECT id FROM bookings WHERE created_by = ?',
      [req.params.id]
    );

    if (bookings.length > 0) {
      // Deactivate instead of deleting if they have booking history
      await db.execute(
        'UPDATE staff SET is_active = false WHERE id = ?',
        [req.params.id]
      );
      
      res.json({ 
        message: 'Staff member deactivated (has booking history)',
        action: 'deactivated'
      });
    } else {
      // Delete if no booking history
      const [result] = await db.execute('DELETE FROM staff WHERE id = ?', [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      res.json({ 
        message: 'Staff member deleted successfully',
        action: 'deleted'
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get staff performance/statistics
router.get('/:id/stats', [
  authMiddleware,
  authorize('admin', 'manager')
], async (req, res) => {
  try {
    // Get booking statistics for the staff member
    const [bookingStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in_bookings,
        COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM bookings 
      WHERE created_by = ?
    `, [req.params.id]);

    // Get monthly booking count for current year
    const [monthlyStats] = await db.execute(`
      SELECT 
        MONTH(created_at) as month,
        COUNT(*) as bookings_count,
        COALESCE(SUM(total_amount), 0) as monthly_revenue
      FROM bookings 
      WHERE created_by = ? AND YEAR(created_at) = YEAR(CURDATE())
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `, [req.params.id]);

    res.json({
      ...bookingStats[0],
      monthly_stats: monthlyStats
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;