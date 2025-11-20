import React, { useEffect, useState, useRef, useCallback } from 'react';
import { adminManageService, decodeErrorResponse } from '@/services/api';
import { CsrfLoadingProps, PaginationInfo, DOTS, generatePaginationItems } from '@/types';
import { Skeleton } from '@/components/SkeletonLoading';
import { errorMessage } from '@/components/Error';

// ===================================================================================
// DEFINISI TIPE DATA (Berada di atas agar bisa digunakan oleh semua komponen)
// ===================================================================================

interface Admin {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    nip: string;
    role: 'system_admin' | 'base_admin';
    status: 'active' | 'suspended' | 'pending';
    service_code: string | null;
    service_profile?: { full_name: string };
    profile_picture_path: string | null;
    kta_scan_path: string | null;
    created_at: string;
    updated_at: string;
}

interface FilterOptions {
    roles: { name: string; value: string }[];
    statuses: { name: string; value: string }[];
    services: { code: { value: string }; full_name: string }[];
}

// ===================================================================================
// KOMPONEN #1: ConfirmationModal
// Direplikasi dari confirmationModal di request.blade.php
// ===================================================================================

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, title, message, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">{title}</h3>
                    <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500">{message}</p>
                    </div>
                    <div className="items-center px-4 py-3">
                        <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Ya, Lanjutkan
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 ml-2">
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===================================================================================
// KOMPONEN #2: ActivityDrawer
// Direplikasi dari activityDrawer di manage.blade.php
// ===================================================================================

interface ActivityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    adminId: number | null;
}

interface ActivityData {
    admin: Admin;
    recent_reports: { id: number; title: string; updated_at: string; statuses: string[] }[];
}

