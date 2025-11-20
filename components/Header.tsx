import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/api';

interface HeaderProps {
  isAuthenticated: boolean;
  user: any;
  onLogout: () => void;
}

export default function Header({ isAuthenticated, user, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      onLogout();
      navigate('/');
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setAdminMenuOpen(false);
  }, [window.location.href])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Lapor<span className="text-gray-900">.ai</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-8">
              <Link to="/" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Beranda
              </Link>
              <Link to="/report/create" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Buat Laporan
              </Link>
              <Link to="/report/track" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Lacak Laporan
              </Link>
            </nav>

            {!isAuthenticated ? (
              <div>
                <Link
                  to="/login"
                  className="inline-block border border-gray-300 rounded-md px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Masuk
                </Link>
              </div>
            ) : (
              <div className="relative inline-block text-left group">
                <button type="button" className="flex justify-center items-center gap-x-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={
                      user?.profile_picture_path
                        ? `http://localhost:8000/storage/${user.profile_picture_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}`
                    }
                    alt="Admin"
                  />
                  <span>Menu Admin</span>
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute right-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block transition-all duration-300">
                  <div className="py-1">
                    <Link to="/admin/dashboard" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">
                      Dasbor
                    </Link>
                    <Link to="/admin/analytics" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">
                      Analisis Laporan
                    </Link>
                    <Link to="/admin/profile" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">
                      Profil
                    </Link>
                    {user?.role === 'system_admin' && (
                      <>
                        <Link to="/admin/manage" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">
                          Kelola Admin
                        </Link>
                        <Link to="/admin/performance" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">
                          Performa Admin
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-red-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Buka menu utama</span>
              {!mobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Beranda
            </Link>
            <Link to="/report/create" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Buat Laporan
            </Link>
            <Link to="/report/track" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Lacak Laporan
            </Link>
          </div>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            {!isAuthenticated ? (
              <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Masuk
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <span>Menu Admin</span>
                  <svg className={`h-5 w-5 transform transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {adminMenuOpen && (
                  <div className="pl-4 mt-1 space-y-1">
                    <Link to="/admin/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                      Dasbor
                    </Link>
                    <Link to="/admin/analytics" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                      Analisis Laporan
                    </Link>
                    <Link to="/admin/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                      Profil
                    </Link>
                    {user?.role === 'system_admin' && (
                      <>
                        <Link to="/admin/manage" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                          Kelola Admin
                        </Link>
                        <Link to="/admin/performance" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                          Performa Admin
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-900 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
