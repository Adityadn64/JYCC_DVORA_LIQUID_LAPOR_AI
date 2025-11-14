import React, { useState, useEffect } from 'react';
import { adminManageService } from '../services/api';
import { SkeletonTable, SkeletonList, Skeleton } from '../components/SkeletonLoading';

interface Admin {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nip?: string;
  service_code?: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface AdminRequest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nip?: string;
  service_code?: string;
  requested_at: string;
  request_reason?: string;
}

export default function AdminManagePage() {
  const [tab, setTab] = useState<'manage' | 'requests'>('manage');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nip: '',
    service_code: '',
    password: '',
    password_confirmation: ''
  });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (tab === 'manage') {
        const response = await adminManageService.listAdmins();
        setAdmins(response.data.admins || response.data);
      } else {
        // Assuming there's an endpoint for pending requests
        const response = await adminManageService.listAdmins({ pending: true });
        setRequests(response.data.requests || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await adminManageService.createAdmin({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        nip: formData.nip || undefined,
        service_code: formData.service_code || undefined
      });

      setAdmins([...admins, response.data]);
      setSuccess('Admin baru berhasil ditambahkan');
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan admin');
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    try {
      setError(null);
      const response = await adminManageService.updateAdmin(editingAdmin.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        nip: formData.nip || undefined,
        service_code: formData.service_code || undefined
      });

      setAdmins(admins.map(a => a.id === editingAdmin.id ? response.data : a));
      setSuccess('Admin berhasil diperbarui');
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui admin');
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus admin ini?')) return;

    try {
      setError(null);
      await adminManageService.deleteAdmin(adminId);
      setAdmins(admins.filter(a => a.id !== adminId));
      setSuccess('Admin berhasil dihapus');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus admin');
    }
  };

  const handleToggleStatus = async (adminId: number) => {
    try {
      setError(null);
      const response = await adminManageService.toggleAdminStatus(adminId);
      setAdmins(admins.map(a => a.id === adminId ? response.data : a));
      setSuccess('Status admin berhasil diubah');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengubah status admin');
    }
  };

  const openAddModal = () => {
    setModalType('add');
    resetForm();
    setEditingAdmin(null);
    setShowModal(true);
  };

  const openEditModal = (admin: Admin) => {
    setModalType('edit');
    setEditingAdmin(admin);
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      nip: admin.nip || '',
      service_code: admin.service_code || '',
      password: '',
      password_confirmation: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      nip: '',
      service_code: '',
      password: '',
      password_confirmation: ''
    });
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter(req =>
    req.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 mb-8 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
        {tab === 'manage' ? <SkeletonTable rows={5} /> : <SkeletonList items={5} />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Administrator</h1>
          <p className="mt-2 text-gray-600">Kelola admin sistem dan permohonan admin baru.</p>
        </div>
        {tab === 'manage' && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Tambah Admin
          </button>
        )}
      </div>

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

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setTab('manage')}
          className={`px-6 py-3 font-medium transition-colors ${
            tab === 'manage'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Admin Aktif ({admins.length})
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-6 py-3 font-medium transition-colors ${
            tab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Permohonan Pending ({requests.length})
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* TAB: MANAGE ADMINS */}
      {tab === 'manage' && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Telepon</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredAdmins.length > 0 ? (
                filteredAdmins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{admin.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{admin.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{admin.role}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        admin.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {admin.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin.id)}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {admin.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    Tidak ada admin yang cocok dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: PENDING REQUESTS */}
      {tab === 'requests' && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Telepon</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tanggal Permohonan</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{req.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(req.requested_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      <button
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Terima
                      </button>
                      <button
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Tolak
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                    Tidak ada permohonan pending
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD/EDIT ADMIN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalType === 'add' ? 'Tambah Admin Baru' : 'Edit Admin'}
            </h3>

            <form onSubmit={modalType === 'add' ? handleAddAdmin : handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP (Opsional)</label>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Layanan (Opsional)</label>
                <input
                  type="text"
                  name="service_code"
                  value={formData.service_code}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'add' ? 'Tambah' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
