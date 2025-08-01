import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewResponse, bookingsResponse] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getRecentBookings(),
      ]);
      
      setOverview(overviewResponse.data);
      setRecentBookings(bookingsResponse.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      confirmed: 'badge badge-info',
      checked_in: 'badge badge-success',
      checked_out: 'badge badge-secondary',
      cancelled: 'badge badge-danger',
    };
    return statusClasses[status] || 'badge badge-secondary';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="btn btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Rooms',
      value: overview?.totalRooms || 0,
      icon: BuildingOfficeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Available Rooms',
      value: overview?.availableRooms || 0,
      icon: BuildingOfficeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Occupied Rooms',
      value: overview?.occupiedRooms || 0,
      icon: BuildingOfficeIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Total Guests',
      value: overview?.totalGuests || 0,
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: "Today's Bookings",
      value: overview?.todayBookings || 0,
      icon: CalendarDaysIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      name: "Today's Check-ins",
      value: overview?.todayCheckIns || 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: "Today's Check-outs",
      value: overview?.todayCheckOuts || 0,
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(overview?.monthlyRevenue || 0),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening at your hotel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Room Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Occupancy</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Occupancy Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {overview?.totalRooms > 0 
                    ? Math.round((overview.occupiedRooms / overview.totalRooms) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: overview?.totalRooms > 0 
                      ? `${(overview.occupiedRooms / overview.totalRooms) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{overview?.availableRooms || 0}</p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">{overview?.occupiedRooms || 0}</p>
                  <p className="text-xs text-gray-500">Occupied</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-600">
                    {(overview?.totalRooms || 0) - (overview?.availableRooms || 0) - (overview?.occupiedRooms || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Maintenance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="btn btn-primary w-full">New Booking</button>
            <button className="btn btn-outline w-full">Check-in Guest</button>
            <button className="btn btn-outline w-full">Check-out Guest</button>
            <button className="btn btn-outline w-full">Add Guest</button>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent bookings</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="font-medium">{booking.guest_name}</td>
                    <td>
                      {booking.room_number}
                      <span className="text-sm text-gray-500 block capitalize">
                        {booking.room_type}
                      </span>
                    </td>
                    <td>{formatDate(booking.check_in_date)}</td>
                    <td>{formatDate(booking.check_out_date)}</td>
                    <td className="font-medium">{formatCurrency(booking.total_amount)}</td>
                    <td>
                      <span className={getStatusBadge(booking.booking_status)}>
                        {booking.booking_status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;