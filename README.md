# Hotel Management System

A comprehensive hotel management web application built with React.js frontend and Node.js + MySQL backend.

## Features

- **Room Management**: Add, edit, and manage hotel rooms with different types and amenities
- **Booking System**: Complete reservation system with check-in/check-out functionality
- **Guest Management**: Customer database with booking history
- **Staff Management**: Employee management with role-based access
- **Dashboard**: Real-time analytics and reporting
- **Authentication**: Secure login system for staff and administrators

## Tech Stack

**Frontend:**
- React.js (Create React App)
- React Router for navigation
- Axios for API calls
- CSS3 with modern styling

**Backend:**
- Node.js with Express.js
- MySQL database
- JWT authentication
- bcrypt for password hashing
- CORS enabled

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up MySQL database:
   - Create a database named `hotel_management`
   - Update database credentials in `backend/.env`

4. Start the application:
   ```bash
   npm run dev
   ```

This will start both frontend (http://localhost:3000) and backend (http://localhost:5000) servers.

## Default Admin Credentials

- Username: admin@hotel.com
- Password: admin123

## API Documentation

The backend provides RESTful APIs for:
- `/api/auth` - Authentication endpoints
- `/api/rooms` - Room management
- `/api/bookings` - Booking operations
- `/api/guests` - Guest management
- `/api/staff` - Staff management
- `/api/dashboard` - Analytics data