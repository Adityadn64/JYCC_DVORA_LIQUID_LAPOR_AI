// src/pages/Forgtokenassword/VerifytokenPage.tsx
import React, { useState } from "react";
import { authService, decodeErrorResponse } from "../../../services/api";
import { useLocation, useNavigate } from "react-router-dom";

interface VerifyFormData {
  full_name: string;
  email: string;
  phone: string;
  nip: string;
  password: string;
  role: "system_admin" | "base_admin" | "";
  service_code: string | null;
  kta_scan_path: string;
  email_token: string;
  phone_otp: string;
}

export default function VerifyOtpRegisterPage() {
  const location = useLocation();
  const {
    full_name,
    email,
    phone,
    password,
    nip,
    role,
    service_code,
    kta_scan_path,
  } = location.state || {};

  const navigate = useNavigate();

  if (
    !full_name ||
    !email ||
    !phone ||
    !password ||
    !nip ||
    !role ||
    !kta_scan_path
  ) {
    navigate("/register");
  }

  const defaultData = {
    full_name,
    email,
    phone,
    nip,
    password,
    role,
    service_code,
    kta_scan_path,
    email_token: "",
    phone_otp: "",
  };

  const [formData, setFormData] = useState<VerifyFormData>(defaultData);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.registerVerifyToken(formData);
      setSuccess(
        response.data.message ||
          "Pendaftaran berhasil! Akun Anda sedang ditinjau oleh Admin."
      );
      setTimeout(() => {
        navigate("/login"); // Arahkan ke login setelah sukses
      }, 3000);
    } catch (err: any) {
      setError(
        (await decodeErrorResponse(err)) ||
          "token tidak valid atau terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  };

  // Definisikan class CSS untuk konsistensi
  const inputClass =
    "mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        Verifikasi token
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Masukkan token dan kode otp yang dikirimkan kepada Anda.
      </p>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md"
          role="alert"
        >
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email_token">Token Email</label>
            <input
              type="text"
              name="email_token"
              value={formData.email_token}
              onChange={handleChange}
              required
              maxLength={10}
              className={`${inputClass} text-center tracking-[.5em]`}
            />
          </div>
          <div>
            <label htmlFor="phone_otp">Kode OTP Telepon</label>
            <input
              type="text"
              name="phone_otp"
              value={formData.phone_otp}
              onChange={handleChange}
              required
              maxLength={6}
              className={`${inputClass} text-center tracking-[.5em]`}
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Daftar & Kirim Kode Verifikasi"}
          </button>
        </div>
      </form>
    </div>
  );
}
