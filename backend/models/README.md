# Hotel Management System - Models

This document describes the model architecture and database abstraction layer for the Hotel Management System.

## Architecture Overview

The system uses a **Model-View-Controller (MVC)** pattern with the following structure:

```
backend/
├── models/           # Data models and business logic
│   ├── BaseModel.js  # Base class with common CRUD operations
│   ├── Staff.js      # Staff/User model with authentication
│   ├── Room.js       # Room model with availability logic
│   ├── Guest.js      # Guest model with search functionality
│   ├── Booking.js    # Booking model with business rules
│   └── index.js      # Model exports
├── routes/           # API endpoints (Controllers)
├── middleware/       # Authentication and validation
└── config/           # Database configuration
```

## Base Model (BaseModel.js)

The `BaseModel` class provides common database operations for all models:

### Methods

#### Basic CRUD Operations
```javascript
// Find all records with optional conditions and options
await model.findAll(conditions, options)

// Find a single record by ID
await model.findById(id)

// Find one record matching conditions
await model.findOne(conditions)

// Create a new record
await model.create(data)

// Update a record by ID
await model.update(id, data)

// Delete a record by ID
await model.delete(id)
```

#### Utility Methods
```javascript
// Count records matching conditions
await model.count(conditions)

// Check if records exist matching conditions
await model.exists(conditions)

// Execute raw SQL queries
await model.query(sql, params)
```

### Usage Example
```javascript
const { Room } = require('../models');

// Find all available rooms
const availableRooms = await Room.findAll({ status: 'available' });

// Find room by ID
const room = await Room.findById(1);

// Create new room
const newRoom = await Room.create({
  room_number: '301',
  room_type: 'suite',
  price_per_night: 299.99,
  capacity: 4
});

// Update room
const updatedRoom = await Room.update(1, { status: 'maintenance' });

// Count available rooms
const availableCount = await Room.count({ status: 'available' });
```

## Staff Model (Staff.js)

Handles user authentication and staff management.

### Key Features
- Password hashing and verification
- Email uniqueness validation
- Role-based operations
- Safe data retrieval (excludes passwords)

### Specific Methods
```javascript
// Authentication
await Staff.findByEmail(email)
await Staff.verifyPassword(plainPassword, hashedPassword)

// Staff management
await Staff.createStaff(data)           // Auto-hashes password
await Staff.updateStaff(id, data)       // Excludes password updates
await Staff.updatePassword(id, newPassword)

// Safe data retrieval
await Staff.findAllSafe(conditions, options)  // Returns staff without passwords
await Staff.findByIdSafe(id)                  // Returns staff without password

// Validation
await Staff.emailExists(email, excludeId)

// Role-based queries
await Staff.findByRole(role)
await Staff.changeStatus(id, status)

// Statistics
await Staff.getStats()
```

### Usage Example
```javascript
const { Staff } = require('../models');

// Login validation
const user = await Staff.findByEmail('admin@hotel.com');
const isValid = await Staff.verifyPassword('admin123', user.password);

// Create new staff member
const newStaff = await Staff.createStaff({
  name: 'John Doe',
  email: 'john@hotel.com',
  password: 'password123',
  role: 'receptionist'
});

// Get staff statistics
const stats = await Staff.getStats();
// Returns: { total, active, admins, managers, receptionists, housekeeping }
```

## Room Model (Room.js)

Manages hotel rooms with availability checking and filtering.

### Key Features
- Room availability for date ranges
- Room number uniqueness validation
- Advanced filtering
- Booking conflict detection

### Specific Methods
```javascript
// Validation
await Room.roomNumberExists(roomNumber, excludeId)

// Filtering
await Room.findByStatus(status)
await Room.findByType(roomType)
await Room.findWithFilters(filters)

// Availability
await Room.getAvailableRooms(checkInDate, checkOutDate, excludeBookingId)
await Room.hasBookingConflict(roomId, checkInDate, checkOutDate, excludeBookingId)

// Status management
await Room.updateStatus(id, status)

// Statistics
await Room.getStats()
```

### Usage Example
```javascript
const { Room } = require('../models');

// Check availability for date range
const availableRooms = await Room.getAvailableRooms('2024-01-15', '2024-01-20');

// Advanced filtering
const rooms = await Room.findWithFilters({
  room_type: 'suite',
  min_price: 200,
  max_price: 400,
  search: 'ocean view'
});

// Check for booking conflicts
const hasConflict = await Room.hasBookingConflict(1, '2024-01-15', '2024-01-20');

// Get room statistics
const stats = await Room.getStats();
// Returns: { total, available, occupied, maintenance, cleaning, single_rooms, double_rooms, suite_rooms, deluxe_rooms, avg_price }
```

## Guest Model (Guest.js)

Manages guest information with search and booking history.

### Key Features
- ID document uniqueness validation
- Advanced search functionality
- Booking history integration
- Pagination support

### Specific Methods
```javascript
// Validation
await Guest.idExists(idType, idNumber, excludeId)

// Search
await Guest.search(searchTerm, limit)
await Guest.findWithPagination(options)

// Enhanced data
await Guest.findWithBookings(id)
await Guest.getBookingSummary(id)

// Filtering
await Guest.getRecent(limit)
await Guest.getWithActiveBookings()

// Validation for deletion
await Guest.hasActiveBookings(id)

// Statistics
await Guest.getStats()
```

