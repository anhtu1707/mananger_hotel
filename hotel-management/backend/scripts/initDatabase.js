const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const createDatabase = async () => {
  try {
    console.log('🔄 Creating database and tables...');
    
    // Create database
    await connection.promise().execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.promise().execute(`USE ${process.env.DB_NAME}`);
    
    // Create staff table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'manager', 'receptionist', 'housekeeping') DEFAULT 'receptionist',
        hire_date DATE,
        salary DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create room_types table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS room_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        base_price DECIMAL(10,2) NOT NULL,
        max_occupancy INT DEFAULT 2,
        amenities JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create rooms table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_number VARCHAR(10) UNIQUE NOT NULL,
        room_type_id INT,
        floor INT,
        status ENUM('available', 'occupied', 'maintenance', 'cleaning') DEFAULT 'available',
        last_cleaned TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
      )
    `);

    // Create guests table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS guests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        id_type ENUM('passport', 'driver_license', 'national_id'),
        id_number VARCHAR(50),
        date_of_birth DATE,
        nationality VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create bookings table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guest_id INT NOT NULL,
        room_id INT NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        actual_check_in TIMESTAMP NULL,
        actual_check_out TIMESTAMP NULL,
        total_amount DECIMAL(10,2),
        advance_payment DECIMAL(10,2) DEFAULT 0,
        status ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'confirmed',
        special_requests TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (guest_id) REFERENCES guests(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (created_by) REFERENCES staff(id)
      )
    `);

    // Create services table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category ENUM('food', 'spa', 'laundry', 'transport', 'other') DEFAULT 'other',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create booking_services table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS booking_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        service_id INT NOT NULL,
        quantity INT DEFAULT 1,
        unit_price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (service_id) REFERENCES services(id)
      )
    `);

    console.log('✅ Database tables created successfully');

    // Insert sample data
    await insertSampleData();

  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    connection.end();
  }
};

const insertSampleData = async () => {
  try {
    console.log('🔄 Inserting sample data...');

    // Hash password for admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin staff
    await connection.promise().execute(`
      INSERT IGNORE INTO staff (email, password, first_name, last_name, phone, role, hire_date, salary) 
      VALUES (?, ?, 'Admin', 'User', '+1234567890', 'admin', CURDATE(), 5000.00)
    `, ['admin@hotel.com', hashedPassword]);

    // Insert sample staff
    const staffPassword = await bcrypt.hash('staff123', 10);
    await connection.promise().execute(`
      INSERT IGNORE INTO staff (email, password, first_name, last_name, phone, role, hire_date, salary) 
      VALUES 
      (?, ?, 'John', 'Manager', '+1234567891', 'manager', CURDATE(), 4000.00),
      (?, ?, 'Jane', 'Smith', '+1234567892', 'receptionist', CURDATE(), 2500.00)
    `, ['manager@hotel.com', staffPassword, 'receptionist@hotel.com', staffPassword]);

    // Insert room types
    await connection.promise().execute(`
      INSERT IGNORE INTO room_types (name, description, base_price, max_occupancy, amenities) 
      VALUES 
      ('Standard Single', 'Comfortable single room with basic amenities', 80.00, 1, '["Wi-Fi", "TV", "Air Conditioning"]'),
      ('Standard Double', 'Spacious double room with modern facilities', 120.00, 2, '["Wi-Fi", "TV", "Air Conditioning", "Mini Bar"]'),
      ('Deluxe Suite', 'Luxury suite with separate living area', 200.00, 4, '["Wi-Fi", "TV", "Air Conditioning", "Mini Bar", "Jacuzzi", "Room Service"]'),
      ('Presidential Suite', 'Premium suite with exclusive amenities', 350.00, 6, '["Wi-Fi", "TV", "Air Conditioning", "Mini Bar", "Jacuzzi", "Room Service", "Butler Service"]')
    `);

    // Insert rooms
    const roomInserts = [];
    for (let floor = 1; floor <= 5; floor++) {
      for (let room = 1; room <= 10; room++) {
        const roomNumber = `${floor}${room.toString().padStart(2, '0')}`;
        const roomTypeId = Math.ceil(Math.random() * 4);
        roomInserts.push([roomNumber, roomTypeId, floor]);
      }
    }

    for (const room of roomInserts) {
      await connection.promise().execute(`
        INSERT IGNORE INTO rooms (room_number, room_type_id, floor, last_cleaned) 
        VALUES (?, ?, ?, NOW())
      `, room);
    }

    // Insert sample guests
    await connection.promise().execute(`
      INSERT IGNORE INTO guests (first_name, last_name, email, phone, address, id_type, id_number, nationality) 
      VALUES 
      ('Alice', 'Johnson', 'alice@email.com', '+1555000001', '123 Main St, City, State', 'passport', 'P123456789', 'USA'),
      ('Bob', 'Wilson', 'bob@email.com', '+1555000002', '456 Oak Ave, City, State', 'driver_license', 'DL123456789', 'USA'),
      ('Carol', 'Davis', 'carol@email.com', '+1555000003', '789 Pine Rd, City, State', 'national_id', 'ID123456789', 'Canada')
    `);

    // Insert services
    await connection.promise().execute(`
      INSERT IGNORE INTO services (name, description, price, category) 
      VALUES 
      ('Room Service Breakfast', 'Continental breakfast delivered to room', 25.00, 'food'),
      ('Laundry Service', 'Same-day laundry and dry cleaning', 15.00, 'laundry'),
      ('Spa Massage', '60-minute relaxation massage', 80.00, 'spa'),
      ('Airport Transfer', 'Pickup/drop-off service to airport', 45.00, 'transport'),
      ('Late Checkout', 'Checkout extension until 3 PM', 30.00, 'other')
    `);

    console.log('✅ Sample data inserted successfully');

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
};

createDatabase();