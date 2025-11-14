import React, { useState, useEffect } from 'react';
import { adminProfileService } from '../services/api';
import { Skeleton } from '../components/SkeletonLoading';

interface AdminProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nip?: string;
  role: string;
  profile_picture_path?: string;
  created_at: string;
  updated_at: string;
}

interface EditFormData {
  full_name: string;
  profile_picture?: File;
}

interface PasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface ContactFormData {
  email?: string;
  phone?: string;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [editFormData, setEditFormData] = useState<EditFormData>({
    full_name: ''
  });

  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await adminProfileService.getProfile();
      setProfile(response.data);
      setEditFormData({
        full_name: response.data.full_name
      });
      setContactFormData({
        email: response.data.email,
        phone: response.data.phone
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setEditFormData(prev => ({ ...prev, profile_picture: files[0] }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const formData = new FormData();
      formData.append('full_name', editFormData.full_name);
      if (editFormData.profile_picture) {
        formData.append('profile_picture', editFormData.profile_picture);
      }

      const response = await adminProfileService.updateProfile({
        full_name: editFormData.full_name,
        profile_picture: editFormData.profile_picture
      });

      setProfile(response.data);
      setSuccess('Profil berhasil diperbarui');
      setActiveModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.password !== passwordFormData.password_confirmation) {
      setError('Password tidak cocok');
      return;
    }

    try {
      setError(null);
      await adminProfileService.changePassword(passwordFormData);
      setSuccess('Password berhasil diubah');
      setPasswordFormData({ current_password: '', password: '', password_confirmation: '' });
      setActiveModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengubah password');
    }
  };

  const handleChangeContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await adminProfileService.changeContact(contactFormData);
      setSuccess('Informasi kontak berhasil diubah');
      setActiveModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengubah informasi kontak');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>

        {/* PROFILE HEADER - Skeleton only on data */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>

            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-24 mt-4" />
            </div>
          </div>
        </div>

        {/* SECURITY SETTINGS - Buttons always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Keamanan</h3>
            <p className="text-sm text-gray-600 mb-4">Ubah password Anda secara berkala untuk menjaga keamanan akun.</p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 text-white rounded-lg cursor-not-allowed"
            >
              Ubah Password
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
            <p className="text-sm text-gray-600 mb-4">Perbarui email dan nomor telepon Anda.</p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 text-white rounded-lg cursor-not-allowed"
            >
              Ubah Kontak
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">{error || 'Profil tidak ditemukan'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
          {success}
        </div>
      )}

      {/* PROFILE HEADER */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {profile.profile_picture_path ? (
              <img
                src={profile.profile_picture_path}
                alt={profile.full_name}
                className="h-32 w-32 rounded-full object-cover border-4 border-blue-200"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-blue-200 flex items-center justify-center text-4xl text-blue-600">
                {profile.full_name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
            <p className="text-gray-600 mt-1">Role: <span className="font-medium">{profile.role}</span></p>
            <p className="text-gray-600">Email: <span className="font-medium">{profile.email}</span></p>
            <p className="text-gray-600">Telepon: <span className="font-medium">{profile.phone}</span></p>
            {profile.nip && <p className="text-gray-600">NIP: <span className="font-medium">{profile.nip}</span></p>}
            <p className="text-sm text-gray-500 mt-4">Bergabung: {new Date(profile.created_at).toLocaleDateString('id-ID')}</p>

            <button
              onClick={() => setActiveModal('edit')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Profil
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY SETTINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CHANGE PASSWORD */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Keamanan</h3>
          <p className="text-sm text-gray-600 mb-4">Ubah password Anda secara berkala untuk menjaga keamanan akun.</p>
          <button
            onClick={() => setActiveModal('password')}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Ubah Password
          </button>
        </div>

        {/* CHANGE CONTACT */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
          <p className="text-sm text-gray-600 mb-4">Perbarui email dan nomor telepon Anda.</p>
          <button
            onClick={() => setActiveModal('contact')}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Ubah Kontak
          </button>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* MODAL: EDIT PROFILE */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profil</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="full_name"
                  value={editFormData.full_name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Profil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubah Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordFormData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  name="password"
                  value={passwordFormData.password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={passwordFormData.password_confirmation}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE CONTACT */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubah Informasi Kontak</h3>
            <form onSubmit={handleChangeContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={contactFormData.email}
                  onChange={handleContactChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={contactFormData.phone}
                  onChange={handleContactChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
