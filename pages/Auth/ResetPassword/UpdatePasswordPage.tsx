// src/pages/ForgotPassword/UpdatePasswordPage.tsx
import React, { useState } from 'react';
import { authService, decodeErrorResponse } from '@/services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface UpdateFormData {
  email?: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  token: string;
}

export default function UpdatePasswordPage() {
  const location = useLocation();
  const { identifier, isEmail, token } = location.state || {};
  
  const navigate = useNavigate();

  if (!identifier || !isEmail || !token) {
    navigate('/password-reset');
  }

  const [formData, setFormData] = useState<UpdateFormData>(
    isEmail
      ? { password: '', password_confirmation: '', email: identifier, token: token }
      : { password: '', password_confirmation: '', phone: identifier, token: token }
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi lokal sebelum mengirim ke API
    if (formData.password !== formData.password_confirmation) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.passwordResetConfirm(formData);
      setSuccess(response.message || 'Password berhasil diubah! Mengalihkan ke halaman login...');
    } catch (err: any) {
      setError((await decodeErrorResponse(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Atur Ulang Password</h1>
      <p className="text-gray-600 mb-8 text-center">Masukkan password baru Anda.</p>

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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password Baru
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoFocus
            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </div>

        {success &&
          <div>
            <Link to="/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kembali ke halaman login
            </Link>
          </div>
        }
      </form>
    </div>
  );
}