### Usage Example
```javascript
const { Guest } = require('../models');

// Search guests
const guests = await Guest.search('john', 10);

// Get guest with booking history
const guestWithBookings = await Guest.findWithBookings(1);

// Paginated guest list with search
const result = await Guest.findWithPagination({
  search: 'smith',
  limit: 20,
  offset: 0
});

// Get guest booking summary
const summary = await Guest.getBookingSummary(1);
// Returns: { total_bookings, confirmed_bookings, checked_in_bookings, completed_bookings, cancelled_bookings, total_spent, total_paid, last_booking_date }
```

## Booking Model (Booking.js)

Handles reservations with complex business logic.

### Key Features
- Availability validation
- Check-in/check-out operations
- Payment management
- Status transitions

### Specific Methods
```javascript
// Enhanced data retrieval
await Booking.findWithDetails(id)
await Booking.findWithPagination(options)

// Availability
await Booking.checkRoomAvailability(roomId, checkInDate, checkOutDate, excludeBookingId)

// Operations
await Booking.checkIn(id, staffId)
await Booking.checkOut(id, staffId)
await Booking.cancel(id)

// Payment management
await Booking.addPayment(bookingId, paymentData, staffId)

// Daily operations
await Booking.getTodayCheckIns()
await Booking.getTodayCheckOuts()

// Analytics
await Booking.getStats()
await Booking.getRecent(limit)
await Booking.getRevenue(startDate, endDate)
```

### Usage Example
```javascript
const { Booking } = require('../models');

// Get booking with full details
const booking = await Booking.findWithDetails(1);

// Check room availability
const isAvailable = await Booking.checkRoomAvailability(1, '2024-01-15', '2024-01-20');

// Check-in a guest
const checkedInBooking = await Booking.checkIn(1, staffId);

// Add payment
const payment = await Booking.addPayment(1, {
  amount: 150.00,
  payment_method: 'card',
  reference_number: 'TXN123456',
  notes: 'Partial payment'
}, staffId);

// Get today's check-ins
const todayCheckIns = await Booking.getTodayCheckIns();

// Get booking statistics
const stats = await Booking.getStats();
// Returns: { total, confirmed, checked_in, checked_out, cancelled, total_revenue, total_paid, avg_booking_value }
```

## Using Models in Routes

### Import Models
```javascript
const { Staff, Room, Guest, Booking } = require('../models');
```

### Example Route with Model
```javascript
// GET /api/rooms with availability check
router.get('/', async (req, res) => {
  try {
    const { available_from, available_to } = req.query;
    
    if (available_from && available_to) {
      const rooms = await Room.getAvailableRooms(available_from, available_to);
      return res.json(rooms);
    }
    
    const rooms = await Room.findAll({}, { 
      orderBy: 'room_number', 
      orderDirection: 'ASC' 
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

## Database Schema

The models work with the following database tables:

### Staff Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT NOT NULL)
- email (TEXT UNIQUE NOT NULL)
- password (TEXT NOT NULL)
- role (TEXT: admin|manager|receptionist|housekeeping)
- phone (TEXT)
- address (TEXT)
- salary (DECIMAL)
- hire_date (DATE)
- status (TEXT: active|inactive)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Rooms Table
```sql
- id (INTEGER PRIMARY KEY)
- room_number (TEXT UNIQUE NOT NULL)
- room_type (TEXT: single|double|suite|deluxe)
- price_per_night (DECIMAL NOT NULL)
- capacity (INTEGER NOT NULL)
- amenities (TEXT)
- status (TEXT: available|occupied|maintenance|cleaning)
- description (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Guests Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT NOT NULL)
- email (TEXT)
- phone (TEXT NOT NULL)
- address (TEXT)
- id_type (TEXT: passport|license|national_id)
- id_number (TEXT NOT NULL)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Bookings Table
```sql
- id (INTEGER PRIMARY KEY)
- guest_id (INTEGER FK)
- room_id (INTEGER FK)
- check_in_date (DATE NOT NULL)
- check_out_date (DATE NOT NULL)
- actual_check_in (DATETIME)
- actual_check_out (DATETIME)
- total_amount (DECIMAL NOT NULL)
- paid_amount (DECIMAL DEFAULT 0)
- payment_status (TEXT: pending|partial|paid|refunded)
- booking_status (TEXT: confirmed|checked_in|checked_out|cancelled)
- special_requests (TEXT)
- created_by (INTEGER FK)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Payments Table
```sql
- id (INTEGER PRIMARY KEY)
- booking_id (INTEGER FK)
- amount (DECIMAL NOT NULL)
- payment_method (TEXT: cash|card|transfer|check)
- payment_date (DATETIME)
- reference_number (TEXT)
- notes (TEXT)
- created_by (INTEGER FK)
```

## Benefits of This Architecture

1. **Separation of Concerns**: Business logic is separated from route handlers
2. **Reusability**: Models can be used across different routes and controllers
3. **Consistency**: Common operations are standardized through BaseModel
4. **Maintainability**: Database queries are centralized in model classes
5. **Type Safety**: Models provide a clear interface for data operations
6. **Testing**: Models can be easily unit tested
7. **Scalability**: Easy to add new models or extend existing ones

## Best Practices

1. **Always use models instead of direct database queries in routes**
2. **Keep business logic in models, not in routes**
3. **Use specific model methods for complex operations**
4. **Handle errors appropriately in both models and routes**
5. **Use transactions for multi-table operations**
6. **Validate data in both middleware and models**
7. **Keep models focused on their specific domain**

This model architecture provides a robust foundation for the Hotel Management System while maintaining clean, maintainable, and testable code.