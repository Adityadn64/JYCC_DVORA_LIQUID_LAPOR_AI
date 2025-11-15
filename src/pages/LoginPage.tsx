import React, { useState } from 'react';
import { authService, decodeErrorResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface LoginFormData {
  login_identifier: string;
  password: string;
  remember?: boolean;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    login_identifier: '',
    password: '',
    remember: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(formData);

      console.log({response, auth_token: localStorage.getItem('auth_token'), user_data: localStorage.getItem('user_data')});

      setSuccess(response.data.message || 'Login berhasil! Mengalihkan...');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1000);
    } catch (err: any) {
      setError(decodeErrorResponse(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Admin Login</h1>
      <p className="text-gray-600 mb-8 text-center">Silakan masuk untuk mengakses dasbor.</p>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="login_identifier" className="block text-sm font-medium text-gray-700 mb-1">
            Email / Telepon / NIP
          </label>
          <input
            type="text"
            id="login_identifier"
            name="login_identifier"
            value={formData.login_identifier}
            onChange={handleChange}
            required
            autoFocus
            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={formData.remember}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
              Ingat saya
            </label>
          </div>
          <div className="text-sm">
            <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Lupa password?
            </a>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang Masuk...' : 'Masuk'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Belum punya akun?
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}
