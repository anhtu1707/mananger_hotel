import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            🍽️ Quản Lý Nhà Hàng
          </Link>
          
          <div className="navbar-menu">
            <Link to="/tables" className="navbar-link">
              🪑 Bàn
            </Link>
            
            <Link to="/menu" className="navbar-link">
              📋 Thực đơn
            </Link>
            
            <Link to="/orders" className="navbar-link">
              📦 Đơn hàng
            </Link>
            
            {(isAdmin || isManager) && (
              <>
                <Link to="/employees" className="navbar-link">
                  👥 Nhân viên
                </Link>
                
                <Link to="/inventory" className="navbar-link">
                  📦 Kho
                </Link>
                
                <Link to="/reports" className="navbar-link">
                  📊 Báo cáo
                </Link>
              </>
            )}
          </div>
          
          <div className="navbar-user">
            <span className="navbar-username">👤 {user?.full_name || user?.username}</span>
            <button onClick={handleLogout} className="btn btn-sm btn-secondary">
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
      
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;