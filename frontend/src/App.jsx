import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import AddPropertyPage from './pages/AddPropertyPage';
import EstimatorPage from './pages/EstimatorPage';
import OwnerDashboard from './pages/OwnerDashboard';
import TenantDashboard from './pages/TenantDashboard';
import WishlistPage from './pages/WishlistPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/properties" element={<PropertiesPage />} />
                <Route path="/properties/:id" element={<PropertyDetailsPage />} />
                <Route path="/estimator" element={<EstimatorPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Owner & Admin Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
                  <Route path="/add-property" element={<AddPropertyPage />} />
                  <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                </Route>

                {/* Tenant Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['tenant']} />}>
                  <Route path="/tenant/dashboard" element={<TenantDashboard />} />
                  <Route path="/tenant/wishlist" element={<WishlistPage />} />
                </Route>

                {/* Admin Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
              </Routes>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
