import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetPage from './pages/PasswordResetPage';
import ReportCreatePage from './pages/ReportCreatePage';
import ReportTrackPage from './pages/ReportTrackPage';
import ReportTrackShowPage from './pages/ReportTrackShowPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminProfilePage from './pages/AdminProfilePage';
import AdminManagePage from './pages/AdminManagePage';
import AdminPerformancePage from './pages/AdminPerformancePage';
import { csrfService } from './services/api';

interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  profile_picture_path?: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on component mount and initialize CSRF token
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize CSRF token from Express/Laravel
        await csrfService.getCsrfToken();

        // Check if there's a token in session/storage
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Could verify token here if needed
          setIsAuthenticated(true);
          const userData = localStorage.getItem('user_data');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (userData: AuthUser, token: string) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
        
        <main className="flex-grow py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/password-reset" element={<PasswordResetPage />} />
              
              {/* Report Routes - Public */}
              <Route path="/report/create" element={<ReportCreatePage />} />
              <Route path="/report/track" element={<ReportTrackPage />} />
              <Route path="/report/:id/track" element={<ReportTrackShowPage />} />

              {/* Admin Routes - Protected */}
              <Route 
                path="/admin/dashboard" 
                element={isAuthenticated ? <AdminDashboardPage /> : <Navigate to="/login" />}
              />
              <Route 
                path="/admin/analytics" 
                element={isAuthenticated ? <AdminAnalyticsPage /> : <Navigate to="/login" />}
              />
              <Route 
                path="/admin/profile" 
                element={isAuthenticated ? <AdminProfilePage /> : <Navigate to="/login" />}
              />
              <Route 
                path="/admin/manage" 
                element={isAuthenticated ? <AdminManagePage /> : <Navigate to="/login" />}
              />
              <Route 
                path="/admin/performance" 
                element={isAuthenticated ? <AdminPerformancePage /> : <Navigate to="/login" />}
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
