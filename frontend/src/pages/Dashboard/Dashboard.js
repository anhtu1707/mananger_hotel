import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tableService, orderService, reportService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [stats, setStats] = useState({
    availableTables: 0,
    occupiedTables: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load tables
      const tables = await tableService.getAll();
      const availableTables = tables.filter(t => t.status === 'available').length;
      const occupiedTables = tables.filter(t => t.status === 'occupied').length;

      // Load today's orders
      const orders = await orderService.getAll();
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => 
        o.created_at.startsWith(today)
      ).length;

      // Load today's revenue (only for admin/manager)
      let todayRevenue = 0;
      if (isAdmin || isManager) {
        const revenueData = await reportService.getDailyRevenue();
        todayRevenue = revenueData.total_revenue;
      }

      setStats({
        availableTables,
        occupiedTables,
        todayOrders,
        todayRevenue
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Xin chào, {user?.full_name || user?.username}! 👋</h1>
        <p>Chào mừng bạn đến với hệ thống quản lý nhà hàng</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <h3>{stats.availableTables}</h3>
            <p>Bàn trống</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🍽️</div>
          <div className="stat-content">
            <h3>{stats.occupiedTables}</h3>
            <p>Bàn đang phục vụ</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.todayOrders}</h3>
            <p>Đơn hàng hôm nay</p>
          </div>
        </div>

        {(isAdmin || isManager) && (
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(stats.todayRevenue)}</h3>
              <p>Doanh thu hôm nay</p>
            </div>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Thao tác nhanh</h2>
        <div className="action-grid">
          <Link to="/tables" className="action-card">
            <div className="action-icon">🪑</div>
            <h3>Quản lý bàn</h3>
            <p>Xem và cập nhật trạng thái bàn</p>
          </Link>

          <Link to="/orders/new" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Tạo đơn mới</h3>
            <p>Tạo đơn hàng cho khách</p>
          </Link>

          <Link to="/menu" className="action-card">
            <div className="action-icon">📋</div>
            <h3>Thực đơn</h3>
            <p>Xem và quản lý món ăn</p>
          </Link>

          {(isAdmin || isManager) && (
            <Link to="/reports" className="action-card">
              <div className="action-icon">📊</div>
              <h3>Báo cáo</h3>
              <p>Xem báo cáo doanh thu</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;