const db = require('./database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
  try {
    console.log('Initializing SQLite database...');

    // Create staff table
    await db.run(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'receptionist', 'housekeeping')) DEFAULT 'receptionist',
        phone TEXT,
        address TEXT,
        salary DECIMAL(10,2),
        hire_date DATE,
        status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create rooms table
    await db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT UNIQUE NOT NULL,
        room_type TEXT NOT NULL CHECK(room_type IN ('single', 'double', 'suite', 'deluxe')),
        price_per_night DECIMAL(10,2) NOT NULL,
        capacity INTEGER NOT NULL,
        amenities TEXT,
        status TEXT CHECK(status IN ('available', 'occupied', 'maintenance', 'cleaning')) DEFAULT 'available',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create guests table
    await db.run(`
      CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        address TEXT,
        id_type TEXT NOT NULL CHECK(id_type IN ('passport', 'license', 'national_id')),
        id_number TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bookings table
    await db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_id INTEGER,
        room_id INTEGER,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        actual_check_in DATETIME,
        actual_check_out DATETIME,
        total_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        payment_status TEXT CHECK(payment_status IN ('pending', 'partial', 'paid', 'refunded')) DEFAULT 'pending',
        booking_status TEXT CHECK(booking_status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'confirmed',
        special_requests TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL
      )
    `);

    // Create payments table
    await db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'transfer', 'check')),
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reference_number TEXT,
        notes TEXT,
        created_by INTEGER,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL
      )
    `);

    // Check if admin user exists
    const existingAdmin = await db.get('SELECT id FROM staff WHERE email = ?', ['admin@hotel.com']);
    
    if (!existingAdmin) {
      // Insert default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(`
        INSERT INTO staff (name, email, password, role, phone, address, salary, hire_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'System Administrator',
        'admin@hotel.com',
        hashedPassword,
        'admin',
        '+1234567890',
        '123 Hotel Street, City',
        5000.00,
        new Date().toISOString().split('T')[0]
      ]);
    }

    // Check if sample rooms exist
    const existingRooms = await db.get('SELECT id FROM rooms LIMIT 1');
    
    if (!existingRooms) {
      // Insert sample rooms
      const sampleRooms = [
        ['101', 'single', 99.99, 1, 'WiFi, AC, TV', 'available', 'Cozy single room with city view'],
        ['102', 'single', 99.99, 1, 'WiFi, AC, TV', 'available', 'Cozy single room with city view'],
        ['201', 'double', 149.99, 2, 'WiFi, AC, TV, Mini Bar', 'available', 'Spacious double room with garden view'],
        ['202', 'double', 149.99, 2, 'WiFi, AC, TV, Mini Bar', 'available', 'Spacious double room with garden view'],
        ['301', 'suite', 299.99, 4, 'WiFi, AC, TV, Mini Bar, Jacuzzi, Balcony', 'available', 'Luxury suite with ocean view'],
        ['302', 'deluxe', 249.99, 3, 'WiFi, AC, TV, Mini Bar, Balcony', 'available', 'Deluxe room with premium amenities']
      ];

      for (const room of sampleRooms) {
        await db.run(`
          INSERT INTO rooms (room_number, room_type, price_per_night, capacity, amenities, status, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, room);
      }
    }

    console.log('Database initialized successfully!');
    console.log('Default admin credentials:');
    console.log('Email: admin@hotel.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = initDatabase;

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}