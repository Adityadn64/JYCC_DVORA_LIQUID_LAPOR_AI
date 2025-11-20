import React, { useState, useEffect } from 'react';
import { adminProfileService, authService, decodeErrorResponse } from '@/services/api';
// [PERBAIKAN] Import componentized skeletons instead of a generic one
import { SkeletonProfileHeader, SkeletonActionCard } from '@/components/SkeletonLoading';
import { CsrfLoadingProps } from '@/types';
import { useNavigate } from 'react-router-dom';

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
  kta_scan_path?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  service_profile: ServiceProfile | null; // Added service profile
  activity?: {
    total_assigned: number;
    total_finished: number;
    avg_resolution_time: string;
    recent_reports: any[];
  };
}

interface EditFormData {
  full_name: string;
  nip: string;
  profile_picture?: File;
}

interface PasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
  logout_other_devices: boolean;
}

interface ContactFormData {
  email?: string;
  phone?: string;
  password: string;
}

interface EmailChangeFormData {
  new_email: string;
  password: string;
}

interface PhoneChangeFormData {
  new_phone: string;
  password: string;
}

interface tokenFormData {
  token: string;
}

interface KtaFormData {
  kta_scan: File;
}

export default function AdminProfilePage({ csrfLoading }: CsrfLoadingProps) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [displayFormData, setDisplayFormData] = useState<EditFormData>({ full_name: '', nip: '' });
  const [editFormData, setEditFormData] = useState<EditFormData>({ full_name: '', nip: '' });
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({ current_password: '', password: '', password_confirmation: '', logout_other_devices: false });
  const [contactFormData, setContactFormData] = useState<ContactFormData>({ email: '', phone: '', password: '' });
  const [emailChangeFormData, setEmailChangeFormData] = useState<EmailChangeFormData>({ new_email: '', password: '' });
  const [phoneChangeFormData, setPhoneChangeFormData] = useState<PhoneChangeFormData>({ new_phone: '', password: '' });
  const [tokenFormData, settokenFormData] = useState<tokenFormData>({ token: '' });
  const [ktaFormData, setKtaFormData] = useState<KtaFormData>({ kta_scan: null as any });

  const navigate = useNavigate();

  useEffect(() => {
    if (csrfLoading) fetchProfile();
  }, [csrfLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await adminProfileService.getProfile();
      // [PERBAIKAN] Data is nested under response.data.admin
      const adminData = response.data.admin;
      setProfile(adminData);

      const formData = {
        full_name: adminData.full_name,
        nip: adminData.nip,
      };

      setEditFormData(formData);
      setDisplayFormData(formData);

      setContactFormData({
        email: adminData.email,
        phone: adminData.phone,
        password: adminData.password,
      });
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || 'Gagal memuat profil');
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
    const { name, value, checked, type } = e.target;

    const newValue = type === 'checkbox' ? checked : value;

    console.log({ name, value, checked, type });

    setPasswordFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const data = {
        full_name: editFormData.full_name,
        nip: editFormData.nip,
      };

      const response = await adminProfileService.updateProfile(data);

      setProfile(response.data.admin);
      setSuccess('info: ' + (response.message || 'Informasi akun berhasil diperbarui'));
      setActiveModal(null);
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || 'Gagal memperbarui profil');
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
      setPasswordFormData({ current_password: '', password: '', password_confirmation: '', logout_other_devices: false });
      setActiveModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || 'Gagal mengubah password');
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
      setError((await decodeErrorResponse(err)) || 'Gagal mengubah informasi kontak');
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
    <div>
      <div className="max-w-7xl mx-auto space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0 p-4">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header Section */}
          <div className="bg-white shadow-lg rounded-xl p-8 border">
            {success && success.includes('header') && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{success}</p>
              </div>
            )}
            {profile && (
              <form onSubmit={handleUpdateProfile} encType="multipart/form-data">
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <img
                    className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32"
                    src={profile.profile_picture_path || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}`}
                    alt="Foto Profil"
                    id="profilePicPreview"
                  />
                  <div className="text-center sm:text-left">
                    <h1 className="font-bold text-gray-900 sm:text-2xl md:text-3xl">{profile.full_name}</h1>
                    <p className="text-gray-500">
                      <span className="font-medium text-blue-600">{profile.role.replace(/_/, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      Status: <span className="font-medium text-green-600">Aktif</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-700 mb-1">Ubah Foto Profil</label>
                  <input
                    type="file"
                    id="profile_picture"
                    name="profile_picture"
                    accept="image/jpeg,image/png,image/jpg"
                    className="block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => {
                      handleFileChange(e);
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const img = document.getElementById('profilePicPreview') as HTMLImageElement;
                          if (img && e.target?.result) img.src = e.target.result as string;
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="mt-3 w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Simpan Foto
                  </button>
                </div>
              </form>
            )}
          </div>


          {/* Info & Contact Section */}
          <div className="bg-white shadow-lg rounded-xl p-8 border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informasi Akun & Identitas</h2>

            {success && success.includes('info') && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{success}</p>
              </div>
            )}
            {success && success.includes('docs') && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{success}</p>
              </div>
            )}

            {/* Info Form */}
            <div className="space-y-6 border-b pb-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <input type="text" id="full_name" name="full_name"
                    value={displayFormData.full_name} disabled
                    className="text-gray-400 mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  <button type="button" onClick={() => setActiveModal('fullName')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500">Ubah Nama Lengkap</button>
                </div>
                <div>
                  <label htmlFor="nip" className="block text-sm font-medium text-gray-700">NIP</label>
                  <input type="text" id="nip" name="nip" value={displayFormData.nip} disabled
                    className="text-gray-400 mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  <button type="button" onClick={() => setActiveModal('nip')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500">Ubah NIP</button>
                </div>
              </div>
            </div>

            {/* Readonly Info & Change Buttons */}
            <div className="space-y-4 border-b pb-6 mb-6">
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900 md:col-span-2 flex justify-between items-center">
                  <span>{profile?.email ? profile.email.replace(/(.{3}).*(@.*)/, '$1***$2') : ''}</span>
                  <button onClick={() => setActiveModal('emailChange')}
                    className="font-medium text-blue-600 hover:text-blue-500">Ubah</button>
                </dd>
              </dl>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">No. Telepon</dt>
                <dd className="text-sm text-gray-900 md:col-span-2 flex justify-between items-center">
                  <span>{profile?.phone ? profile.phone.replace(/(.{3}).*(.{4})/, '$1***$2') : ''}</span>
                  <button onClick={() => setActiveModal('phoneChange')}
                    className="font-medium text-blue-600 hover:text-blue-500">Ubah</button>
                </dd>
              </dl>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Dinas / Instansi</dt>
                <dd className="text-sm text-gray-900 md:col-span-2 font-medium">{profile?.service_profile?.full_name ?? 'N/A'}</dd>
              </dl>
            </div>

            {/* KTA Upload */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setError(null);
                const formData = new FormData();
                if (ktaFormData.kta_scan) {
                  formData.append('kta_scan', ktaFormData.kta_scan);
                }
                const response = await adminProfileService.updateKta({ kta_scan: ktaFormData.kta_scan });
                setSuccess(response.message || 'Scan KTA berhasil diunggah');
                setActiveModal(null);
              } catch (err: any) {
                setError((await decodeErrorResponse(err)) || 'Gagal mengunggah KTA');
              }
            }}>
              <label htmlFor="kta_scan" className="block text-sm font-medium text-gray-700 mb-1">Scan KTA/Kartu Pegawai</label>
              {profile?.kta_scan_path && (
                <div className="mb-2 text-sm">
                  File saat ini: <a href={profile.kta_scan_path} target="_blank"
                    className="text-blue-600 hover:underline">Lihat KTA</a>
                </div>
              )}
              <input type="file" id="kta_scan" name="kta_scan" accept=".pdf,.jpg,.png" required
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setKtaFormData({ kta_scan: e.target.files[0] });
                  }
                }}
                className="block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <button type="submit"
                className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Unggah KTA</button>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-white shadow-lg rounded-xl p-8 border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Keamanan Akun</h2>
            {success && success.includes('password') && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{success}</p>
              </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row">

              <button onClick={() => setActiveModal('password')}
                className="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                Ganti Password
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await adminProfileService.exportProfile();
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'profile.csv');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (err: any) {
                    setError((await decodeErrorResponse(err)) || 'Gagal mengunduh data pribadi');
                  }
                }}
                className="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Download Data Pribadi
              </button>

              {profile?.role !== 'system_admin' && (
                <button onClick={() => setActiveModal("nonActive")}
                  className="w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-sm font-semibold shadow-sm text-white hover:bg-red-700">
                  Nonaktifkan Akun Saya
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
          {profile?.role === 'base_admin' && profile.activity && (
            <div className="bg-white shadow-lg rounded-xl p-6 border">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Aktivitas Saya</h3>
              <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-600">Total Laporan Ditugaskan</span>
                <span className="text-lg font-bold text-gray-900">{profile.activity.total_assigned}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-600">Total Laporan Selesai</span>
                <span className="text-lg font-bold text-green-600">{profile.activity.total_finished}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-600">Waktu Penyelesaian Rata-rata</span>
                <span className="text-lg font-bold text-blue-600">{profile.activity.avg_resolution_time}</span>
              </div>

              <h4 className="text-md font-semibold text-gray-800 mt-8 mb-3">5 Laporan Terakhir Ditangani</h4>
              <ul className="divide-y divide-gray-200">
                {profile.activity.recent_reports?.map((report: any) => (
                  <li key={report.id} className="py-3 flex grid-cols-2 justify-between">
                    <div className="block hover:bg-gray-50 p-2 rounded-md">
                      <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                      <p className="text-xs text-gray-500">ID: #{report.id} - Diperbarui: {new Date(report.updated_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="block hover:bg-gray-50 p-2 rounded-md">
                      <a href={`/report/${report.id}/track`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-900">Lihat Detail</a>
                    </div>
                  </li>
                )) || (
                    <li className="py-3 text-sm text-gray-500 text-center">Belum ada laporan yang ditangani.</li>
                  )}
              </ul>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-xl p-6 border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Metadata Akun</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Dibuat Pada</dt>
                <dd className="text-sm font-medium text-gray-700">{profile ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Terakhir Diperbarui</dt>
                <dd className="text-sm font-medium text-gray-700">{profile ? new Date(profile.updated_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</dd>
              </div>
              {profile?.deleted_at && (
                <div className="flex justify-between">
                  <dt className="text-sm text-red-500">Dihapus Pada</dt>
                  <dd className="text-sm font-medium text-red-700">{new Date(profile.deleted_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
      {/* Email Change Modal */}
      {activeModal === 'emailChange' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah Alamat Email</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const response = await adminProfileService.changeContact({ new_email: emailChangeFormData.new_email, password: emailChangeFormData.password });
                  setSuccess('token telah dikirim ke alamat email baru Anda.');
                  setActiveModal('emailtoken');
                } catch (err: any) {
                  setError((await decodeErrorResponse(err)) || 'Gagal mengirim token');
                }
              }}>
                <p className="text-sm text-gray-600 mb-4">Kami akan mengirimkan token 6 digit ke alamat email **baru** Anda untuk verifikasi.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new_email" className="block text-sm font-medium text-gray-700">Alamat Email Baru</label>
                    <input type="email" id="new_email" name="new_email" required
                      value={emailChangeFormData.new_email} onChange={(e) => setEmailChangeFormData(prev => ({ ...prev, new_email: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="password_for_email" className="block text-sm font-medium text-gray-700">Konfirmasi Password Anda</label>
                    <input type="password" id="password_for_email" name="password" required
                      value={emailChangeFormData.password} onChange={(e) => setEmailChangeFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="pt-2 text-right">
                    <button type="button" onClick={() => setActiveModal(null)} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Kirim Token</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Email token Modal */}
      {activeModal === 'emailtoken' && (
        <div className="fixed inset-0 z-50 top-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Verifikasi Email</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const response = await adminProfileService.verifyEmailChange({ token: tokenFormData.token });
                  setProfile(response.data.admin);
                  setSuccess('Alamat email Anda berhasil diperbarui.');
                  setActiveModal(null);
                } catch (err: any) {
                  setError((await decodeErrorResponse(err)) || 'Token tidak valid');
                }
              }}>
                <p className="text-sm text-gray-600 mb-4">Masukkan token 6 digit yang kami kirim ke **{emailChangeFormData.new_email}**.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="token_email" className="block text-sm font-medium text-gray-700">Token</label>
                    <input type="text" id="token_email" name="token_email" required pattern="\d{6}" maxLength={6}
                      value={tokenFormData.token} onChange={(e) => settokenFormData({ token: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-[.5em]" />
                  </div>
                  <div className="pt-2 text-right">
                    <button type="button" onClick={() => setActiveModal(null)} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700">Verifikasi & Ganti Email</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Phone Change Modal */}
      {activeModal === 'phoneChange' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah Nomor Telepon</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const response = await adminProfileService.changeContact({ new_phone: phoneChangeFormData.new_phone, password: phoneChangeFormData.password });
                  setSuccess('token telah dikirim ke nomor telepon baru Anda.');
                  setActiveModal('phoneOtp');
                } catch (err: any) {
                  setError((await decodeErrorResponse(err)) || 'Gagal mengirim token');
                }
              }}>
                <p className="text-sm text-gray-600 mb-4">Kami akan mengirimkan token 6 digit ke nomor telepon **baru** Anda untuk verifikasi.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new_phone" className="block text-sm font-medium text-gray-700">Nomor Telepon Baru</label>
                    <input type="tel" id="new_phone" name="new_phone" required
                      value={phoneChangeFormData.new_phone} onChange={(e) => setPhoneChangeFormData(prev => ({ ...prev, new_phone: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="password_for_phone" className="block text-sm font-medium text-gray-700">Konfirmasi Password Anda</label>
                    <input type="password" id="password_for_phone" name="password" required
                      value={phoneChangeFormData.password} onChange={(e) => setPhoneChangeFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="pt-2 text-right">
                    <button type="button" onClick={() => setActiveModal(null)} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Kirim Token</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Phone token Modal */}
      {activeModal === 'phoneOtp' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Verifikasi Telepon</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const response = await adminProfileService.verifyPhoneChange({ token: tokenFormData.token });
                  setProfile(response.data.admin);
                  setSuccess('Nomor telepon Anda berhasil diperbarui.');
                  setActiveModal(null);
                } catch (err: any) {
                  setError((await decodeErrorResponse(err)) || 'Kode OTP tidak valid');
                }
              }}>
                <p className="text-sm text-gray-600 mb-4">Masukkan kode 6 digit yang kami kirim ke **{phoneChangeFormData.new_phone}**.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="token_phone" className="block text-sm font-medium text-gray-700">Kode OTP</label>
                    <input type="text" id="token_phone" name="token_phone" required pattern="\d{6}" maxLength={6}
                      value={tokenFormData.token} onChange={(e) => settokenFormData({ token: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-[.5em]" />
                  </div>
                  <div className="pt-2 text-right">
                    <button type="button" onClick={() => setActiveModal(null)} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700">Verifikasi & Ganti Telepon</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Full Name Change Modal */}
      {activeModal === 'fullName' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah Nama Lengkap</h3>
                <button onClick={() => { setActiveModal(null); setEditFormData(displayFormData); }} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const response = await adminProfileService.updateFullName({
                    full_name: editFormData.full_name,
                    password: emailChangeFormData.password // Using existing password field
                  });
                  setProfile({ ...profile, full_name: editFormData.full_name });
                  setDisplayFormData({ ...displayFormData, full_name: editFormData.full_name })
                  setSuccess('Nama lengkap berhasil diperbarui.');
                  setActiveModal(null);
                } catch (err: any) {
                  setError((await decodeErrorResponse(err)) || 'Gagal memperbarui nama lengkap');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="full_name_modal" className="block text-sm font-medium text-gray-700">Nama Lengkap Baru</label>
                    <input type="text" id="full_name_modal" name="full_name" required
                      value={editFormData.full_name} onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="password_full_name" className="block text-sm font-medium text-gray-700">Konfirmasi Password Anda</label>
                    <input type="password" id="password_full_name" name="password" required
                      value={emailChangeFormData.password} onChange={(e) => setEmailChangeFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="pt-2 text-right">
                    <button type="button" onClick={() => { setActiveModal(null); setEditFormData(displayFormData); }} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan Nama Lengkap</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NIP Change Modal */}
      {activeModal === 'nip' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah NIP</h3>
                <button onClick={() => { setActiveModal(null); setEditFormData(displayFormData); }} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const response = await adminProfileService.updateNip({
                    nip: editFormData.nip,
                    password: phoneChangeFormData.password // Using existing password field
                  });
                  setProfile(response.data.admin);
                  setSuccess('NIP berhasil diperbarui.');
                  setProfile({ ...profile, nip: editFormData.nip });
                  setDisplayFormData({ ...displayFormData, nip: editFormData.nip })
                  setActiveModal(null);
                } catch (err: any) {
                  setError((await decodeErrorResponse(err)) || 'Gagal memperbarui NIP');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nip_modal" className="block text-sm font-medium text-gray-700">NIP Baru</label>
                    <input type="text" id="nip_modal" name="nip" required
                      value={editFormData.nip} onChange={(e) => setEditFormData(prev => ({ ...prev, nip: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="password_nip" className="block text-sm font-medium text-gray-700">Konfirmasi Password Anda</label>
                    <input type="password" id="password_nip" name="password" required
                      value={phoneChangeFormData.password} onChange={(e) => setPhoneChangeFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="pt-2 text-right">
                    <button type="button" onClick={() => { setActiveModal(null); setEditFormData(displayFormData); }} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan NIP</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ganti Password</h3>
                <button onClick={() => { setActiveModal(null); setPasswordFormData({ current_password: '', password: '', password_confirmation: '', logout_other_devices: false }); setError(null); setSuccess(null) }} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
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
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">Password Saat Ini</label>
                    <input type="password" id="current_password" name="current_password" required
                      value={passwordFormData.current_password} onChange={handlePasswordChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password Baru</label>
                    <input type="password" id="password" name="password" required
                      value={passwordFormData.password} onChange={handlePasswordChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
                    <input type="password" id="password_confirmation" name="password_confirmation" required
                      value={passwordFormData.password_confirmation} onChange={handlePasswordChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center">
                    <input id="logout_other_devices" name="logout_other_devices" type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" onChange={handlePasswordChange} checked={passwordFormData.logout_other_devices} />
                    <label htmlFor="logout_other_devices" className="ml-2 block text-sm text-gray-900">Keluarkan dari semua sesi lain</label>
                  </div>
                  <div className="pt-2 text-right">
                    <button type="button" onClick={() => { setActiveModal(null); setPasswordFormData({ current_password: '', password: '', password_confirmation: '', logout_other_devices: false }) }} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan Password</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Nonaktif Change Modal */}
      {activeModal === 'nonActive' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Nonaktifkan Akun Saya</h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const response = await adminProfileService.deactivateSelf();
                  setSuccess(response.message || "Akun berhasil dinonaktifkan")
                  await authService.logout();
                  setTimeout(() => {
                    navigate({ pathname: "/login" });
                  }, 3000);
                } catch (err: any) {
                  setError(await decodeErrorResponse(err) || "Gagal menonaktifkan akun")
                }
              }}>
                <div className="space-y-4">
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
                  <p>Anda yakin ingin menonaktifkan akun anda? Tindakan ini tidak dapat dibatalkan tanpa bantuan System Admin</p>
                  <div className="text-right">
                    <button type="button" onClick={() => setActiveModal(null)} className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700">Nonaktifkan</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}