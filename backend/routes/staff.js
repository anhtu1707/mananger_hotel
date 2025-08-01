const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateStaff } = require('../middleware/validation');

const router = express.Router();

// Get all staff
router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { role, status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT id, name, email, role, phone, address, salary, hire_date, status, created_at FROM staff WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [staff] = await db.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM staff WHERE 1=1';
    const countParams = [];
    
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    
    res.json({
      staff,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single staff member
router.get('/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const [staff] = await db.execute(
      'SELECT id, name, email, role, phone, address, salary, hire_date, status, created_at FROM staff WHERE id = ?',
      [req.params.id]
    );

    if (staff.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json(staff[0]);
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new staff member
router.post('/', authenticateToken, authorizeRoles('admin'), validateStaff, async (req, res) => {
  try {
    const { name, email, password, role, phone, address, salary, hire_date } = req.body;

    // Check if email already exists
    const [existingStaff] = await db.execute(
      'SELECT id FROM staff WHERE email = ?',
      [email]
    );

    if (existingStaff.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'defaultpass123', 10);

    const [result] = await db.execute(
      'INSERT INTO staff (name, email, password, role, phone, address, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, phone, address, salary, hire_date]
    );

    res.status(201).json({
      message: 'Staff member created successfully',
      staffId: result.insertId
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update staff member
router.put('/:id', authenticateToken, authorizeRoles('admin'), validateStaff, async (req, res) => {
  try {
    const { name, email, role, phone, address, salary, hire_date, status } = req.body;

    // Check if staff exists
    const [existingStaff] = await db.execute(
      'SELECT id FROM staff WHERE id = ?',
      [req.params.id]
    );

    if (existingStaff.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if email is being changed and if it conflicts
    const [conflictStaff] = await db.execute(
      'SELECT id FROM staff WHERE email = ? AND id != ?',
      [email, req.params.id]
    );

    if (conflictStaff.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    await db.execute(
      'UPDATE staff SET name = ?, email = ?, role = ?, phone = ?, address = ?, salary = ?, hire_date = ?, status = ? WHERE id = ?',
      [name, email, role, phone, address, salary, hire_date, status, req.params.id]
    );

    res.json({ message: 'Staff member updated successfully' });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update staff password
router.put('/:id/password', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await db.execute(
      'UPDATE staff SET password = ? WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update staff password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Deactivate staff member
router.patch('/:id/deactivate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Cannot deactivate yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const [result] = await db.execute(
      'UPDATE staff SET status = "inactive" WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deactivated successfully' });
  } catch (error) {
    console.error('Deactivate staff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Activate staff member
router.patch('/:id/activate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [result] = await db.execute(
      'UPDATE staff SET status = "active" WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json({ message: 'Staff member activated successfully' });
  } catch (error) {
    console.error('Activate staff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete staff member
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Cannot delete yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const [result] = await db.execute(
      'DELETE FROM staff WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;