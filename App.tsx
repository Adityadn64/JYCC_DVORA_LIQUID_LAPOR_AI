import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginPage from "./pages/Auth/LoginPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/Auth/Register/RequestRegisterPage";
// import PasswordResetPage from '@/pages/Auth/PasswordResetPage';
import ReportCreatePage from "./pages/Report/ReportCreatePage";
import ReportTrackPage from "./pages/Report/ReportTrackPage";
import ReportTrackShowPage from "./pages/Report/ReportTrackShowPage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminAnalyticsPage from "./pages/Admin/AdminAnalyticsPage";
import AdminProfilePage from "./pages/Admin/AdminProfilePage";
import AdminManagePage from "./pages/Admin/AdminManagePage";
import AdminPerformancePage from "./pages/Admin/AdminPerformancePage";
import { allService, csrfService } from "./services/api";
import { AuthUser } from "./types";
import WavingTextLoader from "./components/WavingTextLoader";
import NotFoundPage from "./pages/Callback/NotFoundPage";
import RequestResetPage from "./pages/Auth/ResetPassword/RequestResetPage";
import VerifyOtpResetPasswordPage from "./pages/Auth/ResetPassword/VerifyOtpResetPasswordPage";
import VerifyOtpRegisterPage from "./pages/Auth/Register/VerifyOtpRegisterPage";
import UpdatePasswordPage from "./pages/Auth/ResetPassword/UpdatePasswordPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on component mount and initialize CSRF token
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const userData = await allService.verifyAdmin();
        const auth_token = localStorage.getItem("auth_token");

        if (userData && userData.data && userData.data.user && auth_token && auth_token.trim()) {
          setIsAuthenticated(true);
          setUser(userData.data.user);

          console.log({user: userData.data.user})
        }

        // Initialize CSRF token for cross-site requests
        await csrfService.getCsrfToken();
        console.log("CSRF token initialized successfully");
      } catch (error) {
        console.error("App initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
  };

  const windowLocationPath = window.location.pathname;

  if (
    (windowLocationPath.startsWith("/admin") && loading) ||
    windowLocationPath.startsWith("/loading")
  ) {
    return <WavingTextLoader />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-grow px-4 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<HomePage csrfLoading={!loading} />} />
              <Route
                path="/login"
                element={<LoginPage csrfLoading={!loading} />}
              />
              <Route
                path="/register"
                element={<RegisterPage csrfLoading={!loading} />}
              />
              <Route
                path="/register/verify-otp"
                element={<VerifyOtpRegisterPage />}
              ></Route>
              <Route path="/password-reset" element={<RequestResetPage />} />
              <Route
                path="/password-reset/verify-otp"
                element={<VerifyOtpResetPasswordPage />}
              />
              <Route
                path="/password-reset/update"
                element={<UpdatePasswordPage />}
              />

              <Route
                path="/report/create"
                element={<ReportCreatePage csrfLoading={!loading} />}
              />
              <Route
                path="/report/track"
                element={<ReportTrackPage csrfLoading={!loading} />}
              />
              <Route
                path="/report/:id/track"
                element={
                  <ReportTrackShowPage
                    csrfLoading={!loading}
                    user={user}
                    isAuthenticated={isAuthenticated}
                  />
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  isAuthenticated ? (
                    <AdminDashboardPage csrfLoading={!loading} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  isAuthenticated ? (
                    <AdminAnalyticsPage csrfLoading={!loading} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/profile"
                element={
                  isAuthenticated ? (
                    <AdminProfilePage csrfLoading={!loading} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/manage"
                element={
                  isAuthenticated ? (
                    <AdminManagePage csrfLoading={!loading} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin/performance"
                element={
                  isAuthenticated ? (
                    <AdminPerformancePage csrfLoading={!loading} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
