# Hotel Management System Setup Guide

A comprehensive hotel management web application built with React.js frontend and Node.js + MySQL backend.

## Features

✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Admin, Manager, Receptionist, Housekeeping)
- Secure password hashing with bcrypt

✅ **Room Management**
- CRUD operations for rooms
- Room type management with amenities
- Room status tracking (Available, Occupied, Maintenance, Cleaning)
- Floor and availability filtering

✅ **Booking System**
- Complete reservation management
- Check-in/check-out functionality
- Booking status tracking
- Date conflict validation

✅ **Guest Management**
- Customer database with booking history
- Guest search and filtering
- Contact information management

✅ **Staff Management** (Admin/Manager only)
- Employee management with role assignment
- Performance tracking
- Password reset functionality

✅ **Dashboard & Analytics**
- Real-time hotel statistics
- Revenue charts and occupancy rates
- Recent activity tracking
- Room type performance metrics

✅ **Modern UI/UX**
- Responsive design for mobile and desktop
- Intuitive navigation with sidebar
- Professional styling with smooth animations
- Loading states and error handling

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- **Git** - [Download here](https://git-scm.com/)

## Installation Steps

### 1. Clone & Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd hotel-management

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

### 2. Database Setup

#### Option A: Using MySQL Command Line

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE hotel_management;
exit;
```

#### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Create a new database named `hotel_management`

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example backend/.env

# Edit the configuration file
nano backend/.env  # or use your preferred editor
```

Update the following variables in `backend/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hotel_management
DB_PORT=3306

# JWT Configuration (IMPORTANT: Change in production!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 4. Initialize Database

```bash
# Run database initialization script
cd backend
npm run init-db
```

This will create all necessary tables and insert sample data including:
- Default admin user: `admin@hotel.com` / `admin123`
- Sample room types and rooms
- Sample guests and services

### 5. Start the Application

#### Development Mode (Recommended)
```bash
# From project root - starts both frontend and backend
npm run dev
```

#### Manual Start (Alternative)
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hotel.com | admin123 |
| Manager | manager@hotel.com | staff123 |
| Receptionist | receptionist@hotel.com | staff123 |

## Project Structure

```
hotel-management/
├── README.md
├── SETUP.md
├── package.json
├── .env.example
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   ├── bookings.js
│   │   ├── guests.js
│   │   ├── staff.js
│   │   └── dashboard.js
│   └── scripts/
│       └── initDatabase.js
└── frontend/
    ├── package.json
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   └── Rooms.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── App.css
    │   └── index.tsx
    └── ...
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Rooms
- `GET /api/rooms` - Get all rooms (with filters)
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room
- `GET /api/rooms/types/all` - Get room types

### Bookings
- `GET /api/bookings` - Get all bookings (with filters)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `POST /api/bookings/:id/checkin` - Check-in guest
- `POST /api/bookings/:id/checkout` - Check-out guest
- `POST /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/services` - Add service to booking

### Guests
- `GET /api/guests` - Get all guests (with search/pagination)
- `GET /api/guests/:id` - Get guest by ID
- `POST /api/guests` - Create new guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest
- `GET /api/guests/search/:term` - Search guests

### Staff (Admin/Manager only)
- `GET /api/staff` - Get all staff members
- `GET /api/staff/:id` - Get staff member by ID
- `POST /api/staff` - Create new staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member
- `PUT /api/staff/:id/reset-password` - Reset password
- `GET /api/staff/:id/stats` - Get staff statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activities` - Get recent activities
- `GET /api/dashboard/revenue-chart` - Get revenue chart data
- `GET /api/dashboard/room-occupancy` - Get room occupancy data
- `GET /api/dashboard/upcoming` - Get upcoming check-ins/outs
- `GET /api/dashboard/services` - Get available services

## Troubleshooting

### Common Issues

#### Database Connection Error
```
❌ Database connection failed: ER_ACCESS_DENIED_FOR_USER
```
**Solution**: Check your MySQL credentials in `backend/.env`

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill the process using the port or change the port in `backend/.env`

#### Frontend Cannot Connect to Backend
**Solution**: Ensure backend is running on port 5000 and check the proxy setting in `frontend/package.json`

#### JWT Token Errors
**Solution**: Clear localStorage in browser developer tools and login again

### Reset Database
If you need to reset the database:

```bash
cd backend
mysql -u root -p -e "DROP DATABASE hotel_management; CREATE DATABASE hotel_management;"
npm run init-db
```

## Production Deployment

### Environment Variables
Update these for production:
- Change `JWT_SECRET` to a strong, unique value
- Set `NODE_ENV=production`
- Update database credentials
- Configure SMTP for email notifications

### Database
- Use a managed database service (AWS RDS, Google Cloud SQL, etc.)
- Enable SSL connections
- Set up automated backups

### Security
- Use HTTPS in production
- Set up proper CORS configuration
- Implement rate limiting
- Use environment-specific secrets

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the error logs in terminal
3. Ensure all prerequisites are installed correctly
4. Verify database connection and credentials

## License

This project is licensed under the MIT License.