// src/pages/ForgotPassword/RequestResetPage.tsx
import React, { useState } from 'react';
import { authService, decodeErrorResponse } from '@/services/api'; // Asumsikan decodeErrorResponse ada
import { useNavigate } from 'react-router-dom';

interface RequestFormData {
  identifier: string; // Bisa email atau telepon
  nip: string;
}

export default function RequestResetPage() {
  const [formData, setFormData] = useState<RequestFormData>({
    identifier: '',
    nip: '',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const isEmail = formData.identifier.includes('@');
      const response = await authService.passwordResetRequest(isEmail ? {
        email: formData.identifier, nip: formData.nip
      } : {
        phone: formData.identifier, nip: formData.nip
      });
      
      setSuccess(response.message || 'Permintaan berhasil! Kode OTP telah dikirim.');
      setTimeout(() => {
        navigate('/password-reset/verify-otp', { state: { identifier: formData.identifier, isEmail: isEmail } }); 
      }, 1500);

    } catch (err: any) {
      setError((await decodeErrorResponse(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Reset Password</h1>
      <p className="text-gray-600 mb-8 text-center">Masukkan email/telepon dan NIP Anda.</p>

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
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
            Email / Nomor Telepon
          </label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
            autoFocus
            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="nip" className="block text-sm font-medium text-gray-700 mb-1">
            NIP
          </label>
          <input
            type="text"
            id="nip"
            name="nip"
            value={formData.nip}
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
            {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
          </button>
        </div>
      </form>
    </div>
  );
}