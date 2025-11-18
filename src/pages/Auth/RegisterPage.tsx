import React, { useState, useEffect } from 'react';
import { authService, decodeErrorResponse } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { CsrfLoadingProps } from '@/types';

// Tipe data yang lebih lengkap sesuai form Blade
interface RegisterFormData {
  full_name: string;
  email: string;
  phone: string;
  nip: string;
  password?: string;
  password_confirmation?: string;
  role: 'system_admin' | 'base_admin' | '';
  service_code: string | null;
  kta_scan?: File | null;
}

// Tipe data untuk opsi filter (diasumsikan didapat dari API)
interface RegisterOptions {
  roles: string[];
  serviceProfiles: { code: { value: string }, full_name: string }[];
}

export default function RegisterPage({ csrfLoading }: CsrfLoadingProps) {
  const [step, setStep] = useState(1); // 1: Form Lengkap, 2: Verifikasi OTP
  const [formData, setFormData] = useState<RegisterFormData>({
    full_name: '',
    email: '',
    phone: '',
    nip: '',
    password: '',
    password_confirmation: '',
    role: '',
    service_code: null,
    kta_scan: null
  });
  
  const [otp, setOtp] = useState({ email_otp: '', phone_otp: '' });
  const [options, setOptions] = useState<RegisterOptions>({ roles: [], serviceProfiles: [] });
  const [error, setError] = useState<string | string[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Efek untuk mengambil data dropdown (roles & services) saat komponen dimuat
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Asumsi ada endpoint API untuk mendapatkan data ini
        const response = await authService.getRegisterOptions();
        console.log({responseData: response.data})
        setOptions(response.data);
      } catch (err) {
        setError('Gagal memuat opsi pendaftaran.');
      }
    };
    if (csrfLoading) {
      fetchOptions();
    }
  }, [csrfLoading]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, kta_scan: e.target.files![0] }));
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtp(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: Mengirim semua data pendaftaran (termasuk file)
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.password_confirmation) {
      setError("Kata sandi tidak cocok!");
      return;
    }

    // Menggunakan FormData karena ada file upload
    const data = new FormData();

    data.append('full_name', formData.full_name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('password', formData.password);
    data.append('nip', formData.nip);
    data.append('role', formData.role);
    data.append('service_code', formData.service_code);
    data.append('kta_scan', formData.kta_scan);

    try {
      const response = await authService.registerStart(data);
      setSuccess(response.data.message || 'Data berhasil dikirim. Silakan verifikasi OTP.');
      setStep(2); // Pindah ke langkah verifikasi
    } catch (err: any) {
      const decodedError = await decodeErrorResponse(err);
      setError(decodedError || 'Terjadi kesalahan saat mengirim data.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Mengirim OTP untuk menyelesaikan registrasi
  const handleSubmitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Data yang dibutuhkan backend: email dan kedua OTP
      const payload = {
        email: formData.email,
        email_otp: otp.email_otp,
        phone_otp: otp.phone_otp
      };
      const response = await authService.registerVerifyOtp(payload);
      setSuccess(response.data.message || 'Pendaftaran berhasil! Akun Anda sedang ditinjau oleh Admin.');
      setTimeout(() => {
        navigate('/login'); // Arahkan ke login setelah sukses
      }, 3000);
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || 'OTP tidak valid atau terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };
  
  // Menampilkan error dalam bentuk list jika error adalah array
  const renderError = () => {
    if (!error) return null;
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">Terjadi Kesalahan</p>
        {Array.isArray(error) ? (
          <ul className="mt-2 list-disc list-inside">
            {error.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        ) : (
          <p>{error}</p>
        )}
      </div>
    );
  };

  // Definisikan class CSS untuk konsistensi
  const inputClass = "mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const fileInputClass = "mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100";
  const buttonClass = "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50";

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg rounded-xl p-8">
      {/* ... (Header, Pesan Error & Sukses tidak berubah) ... */}
      
      {step === 1 && (
        <form onSubmit={handleSubmitRegister} className="space-y-6">
          <div><label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label><input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required className={inputClass} /></div>
          <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">Alamat Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} /></div>
          <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700">Nomor Telepon</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} /></div>
          <div><label htmlFor="nip" className="block text-sm font-medium text-gray-700">NIP</label><input type="text" id="nip" name="nip" value={formData.nip} onChange={handleChange} required className={inputClass} /></div>
          <div><label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label><input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className={inputClass} /></div>
          <div><label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Konfirmasi Password</label><input type="password" id="password_confirmation" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required className={inputClass} /></div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Peran (Role)</label>
            <select name="role" id="role" value={formData.role} onChange={handleChange} required className={inputClass}>
              <option value="">Pilih Peran</option>
              {/* DIPERBAIKI: Mapping disesuaikan dengan struktur objek { name, value } */}
              {options.roles.map(role => (
                <option key={role} value={role}>{role.split("_").map(c => c[0].toUpperCase() + c.substring(1)).join(" ")}</option>
              ))}
            </select>
          </div>
          
          {formData.role === 'base_admin' && (
            <div>
              <label htmlFor="service_code" className="block text-sm font-medium text-gray-700">Asal Dinas</label>
              <select name="service_code" id="service_code" value={formData.service_code || ''} onChange={handleChange} required className={inputClass}>
                <option value="">Pilih Asal Dinas</option>
                {options.serviceProfiles.map(profile => (
                  <option key={profile.code.value} value={profile.code.value}>{profile.full_name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="kta_scan" className="block text-sm font-medium text-gray-700">Scan KTA/Kartu Pegawai</label>
            <input type="file" id="kta_scan" name="kta_scan" onChange={handleFileChange} required className={fileInputClass} />
          </div>
          
          <div className="pt-4">
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? 'Mengirim...' : 'Daftar & Kirim Kode Verifikasi'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmitVerify} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email_otp">Kode OTP Email</label>
              <input type="text" name="email_otp" value={otp.email_otp} onChange={handleOtpChange} required maxLength={6} className={`${inputClass} text-center tracking-[.5em]`} />
            </div>
            <div>
              <label htmlFor="phone_otp">Kode OTP Telepon</label>
              <input type="text" name="phone_otp" value={otp.phone_otp} onChange={handleOtpChange} required maxLength={6} className={`${inputClass} text-center tracking-[.5em]`} />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md">
              {loading ? 'Memverifikasi...' : 'Konfirmasi & Selesaikan Registrasi'}
            </button>
          </div>
        </form>
      )}

      {!success && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun?
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
              Login di sini
            </a>
          </p>
        </div>
      )}
    </div>
  );
}