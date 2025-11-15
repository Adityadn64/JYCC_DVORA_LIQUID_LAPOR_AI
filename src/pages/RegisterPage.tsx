import React, { useState } from 'react';
import { authService, decodeErrorResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface RegisterFormData {
  phone?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: contact, 2: verify, 3: password
  const [formData, setFormData] = useState<RegisterFormData>({
    phone: '',
    email: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.registerStart({ email: formData.email!, phone: formData.phone! });
      setSuccess(response.data.message || 'OTP telah dikirim. Silakan verifikasi.');
      setStep(2);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.registerVerifyOtp({ otp_code: otp, email: formData.email! });
      setSuccess(response.data.message || 'Verifikasi berhasil! Silakan atur password.');
      setStep(3);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'OTP tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register({ email: formData.email!, password: formData.password!, password_confirmation: formData.password! });
      setSuccess(response.data.message || 'Pendaftaran berhasil! Silakan login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Daftar Admin</h1>
      <p className="text-gray-600 mb-8 text-center">Buat akun untuk mengakses sistem.</p>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md">
          <p>{success}</p>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSubmitStart} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Telepon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang Mengirim...' : 'Lanjutkan'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmitVerify} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Kode OTP
            </label>
            <p className="text-sm text-gray-500 mb-2">Kode telah dikirim ke {formData.email || formData.phone}</p>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="000000"
              maxLength={6}
              className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang Verifikasi...' : 'Verifikasi'}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmitComplete} className="space-y-6">
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
              minLength={8}
              className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
              minLength={8}
              className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang Mendaftar...' : 'Selesaikan Pendaftaran'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Sudah punya akun?
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
            Login di sini
          </a>
        </p>
      </div>
    </div>
  );
}
