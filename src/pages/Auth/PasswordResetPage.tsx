import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, decodeErrorResponse } from '../../services/api';

type ResetStep = 'email' | 'verify' | 'password';

interface ResetFormData {
  email: string;
  nip?: string;
  token?: string;
  otp_code?: string;
  password?: string;
  password_confirmation?: string;
}

export default function PasswordResetPage() {
  const [step, setStep] = useState<ResetStep>('email');
  const [formData, setFormData] = useState<ResetFormData>({
    email: '',
    nip: '',
    token: '',
    otp_code: '',
    password: '',
    password_confirmation: ''
  });
  
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

  // Step 1: Request Password Reset
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.passwordResetRequest(formData.email);
      setSuccess(response.data.message || 'Email reset password telah dikirim. Silakan check email Anda.');
      setStep('verify');
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal mengirim email reset password');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleSubmitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.passwordResetVerify({
        email: formData.email,
        token: formData.token || '',
        otp_code: formData.otp_code || ''
      });

      if (response.data.token) {
        setFormData(prev => ({
          ...prev,
          token: response.data.token
        }));
      }

      setSuccess(response.data.message || 'OTP berhasil diverifikasi. Silakan buat password baru.');
      setStep('password');
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal memverifikasi OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Confirm New Password
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.password_confirmation) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.passwordResetConfirm({
        email: formData.email,
        token: formData.token || '',
        password: formData.password || '',
        password_confirmation: formData.password_confirmation || ''
      });

      setSuccess(response.data.message || 'Password berhasil direset! Mengalihkan ke login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Reset Password</h1>
      <p className="text-gray-600 mb-8 text-center">Atur ulang password Anda dengan mengikuti langkah-langkah di bawah.</p>

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

      <div className="flex justify-between mb-8">
        <div className={`flex-1 text-center pb-2 border-b-2 ${step === 'email' ? 'border-blue-600 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
          <p className="text-sm font-medium">1. Email</p>
        </div>
        <div className={`flex-1 text-center pb-2 border-b-2 ${step === 'verify' ? 'border-blue-600 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
          <p className="text-sm font-medium">2. Verifikasi</p>
        </div>
        <div className={`flex-1 text-center pb-2 border-b-2 ${step === 'password' ? 'border-blue-600 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
          <p className="text-sm font-medium">3. Password</p>
        </div>
      </div>

      {step === 'email' && (
        <form onSubmit={handleSubmitEmail} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label htmlFor="nip" className="block text-sm font-medium text-gray-700 mb-1">
              NIP (Opsional)
            </label>
            <input
              type="text"
              id="nip"
              name="nip"
              value={formData.nip}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Nomor Induk Pegawai"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Kembali ke <a href="/login" className="text-blue-600 hover:underline">Login</a>
            </p>
          </div>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleSubmitVerify} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Kode verifikasi telah dikirim ke email <strong>{formData.email}</strong>
            </p>
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Token Reset (dari email)
            </label>
            <input
              type="text"
              id="token"
              name="token"
              value={formData.token}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-center tracking-widest"
              placeholder="Paste token dari email"
            />
          </div>

          <div>
            <label htmlFor="otp_code" className="block text-sm font-medium text-gray-700 mb-1">
              Kode OTP
            </label>
            <input
              type="text"
              id="otp_code"
              name="otp_code"
              value={formData.otp_code}
              onChange={handleChange}
              required
              maxLength={6}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center tracking-widest text-2xl"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
          </button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Kembali
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleSubmitPassword} className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ Email dan OTP berhasil diverifikasi. Silakan buat password baru.
            </p>
          </div>

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
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">Minimal 8 karakter</p>
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
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mengatur Password...' : 'Selesai & Login'}
          </button>

          <button
            type="button"
            onClick={() => setStep('verify')}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Kembali
          </button>
        </form>
      )}
    </div>
  );
}
