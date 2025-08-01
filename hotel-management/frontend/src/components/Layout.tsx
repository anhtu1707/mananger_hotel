import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Rooms', href: '/rooms', icon: '🏨' },
    { name: 'Bookings', href: '/bookings', icon: '📅' },
    { name: 'Guests', href: '/guests', icon: '👥' },
  ];

  // Add admin/manager only routes
  if (user?.role === 'admin' || user?.role === 'manager') {
    navigation.push({ name: 'Staff', href: '/staff', icon: '👨‍💼' });
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>🏨 Hotel Manager</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item ${location.pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1>{getPageTitle(location.pathname)}</h1>
          </div>
          <div className="header-right">
            <div className="user-menu">
              <span className="user-name">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="user-role">({user?.role})</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

const getPageTitle = (pathname: string): string => {
  switch (pathname) {
    case '/': return 'Dashboard';
    case '/rooms': return 'Room Management';
    case '/bookings': return 'Booking Management';
    case '/guests': return 'Guest Management';
    case '/staff': return 'Staff Management';
    default: return 'Hotel Management';
  }
};

export default Layout;