import React, { useEffect, useState } from 'react';
import { adminDashboardService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { SkeletonAdminDashboard, SkeletonStatsGrid, SkeletonChart, SkeletonTable, Skeleton } from '../components/SkeletonLoading';

interface DashboardStats {
  totalReports: number;
  reportsToday: number;
  avgResolutionTime: string;
  trendLabels: string[];
  trendData: number[];
  serviceDistribution: { label: string; value: number }[];
  topAdmins: { label: string; value: number }[];
}

interface Report {
  id: number;
  title: string;
  description: string;
  city: string;
  priority: { value: string; name: string };
  assignee?: { full_name: string };
  statuses: string[];
  updated_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filters, setFilters] = useState({
    search_term: '',
    search_location: '',
    search_priority: '',
    search_admin: '',
    search_id: '',
    sort: 'updated_at_desc'
  });
  const [admins, setAdmins] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminDashboardService.filterReports(filters);
      const data = response.data;

      setStats({
        totalReports: data.totalReports,
        reportsToday: data.reportsToday,
        avgResolutionTime: data.avgResolutionTime,
        trendLabels: data.trendLabels || [],
        trendData: data.trendData || [],
        serviceDistribution: data.serviceDistribution || [],
        topAdmins: data.topAdmins || []
      });

      setReports(data.reports || []);
      setAdmins(data.admins || []);
      setPriorities(data.priorities || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Gagal memuat data dashboard');
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetchDashboardData();
  };

  const handleReset = () => {
    setFilters({
      search_term: '',
      search_location: '',
      search_priority: '',
      search_admin: '',
      search_id: '',
      sort: 'updated_at_desc'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'process': 'bg-cyan-100 text-cyan-800',
      'finished': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !stats) {
    return <SkeletonAdminDashboard />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dasbor Analitik</h1>
        <p className="mt-2 text-gray-600">Ringkasan, tren, dan manajemen laporan Lapor.ai.</p>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <p className="text-sm font-medium text-gray-500">Total Laporan</p>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-blue-600">{stats?.totalReports || 0}</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <p className="text-sm font-medium text-gray-500">Laporan Hari Ini</p>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-green-500">+{stats?.reportsToday || 0}</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <p className="text-sm font-medium text-gray-500">Waktu Penyelesaian Rata-rata</p>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-cyan-500">{stats?.avgResolutionTime || 'N/A'}</p>
          )}
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Laporan Masuk (30 Hari Terakhir)</h3>
          <div className="h-80 flex items-center justify-center text-gray-500">
            Chart akan ditampilkan (gunakan recharts atau chart.js)
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Laporan per Dinas</h3>
          <div className="h-80 flex items-center justify-center text-gray-500">
            Chart akan ditampilkan
          </div>
        </div>
      </section>

      {/* Management Section */}
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Laporan</h2>
          <p className="mt-1 text-gray-600">Cari, filter, dan kelola semua laporan yang masuk.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label htmlFor="search_term" className="block text-sm font-medium text-gray-700">
                  Judul / Deskripsi
                </label>
                <input
                  type="text"
                  name="search_term"
                  id="search_term"
                  value={filters.search_term}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="search_location" className="block text-sm font-medium text-gray-700">
                  Lokasi
                </label>
                <input
                  type="text"
                  name="search_location"
                  id="search_location"
                  value={filters.search_location}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="search_priority" className="block text-sm font-medium text-gray-700">
                  Prioritas
                </label>
                <select
                  name="search_priority"
                  id="search_priority"
                  value={filters.search_priority}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Semua</option>
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="search_admin" className="block text-sm font-medium text-gray-700">
                  Ditangani Oleh
                </label>
                <select
                  name="search_admin"
                  id="search_admin"
                  value={filters.search_admin}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Semua</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="search_id" className="block text-sm font-medium text-gray-700">
                  ID Laporan
                </label>
                <input
                  type="number"
                  name="search_id"
                  id="search_id"
                  value={filters.search_id}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                  Urutkan
                </label>
                <select
                  name="sort"
                  id="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="updated_at_desc">Diperbarui (Terbaru)</option>
                  <option value="updated_at_asc">Diperbarui (Terlama)</option>
                  <option value="created_at_desc">Dibuat (Terbaru)</option>
                  <option value="created_at_asc">Dibuat (Terlama)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-4">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Reset
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Cari
              </button>
            </div>
          </form>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-5">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between pt-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            ))
          ) : reports.length > 0 ? (
            reports.map((report) => {
              const status = report.statuses && report.statuses.length > 0
                ? report.statuses[report.statuses.length - 1]
                : 'unknown';

              return (
                <div
                  key={report.id}
                  className="bg-white shadow rounded-lg transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => navigate(`/report/${report.id}/track`)}
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600">Laporan #{report.id}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1 truncate">{report.title}</p>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{report.description}</p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        <p className="mt-2 text-xs text-gray-400">Diperbarui: {report.updated_at}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                      <span><strong>Lokasi:</strong> {report.city}</span>
                      <span><strong>Prioritas:</strong> {report.priority.name}</span>
                      <span><strong>Penanggung Jawab:</strong> {report.assignee?.full_name || 'Belum Ditugaskan'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center bg-white p-12 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Tidak Ada Laporan Ditemukan</h3>
              <p className="mt-1 text-sm text-gray-500">Coba ubah filter pencarian Anda.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
