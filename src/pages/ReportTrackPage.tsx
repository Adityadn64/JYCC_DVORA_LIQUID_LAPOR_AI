import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';

interface TrackReport {
  id: number;
  title: string;
  description: string;
  city: string;
  priority: {
    value: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  statuses: string[];
  assignee?: {
    full_name: string;
    email: string;
  };
}

interface FilterParams {
  search_term: string;
  search_location: string;
  search_priority: string;
  search_admin: string;
  search_id: string;
  sort: string;
}

export default function ReportTrackPage() {
  const [filters, setFilters] = useState<FilterParams>({
    search_term: '',
    search_location: '',
    search_priority: '',
    search_admin: '',
    search_id: '',
    sort: 'updated_at_desc'
  });

  const [reports, setReports] = useState<TrackReport[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load filter options
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Fetch priorities and admins from API
      const response = await reportService.getTrackFilters();
      setPriorities(response.data.priorities || []);
      setAdmins(response.data.admins || []);
    } catch (err) {
      console.error('Error loading filter options:', err);
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
    setError(null);

    try {
      const response = await reportService.getTrackingReports(filters);
      setReports(response.data.reports || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat laporan');
      setReports([]);
    } finally {
      setLoading(false);
    }
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
    setReports([]);
    setError(null);
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

  const getLatestStatus = (statuses: string[]) => {
    return statuses && statuses.length > 0 ? statuses[statuses.length - 1] : 'unknown';
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dasbor Transparansi Laporan</h1>
          <p className="mt-2 text-gray-600">Cari dan lihat semua laporan yang telah masuk ke dalam sistem.</p>
        </div>
      </div>

      {/* Filter Form */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search Term */}
            <div>
              <label htmlFor="search_term" className="block text-sm font-medium text-gray-700 mb-1">
                Judul / Deskripsi
              </label>
              <input
                type="text"
                id="search_term"
                name="search_term"
                value={filters.search_term}
                onChange={handleFilterChange}
                placeholder="Jalan berlubang..."
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Search Location */}
            <div>
              <label htmlFor="search_location" className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi
              </label>
              <input
                type="text"
                id="search_location"
                name="search_location"
                value={filters.search_location}
                onChange={handleFilterChange}
                placeholder="Nama jalan, kota..."
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="search_priority" className="block text-sm font-medium text-gray-700 mb-1">
                Prioritas
              </label>
              <select
                id="search_priority"
                name="search_priority"
                value={filters.search_priority}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Prioritas</option>
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.name.charAt(0).toUpperCase() + priority.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin */}
            <div>
              <label htmlFor="search_admin" className="block text-sm font-medium text-gray-700 mb-1">
                Ditangani Oleh
              </label>
              <select
                id="search_admin"
                name="search_admin"
                value={filters.search_admin}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Admin</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Report ID */}
            <div>
              <label htmlFor="search_id" className="block text-sm font-medium text-gray-700 mb-1">
                ID Laporan
              </label>
              <input
                type="number"
                id="search_id"
                name="search_id"
                value={filters.search_id}
                onChange={handleFilterChange}
                placeholder="123"
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Urutkan Berdasarkan
              </label>
              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="updated_at_desc">Diperbarui (Terbaru)</option>
                <option value="updated_at_asc">Diperbarui (Terlama)</option>
                <option value="created_at_desc">Dibuat (Terbaru)</option>
                <option value="created_at_asc">Dibuat (Terlama)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-4 py-2"
            >
              Reset Filter
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sedang mencari...' : 'Cari'}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* Results */}
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => {
            const latestStatus = getLatestStatus(report.statuses);
            return (
              <div
                key={report.id}
                className="bg-white shadow rounded-lg transition-all hover:shadow-lg"
              >
                <a
                  href={`/report/${report.id}/track`}
                  className="block p-5 hover:bg-gray-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600">Laporan #{report.id}</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{report.title}</p>
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{report.description}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(latestStatus)}`}>
                        {latestStatus.charAt(0).toUpperCase() + latestStatus.slice(1)}
                      </span>
                      <p className="mt-2 text-xs text-gray-400">
                        Diperbarui: {new Date(report.updated_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                    <span>
                      <strong>Lokasi:</strong> {report.city}
                    </span>
                    <span>
                      <strong>Prioritas:</strong> {report.priority?.name ? report.priority.name.charAt(0).toUpperCase() + report.priority.name.slice(1) : 'N/A'}
                    </span>
                    <span>
                      <strong>Penanggung Jawab:</strong> {report.assignee?.full_name || 'Belum Ditugaskan'}
                    </span>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      ) : reports.length === 0 && !loading && !error && (reports.length > 0 || filters.search_term || filters.search_location || filters.search_id) ? (
        <div className="text-center bg-white p-12 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Tidak Ada Laporan yang Ditemukan</h3>
          <p className="mt-1 text-sm text-gray-500">Coba ubah atau reset filter pencarian Anda.</p>
        </div>
      ) : null}
    </div>
  );
}
