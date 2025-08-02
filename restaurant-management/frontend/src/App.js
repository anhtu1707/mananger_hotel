import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Placeholder components for pages not yet implemented
const MenuPage = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Menu Management</h1>
    <p className="text-gray-600">Menu management functionality will be implemented here.</p>
  </div>
);

const OrdersPage = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Management</h1>
    <p className="text-gray-600">Order management functionality will be implemented here.</p>
  </div>
);

const TablesPage = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Table Management</h1>
    <p className="text-gray-600">Table management functionality will be implemented here.</p>
  </div>
);

const EmployeesPage = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Employee Management</h1>
    <p className="text-gray-600">Employee management functionality will be implemented here.</p>
  </div>
);

const InventoryPage = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Inventory Management</h1>
    <p className="text-gray-600">Inventory management functionality will be implemented here.</p>
  </div>
);

const ReportsPage = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
    <p className="text-gray-600">Reports and analytics functionality will be implemented here.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/menu" element={<MenuPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/tables" element={<TablesPage />} />
                      <Route path="/employees" element={<EmployeesPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
