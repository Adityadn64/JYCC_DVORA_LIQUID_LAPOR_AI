import React, { useState, useEffect } from 'react';
import { adminProfileService, decodeErrorResponse } from '../../services/api';
// [PERBAIKAN] Import componentized skeletons instead of a generic one
import { SkeletonProfileHeader, SkeletonActionCard } from '../../components/SkeletonLoading';

// [PERBAIKAN] Interface for the nested service profile object
interface ServiceProfile {
  id: number;
  full_name: string;
  code: string;
}

// [PERBAIKAN] Updated interface to match the actual API response
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
  service_profile: ServiceProfile | null; // Added service profile
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

  const [editFormData, setEditFormData] = useState<EditFormData>({ full_name: '' });
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({ current_password: '', password: '', password_confirmation: '' });
  const [contactFormData, setContactFormData] = useState<ContactFormData>({ email: '', phone: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await adminProfileService.getProfile();
      // [PERBAIKAN] Data is nested under response.data.admin
      const adminData = response.data.admin;
      setProfile(adminData);
      
      setEditFormData({
        full_name: adminData.full_name,
      });
      setContactFormData({
        email: adminData.email,
        phone: adminData.phone,
      });
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal memuat profil');
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
    if (files && files.length > 0) {
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
      formData.append('_method', 'PUT'); // Common practice for Laravel backends

      // [FIX 1] This call is now valid because the service type definition was changed.
      const response = await adminProfileService.updateProfile(formData);

      setProfile(response.data.admin);
      setSuccess(response.message || 'Profil berhasil diperbarui');
      setActiveModal(null);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal memperbarui profil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.password !== passwordFormData.password_confirmation) {
      setError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const response = await adminProfileService.changePassword(passwordFormData);
      setSuccess(response.message || 'Password berhasil diubah');
      setPasswordFormData({ current_password: '', password: '', password_confirmation: '' });
      setActiveModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal mengubah password');
    }
  };

  const handleChangeContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      const response = await adminProfileService.changeContact(contactFormData);
      
      // [PERBAIKAN] Update local profile state to reflect changes immediately
      if (response.data && response.data.admin) {
        setProfile(response.data.admin);
      }

      setSuccess(response.message || 'Informasi kontak berhasil diubah');
      setActiveModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal mengubah informasi kontak');
    }
  };

  if (loading) {
    // [PERBAIKAN] Use the new componentized skeletons
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4">
        <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
        <SkeletonProfileHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonActionCard title="Keamanan" description="Ubah password Anda secara berkala untuk menjaga keamanan akun." />
          <SkeletonActionCard title="Informasi Kontak" description="Perbarui email dan nomor telepon Anda." />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>

      {error && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"> {error} </div> )}
      {success && ( <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md"> {success} </div> )}

      {profile && (
        <>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                      {profile.profile_picture_path ? (
                          <img src={profile.profile_picture_path} alt={profile.full_name} className="h-32 w-32 rounded-full object-cover border-4 border-blue-200" />
                      ) : (
                          <div className="h-32 w-32 rounded-full bg-blue-200 flex items-center justify-center text-4xl text-blue-600 font-bold">{profile.full_name.charAt(0)}</div>
                      )}
                  </div>
                  <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                      {/* [PERBAIKAN] Display the service/dinas name */}
                      {profile.service_profile && <p className="text-gray-600 mt-1 font-semibold">{profile.service_profile.full_name}</p>}
                      <p className="text-gray-600">Role: <span className="font-medium">{profile.role}</span></p>
                      <p className="text-gray-600">Email: <span className="font-medium">{profile.email}</span></p>
                      <p className="text-gray-600">Telepon: <span className="font-medium">{profile.phone}</span></p>
                      {profile.nip && <p className="text-gray-600">NIP: <span className="font-medium">{profile.nip}</span></p>}
                      <p className="text-sm text-gray-500 mt-4">Bergabung: {new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <button onClick={() => setActiveModal('edit')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Edit Profil</button>
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Keamanan</h3><p className="text-sm text-gray-600 mb-4">Ubah password Anda secara berkala untuk menjaga keamanan akun.</p><button onClick={() => setActiveModal('password')} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Ubah Password</button></div>
                <div className="bg-white rounded-xl shadow p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3><p className="text-sm text-gray-600 mb-4">Perbarui email dan nomor telepon Anda.</p><button onClick={() => setActiveModal('contact')} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Ubah Kontak</button></div>
            </div>
        </>
      )}

      {/* Modals remain unchanged, but will now work correctly due to state and handler fixes */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profil</h3><form onSubmit={handleUpdateProfile} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Foto Profil</label><input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div><div className="flex gap-3 pt-4"><button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button><button type="button" onClick={() => setActiveModal(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Batal</button></div></form></div>
        </div>
      )}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Ubah Password</h3><form onSubmit={handleChangePassword} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label><input type="password" name="current_password" value={passwordFormData.current_password} onChange={handlePasswordChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label><input type="password" name="password" value={passwordFormData.password} onChange={handlePasswordChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label><input type="password" name="password_confirmation" value={passwordFormData.password_confirmation} onChange={handlePasswordChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div><div className="flex gap-3 pt-4"><button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Ubah</button><button type="button" onClick={() => setActiveModal(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Batal</button></div></form></div>
        </div>
      )}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Ubah Informasi Kontak</h3><form onSubmit={handleChangeContact} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" value={contactFormData.email} onChange={handleContactChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label><input type="tel" name="phone" value={contactFormData.phone} onChange={handleContactChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div><div className="flex gap-3 pt-4"><button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan</button><button type="button" onClick={() => setActiveModal(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Batal</button></div></form></div>
        </div>
      )}
    </div>
  );
}