const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ isOpen, onClose, adminId }) => {
    const [activityData, setActivityData] = useState<ActivityData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && adminId) {
            const fetchActivity = async () => {
                setLoading(true);
                setError(null);
                setActivityData(null);
                try {
                    const response = await adminManageService.getActivity(adminId);
                    setActivityData(response.data);
                } catch (err) {
                    setError((await decodeErrorResponse(err)) || 'Gagal memuat aktivitas');
                } finally {
                    setLoading(false);
                }
            };
            fetchActivity();
        }
    }, [isOpen, adminId]);

    return (
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">Aktivitas Admin</h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto h-full">
                {loading && <div className="text-center py-10">Memuat data aktivitas...</div>}
                {error && errorMessage(error)}
                {activityData && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <img className="h-16 w-16 rounded-full object-cover" src={activityData.admin.profile_picture_path ? `/storage/${activityData.admin.profile_picture_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activityData.admin.full_name)}`} alt={activityData.admin.full_name} />
                            <div>
                                <h4 className="text-lg font-bold">{activityData.admin.full_name}</h4>
                                <p className="text-sm text-gray-600">{activityData.admin.service_profile?.full_name ?? (activityData.admin.role === 'system_admin' ? 'System Admin' : 'N/A')}</p>
                            </div>
                        </div>
                        <dl className="space-y-2">
                            <div className="flex justify-between"><dt className="text-sm text-gray-500">Email</dt><dd className="text-sm font-medium">{activityData.admin.email}</dd></div>
                            <div className="flex justify-between"><dt className="text-sm text-gray-500">Telepon</dt><dd className="text-sm font-medium">{activityData.admin.phone}</dd></div>
                            <div className="flex justify-between"><dt className="text-sm text-gray-500">Bergabung</dt><dd className="text-sm font-medium">{new Date(activityData.admin.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</dd></div>
                        </dl>
                        <div>
                            <h5 className="text-md font-semibold text-gray-800 mb-3">10 Laporan Terakhir Ditangani</h5>
                            <ul className="divide-y divide-gray-200 border rounded-md">
                                {activityData.recent_reports.length > 0 ? activityData.recent_reports.map(report => {
                                    const status = report.statuses[report.statuses.length - 1] || 'unknown';
                                    const updated = new Date(report.updated_at).toLocaleString('id-ID', { timeStyle: 'short', dateStyle: 'short' });
                                    return (
                                        <li key={report.id} className="px-4 py-3">
                                            <a href={`/report/${report.id}/track`} target="_blank" rel="noopener noreferrer" className="block hover:bg-gray-50">
                                                <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                                                <p className="text-xs text-gray-500">#{report.id} - Status: {status} - {updated}</p>
                                            </a>
                                        </li>
                                    );
                                }) : (
                                    <li className="px-4 py-3 text-sm text-gray-500 text-center">Belum ada laporan.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AdminManagePage({ csrfLoading }: CsrfLoadingProps) {
    // STATE UNTUK DATA
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ roles: [], statuses: [], services: [] });
    const [pendingCount, setPendingCount] = useState(0);

    // STATE UNTUK KONTROL UI
    const [viewMode, setViewMode] = useState<'manage' | 'pending'>('manage');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        keyword: '', role: '', status: '', service_code: '',
    });

    const [activityAdminId, setActivityAdminId] = useState<number | null>(null);
    const [confirmModalProps, setConfirmModalProps] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

    // FUNGSI PENGAMBILAN DATA UTAMA
    const fetchAdmins = useCallback(async (page = 1, currentFilters = filters, mode = viewMode) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...currentFilters,
                page,
                pending: mode === 'pending',
            };
            const response = await adminManageService.getAdmins(params);

            setAdmins(response.data.admins.data);
            setPaginationInfo(response.data.admins);

            if (response.data.filterOptions) {
                setFilterOptions(response.data.filterOptions);
            }
            if (typeof response.data.pendingCount !== 'undefined') {
                setPendingCount(response.data.pendingCount);
            }

        } catch (err) {
            setError((await decodeErrorResponse(err)) || 'Gagal memuat data administrator');
        } finally {
            setLoading(false);
        }
    }, [viewMode]);

    // EFEK UNTUK FETCH DATA AWAL
    useEffect(() => {
        if (csrfLoading) {
            fetchAdmins(1);
        }
    }, [csrfLoading, viewMode, fetchAdmins]);

    // HANDLER UNTUK INTERAKSI PENGGUNA
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        console.log({ e: e.target.name + "_" + String(e.target.value) })
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAdmins(1, filters);
    };

    const handleReset = () => {
        const defaultFilters = { keyword: '', role: '', status: '', service_code: '' };
        setFilters(defaultFilters);
        fetchAdmins(1, defaultFilters);
    };

    const handlePageChange = (page: number) => {
        if (page !== paginationInfo?.current_page) {
            fetchAdmins(page);
        }
    };

    const handleAction = async (actionPromise: Promise<any>, successMessage: string) => {
        try {
            await actionPromise;
            // Ganti alert dengan sistem notifikasi yang lebih baik (misal: react-toastify)
            // toast.success(successMessage); 
            fetchAdmins(paginationInfo?.current_page || 1);
        } catch (err) {
            setError((await decodeErrorResponse(err)) || 'Aksi gagal dilakukan');
        } finally {
            setConfirmModalProps(null);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 60) return `${seconds} detik yang lalu`;
        if (minutes < 60) return `${minutes} menit yang lalu`;
        if (hours < 24) return `${hours} jam yang lalu`;
        return `${days} hari yang lalu`;
    };

    const paginationItems = paginationInfo ? generatePaginationItems(paginationInfo.current_page, paginationInfo.last_page) : [];

    // RENDER TABEL UTAMA
    const renderAdminTable = () => {
        if (loading) {
            return Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-2"><Skeleton className="h-16 w-full" /></td></tr>
            ));
        }
        if (error) {
            return <tr><td colSpan={6}>{errorMessage(error)}</td></tr>;
        }
        if (admins.length === 0) {
            return <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">Tidak ada administrator yang ditemukan.</td></tr>;
        }

        return admins.map(admin => (
            <tr key={admin.id} className={`${admin.status !== "suspended" ? 'hover:bg-gray-100' : 'bg-red-200 hover:bg-red-300'} transition-colors`}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            {/* DIPERBAIKI: Path gambar menggunakan backtick `` */}
                            <img className="h-10 w-10 rounded-full object-cover" src={admin.profile_picture_path ? `/storage/${admin.profile_picture_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.full_name)}`} alt={admin.full_name} />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{admin.full_name}</div>
                            <div className="text-sm text-gray-500">NIP: {admin.nip}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.email}</div>
                    <div className="text-sm text-gray-500">{admin.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{admin.role === 'system_admin' ? 'System Admin' : 'Base Admin'}</div>
                    <div className="text-sm text-gray-500">{admin.service_profile?.full_name ?? (admin.role === 'system_admin' ? 'System-wide' : 'N/A')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {admin.status === 'active' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>}
                    {admin.status === 'suspended' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Nonaktif</span>}
                    {admin.status === 'pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRelativeTime(admin.updated_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {viewMode === 'manage' ? (
                        <>
                            <button onClick={() => setActivityAdminId(admin.id)} className="text-gray-500 hover:text-gray-900">Aktivitas</button>
                            <button onClick={() => setConfirmModalProps({ title: 'Konfirmasi Ubah Status', message: `Anda yakin ingin ${admin.status === 'active' ? 'menonaktifkan' : 'mengaktifkan'} admin '${admin.full_name}'?`, onConfirm: () => handleAction(adminManageService.toggleStatus(admin.id), 'Status admin berhasil diubah.') })} className="text-yellow-600 hover:text-yellow-900">{admin.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button>
                            <button onClick={() => setConfirmModalProps({ title: 'Konfirmasi Reset Password', message: `Kirim link reset password ke '${admin.full_name}'?`, onConfirm: () => handleAction(adminManageService.sendPasswordReset(admin.id), 'Link reset password telah dikirim.') })} className="text-red-600 hover:text-red-900">Reset Pass</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setConfirmModalProps({ title: 'Konfirmasi Penerimaan', message: `Anda yakin ingin menerima dan mengaktifkan admin '${admin.full_name}'?`, onConfirm: () => handleAction(adminManageService.accept(admin.id), 'Admin berhasil diterima dan diaktifkan.') })} className="text-green-600 hover:text-green-900">Terima</button>
                            <button onClick={() => setConfirmModalProps({ title: 'Konfirmasi Penolakan', message: `Anda yakin ingin menolak dan menghapus pendaftaran '${admin.full_name}'?`, onConfirm: () => handleAction(adminManageService.reject(admin.id), 'Pendaftaran admin berhasil ditolak.') })} className="text-red-600 hover:text-red-900">Tolak</button>
                        </>
                    )}
                </td>
            </tr>
        ));
    };

    return (
        <div>


            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{viewMode === 'manage' ? 'Manajemen Administrator' : 'Permintaan Admin Tertunda'}</h1>
                        <p className="mt-2 text-gray-600">{viewMode === 'manage' ? 'Buat dan kelola semua akun administrator sistem.' : `Total ${pendingCount} admin menunggu persetujuan.`}</p>
                    </div>
                    <div className="flex-shrink-0">
                        {viewMode === 'manage' ? (
                            <button onClick={() => setViewMode('pending')} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                                ({pendingCount}) Lihat Permintaan Tertunda
                            </button>
                        ) : (
                            <button onClick={() => setViewMode('manage')} className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700">
                                Kembali ke Manajemen
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border">
                    <form onSubmit={handleSearch}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <input name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="Nama / Email / NIP..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" />
                            <select name="role" value={filters.role} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="">Semua Peran</option>
                                {filterOptions.roles.map(r => <option key={r.value} value={r.value}>{r.value.charAt(0).toUpperCase() + r.value.slice(1).split("_").join(" ")}</option>)}
                            </select>
                            {viewMode === 'manage' && (
                                <select name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">Semua Status</option>
                                    {filterOptions.statuses.filter(s => s.value.toLowerCase() !== "pending").map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
                                </select>
                            )}
                            <select name="service_code" value={filters.service_code} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="">Semua Dinas</option>
                                {filterOptions.services.map(s => <option key={s.code.value} value={s.code.value}>{s.full_name}</option>)}
                            </select>
                        </div>
                        <div className="mt-6 flex items-center justify-end gap-x-4">
                            <button type="button" onClick={handleReset} className="text-sm font-semibold text-gray-600">Reset</button>
                            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Filter</button>
                        </div>
                    </form>
                </div>

                <div className="bg-white shadow-lg rounded-xl border overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peran & Dinas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diperbarui</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">{renderAdminTable()}</tbody>
                    </table>
                </div>

                {paginationInfo && paginationInfo.total > 0 && !loading && (
                    <div className="pt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Menampilkan <span className="font-medium">{paginationInfo.from}</span> sampai <span className="font-medium">{paginationInfo.to}</span> dari <span className="font-medium">{paginationInfo.total}</span> hasil
                        </p>
                        <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button onClick={() => handlePageChange(paginationInfo.current_page - 1)} disabled={paginationInfo.current_page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">&lt;</button>
                            {paginationItems.map((item, index) => item === DOTS ? <span key={`dots-${index}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span> : <button key={item} onClick={() => handlePageChange(item as number)} aria-current={item === paginationInfo.current_page ? 'page' : undefined} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${item === paginationInfo.current_page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>{item}</button>)}
                            <button onClick={() => handlePageChange(paginationInfo.current_page + 1)} disabled={paginationInfo.current_page === paginationInfo.last_page} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">&gt;</button>
                        </nav>
                    </div>
                )}

            </div>
            <ConfirmationModal isOpen={!!confirmModalProps} onClose={() => setConfirmModalProps(null)} {...(confirmModalProps || { title: '', message: '', onConfirm: () => { } })} />
            <ActivityDrawer isOpen={!!activityAdminId} onClose={() => setActivityAdminId(null)} adminId={activityAdminId} />
        </div>
    );
}