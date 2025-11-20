// src/pages/ForgotPassword/VerifyOtpPage.tsx
import React, { useState } from 'react';
import { authService, decodeErrorResponse } from '@/services/api';
import { useLocation, useNavigate } from 'react-router-dom';

interface VerifyFormData {
  email?: string;
  phone?: string;
  token: string;
}

export default function VerifyOtpResetPasswordPage() {
  const location = useLocation();
  const { identifier, isEmail } = location.state || {};

  const navigate = useNavigate();

  if (!identifier || !isEmail) {
    navigate('/password-reset');
  }

  const [formData, setFormData] = useState<VerifyFormData>(
    isEmail
      ? { email: identifier, token: '' }
      : { phone: identifier, token: '' }
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
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.passwordResetVerify(formData);

      setSuccess(response.message || 'Verifikasi berhasil! Mengalihkan...');
      setTimeout(() => {
        // Navigasi ke halaman untuk memasukkan password baru
        navigate('/password-reset/update', { state: { identifier: identifier, isEmail: isEmail, token: formData.token } }); 
      }, 1500);

    } catch (err: any) {
      setError((await decodeErrorResponse(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Verifikasi OTP</h1>
      <p className="text-gray-600 mb-8 text-center">Masukkan kode OTP yang dikirimkan kepada Anda.</p>

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
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
            Kode OTP
          </label>
          <input
            type="text"
            id="token"
            name="token"
            value={formData.token}
            onChange={handleChange}
            required
            autoFocus
            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>
        </div>
      </form>
    </div>
  );
}