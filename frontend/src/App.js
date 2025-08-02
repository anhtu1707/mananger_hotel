import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Menu from './pages/Menu/Menu';
import Tables from './pages/Tables/Tables';

// Styles
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/menu" element={
            <PrivateRoute>
              <Layout>
                <Menu />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/tables" element={
            <PrivateRoute>
              <Layout>
                <Tables />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/orders" element={
            <PrivateRoute>
              <Layout>
                <div>Orders Page - Coming Soon</div>
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/employees" element={
            <PrivateRoute roles={['admin', 'manager']}>
              <Layout>
                <div>Employees Page - Coming Soon</div>
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/inventory" element={
            <PrivateRoute roles={['admin', 'manager']}>
              <Layout>
                <div>Inventory Page - Coming Soon</div>
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/reports" element={
            <PrivateRoute roles={['admin', 'manager']}>
              <Layout>
                <div>Reports Page - Coming Soon</div>
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;