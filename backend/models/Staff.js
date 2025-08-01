const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class Staff extends BaseModel {
  constructor() {
    super('staff');
  }

  // Find staff by email (for login)
  async findByEmail(email) {
    return this.findOne({ email, status: 'active' });
  }

  // Create new staff member with hashed password
  async createStaff(data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.create(data);
  }

  // Update staff member (excludes password updates)
  async updateStaff(id, data) {
    // Remove password from update data
    const { password, ...updateData } = data;
    return this.update(id, updateData);
  }

  // Update password separately
  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.update(id, { password: hashedPassword });
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get staff without password field
  async findAllSafe(conditions = {}, options = {}) {
    const staff = await this.findAll(conditions, options);
    return staff.map(s => {
      const { password, ...staffWithoutPassword } = s;
      return staffWithoutPassword;
    });
  }

  // Get single staff without password
  async findByIdSafe(id) {
    const staff = await this.findById(id);
    if (!staff) return null;
    
    const { password, ...staffWithoutPassword } = staff;
    return staffWithoutPassword;
  }

  // Check if email exists (for uniqueness validation)
  async emailExists(email, excludeId = null) {
    const conditions = { email };
    if (excludeId) {
      // For SQLite, we need to use a raw query for NOT condition
      const [rows] = await this.query(
        'SELECT COUNT(*) as count FROM staff WHERE email = ? AND id != ?',
        [email, excludeId]
      );
      return rows[0].count > 0;
    }
    return this.exists(conditions);
  }

  // Get staff by role
  async findByRole(role) {
    return this.findAllSafe({ role, status: 'active' });
  }

  // Activate/Deactivate staff
  async changeStatus(id, status) {
    return this.update(id, { status });
  }

  // Get staff statistics
  async getStats() {
    const [stats] = await this.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as managers,
        SUM(CASE WHEN role = 'receptionist' THEN 1 ELSE 0 END) as receptionists,
        SUM(CASE WHEN role = 'housekeeping' THEN 1 ELSE 0 END) as housekeeping
      FROM staff
    `);
    return stats[0];
  }
}

module.exports = new Staff();