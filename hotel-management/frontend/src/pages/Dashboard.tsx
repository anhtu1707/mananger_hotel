import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { DashboardStats, RecentActivity, RevenueChart, RoomOccupancy } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueChart[]>([]);
  const [roomOccupancy, setRoomOccupancy] = useState<RoomOccupancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes, revenueRes, occupancyRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(10),
        dashboardAPI.getRevenueChart(),
        dashboardAPI.getRoomOccupancy(),
      ]);

      setStats(statsRes.data);
      setActivities(activitiesRes.data);
      setRevenueChart(revenueRes.data);
      setRoomOccupancy(occupancyRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="error-message">Failed to load dashboard data</div>;
  }

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏨</div>
          <div className="stat-content">
            <h3>Total Rooms</h3>
            <div className="stat-number">{stats.rooms.total_rooms}</div>
            <div className="stat-detail">
              {stats.rooms.available_rooms} available, {stats.rooms.occupied_rooms} occupied
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Occupancy Rate</h3>
            <div className="stat-number">{stats.occupancy_rate}%</div>
            <div className="stat-detail">
              {stats.rooms.maintenance_rooms} maintenance, {stats.rooms.cleaning_rooms} cleaning
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Today's Revenue</h3>
            <div className="stat-number">${stats.revenue.today_revenue.toFixed(2)}</div>
            <div className="stat-detail">
              Month: ${stats.revenue.month_revenue.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Bookings</h3>
            <div className="stat-number">{stats.today_bookings.total_bookings}</div>
            <div className="stat-detail">
              {stats.today_checkins} check-ins, {stats.today_checkouts} check-outs
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Guests</h3>
            <div className="stat-number">{stats.guests.total_guests}</div>
            <div className="stat-detail">
              {stats.guests.new_guests_today} new today
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activities */}
      <div className="dashboard-grid">
        {/* Revenue Chart */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Monthly Revenue</h3>
          </div>
          <div className="chart-container">
            <div className="simple-chart">
              {revenueChart.map((item, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar" 
                    style={{ 
                      height: `${(item.revenue / Math.max(...revenueChart.map(r => r.revenue))) * 100}%` 
                    }}
                  ></div>
                  <div className="bar-label">{item.month}</div>
                  <div className="bar-value">${item.revenue.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Room Occupancy */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Room Type Occupancy</h3>
          </div>
          <div className="occupancy-list">
            {roomOccupancy.map((room, index) => (
              <div key={index} className="occupancy-item">
                <div className="occupancy-info">
                  <span className="room-type">{room.room_type}</span>
                  <span className="occupancy-rate">{room.occupancy_rate}%</span>
                </div>
                <div className="occupancy-bar">
                  <div 
                    className="occupancy-fill" 
                    style={{ width: `${room.occupancy_rate}%` }}
                  ></div>
                </div>
                <div className="occupancy-details">
                  {room.occupied_rooms}/{room.total_rooms} rooms
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Activities</h3>
          </div>
          <div className="activities-list">
            {activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.activity_type}`}>
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="activity-content">
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-time">
                    {new Date(activity.activity_time).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'booking': return '📝';
    case 'checkin': return '🔑';
    case 'checkout': return '🚪';
    default: return '📄';
  }
};

export default Dashboard;