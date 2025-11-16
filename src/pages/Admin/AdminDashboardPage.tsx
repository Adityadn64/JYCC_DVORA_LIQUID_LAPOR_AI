import React, { useEffect, useState, useMemo } from 'react';
import { adminDashboardService, decodeErrorResponse } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { SkeletonAdminDashboard, Skeleton, SkeletonReportCard } from '../../components/SkeletonLoading';

// 1. Import Chart.js dan komponennya
import { Line, Pie, Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { errorDiv } from '@/components/Error';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

// 2. Definisikan tipe data yang lebih akurat
interface Stats {
  totalReports: number;
  reportsToday: number;
  avgResolutionTime: string;
}
interface ChartData { label: string; value: number; }
interface Report {
  id: number;
  title: string;
  description: string;
  city: string; // Sesuai dengan blade
  priority: string;
  assignee?: { id: number; full_name: string };
  statuses: string[];
  updated_at: string;
}
interface FilterOptions {
    admins: { id: number; full_name: string }[];
    priorities: { value: string; name: string }[];
}
interface PaginationInfo {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

// Utilitas untuk format waktu seperti `diffForHumans`
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


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<{
    reportTrend: ChartData[];
    serviceDistribution: ChartData[];
    topAdmins: ChartData[];
  } | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ admins: [], priorities: [] });
  const [filters, setFilters] = useState({
    search_term: '',
    search_location: '',
    search_priority: '',
    search_admin: '',
    search_id: '',
    sort: 'updated_at_desc'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDashboardData = async (currentFilters: any, page: number = 1) => {
    try {
      const response = await adminDashboardService.getDashboardData({ ...currentFilters, page });
      
      if (!response.data) throw new Error("Respons data tidak valid");

      // Statistik & chart hanya di-load sekali pada render pertama
      if (page === 1 && !stats) {
          setStats(response.data.stats);
          setCharts(response.data.charts);
          setFilterOptions(response.data.filters);
      }

      setReports(response.data.reports.data);
      setPaginationInfo(response.data.reports); // Simpan semua info paginasi
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(decodeErrorResponse(err) || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboardData(filters, 1);
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // [FIXED] Menggunakan nama input/select sebagai key dinamis
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchDashboardData(filters, 1); // Selalu kembali ke halaman 1 saat search
  };

  const handleReset = () => {
    const defaultFilters = {
      search_term: '', search_location: '', search_priority: '',
      search_admin: '', search_id: '', sort: 'updated_at_desc'
    };
    setFilters(defaultFilters);
    setLoading(true);
    fetchDashboardData(defaultFilters, 1);
  };
  
  const handlePageChange = (page: number) => {
      if (page !== paginationInfo?.current_page) {
          setLoading(true);
          // Scroll to top
          window.scrollTo(0, 0);
          fetchDashboardData(filters, page);
      }
  };
  
  const reportTrendChartData = useMemo(() => ({
    labels: charts?.reportTrend.map(d => d.label) || [],
    datasets: [{ label: 'Laporan Masuk', data: charts?.reportTrend.map(d => d.value) || [], borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3 }]
  }), [charts]);
  
  const serviceDistributionChartData = useMemo(() => ({
    labels: charts?.serviceDistribution.map(d => d.label) || [],
    datasets: [{ data: charts?.serviceDistribution.map(d => d.value) || [], backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#38BDF8', '#EC4899'] }]
  }), [charts]);

  const topAdminsChartData = useMemo(() => ({
    labels: charts?.topAdmins.map(d => d.label) || [],
    datasets: [{ label: 'Laporan Selesai', data: charts?.topAdmins.map(d => d.value) || [], backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: '#3B82F6', borderWidth: 1 }]
  }), [charts]);

  if (loading && !stats) {
    return <SkeletonAdminDashboard />;
  }

  function renderError() {
    return errorDiv(error || 'Terjadi kesalahan');
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dasbor Analitik</h1>
        <p className="mt-2 text-gray-600">Ringkasan, tren, dan manajemen laporan Lapor.ai.</p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border"><p className="text-sm font-medium text-gray-500">Total Laporan</p>{!stats && loading ? <Skeleton className="h-10 w-24 mt-2" /> : <p className="mt-1 text-3xl font-bold text-blue-600">{stats?.totalReports || 0}</p>}</div>
        <div className="bg-white p-6 rounded-xl shadow border"><p className="text-sm font-medium text-gray-500">Laporan Hari Ini</p>{!stats && loading ? <Skeleton className="h-10 w-24 mt-2" /> : <p className="mt-1 text-3xl font-bold text-green-500">+{stats?.reportsToday || 0}</p>}</div>
        <div className="bg-white p-6 rounded-xl shadow border"><p className="text-sm font-medium text-gray-500">Waktu Penyelesaian Rata-rata</p>{!stats && loading ? <Skeleton className="h-10 w-24 mt-2" /> : <p className="mt-1 text-3xl font-bold text-cyan-500">{stats?.avgResolutionTime || 'N/A'}</p>}</div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border"><h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Laporan Masuk (30 Hari Terakhir)</h3><div className="h-80"><Line data={reportTrendChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} /></div></div>
        <div className="bg-white p-6 rounded-xl shadow border"><h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Laporan per Dinas</h3><div className="h-80"><Pie data={serviceDistributionChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div></div>
      </section>
      <section className="bg-white p-6 rounded-xl shadow border"><h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Admin Produktif (Laporan Selesai)</h3><div className="h-80"><Bar data={topAdminsChartData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false } } }} /></div></section>

      <section className="space-y-8">
        <div><h2 className="text-2xl font-bold text-gray-900">Manajemen Laporan</h2><p className="mt-1 text-gray-600">Cari, filter, dan kelola semua laporan yang masuk.</p></div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div><label htmlFor="search_term" className="block text-sm font-medium text-gray-700">Judul / Deskripsi</label><input type="text" name="search_term" id="search_term" value={filters.search_term} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/></div>
                <div><label htmlFor="search_location" className="block text-sm font-medium text-gray-700">Lokasi</label><input type="text" name="search_location" id="search_location" value={filters.search_location} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/></div>
                <div><label htmlFor="search_priority" className="block text-sm font-medium text-gray-700">Prioritas</label><select name="search_priority" id="search_priority" value={filters.search_priority} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">Semua</option>{filterOptions.priorities.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}</select></div>
                <div><label htmlFor="search_admin" className="block text-sm font-medium text-gray-700">Ditangani Oleh</label><select name="search_admin" id="search_admin" value={filters.search_admin} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">Semua</option>{filterOptions.admins.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select></div>
                <div><label htmlFor="search_id" className="block text-sm font-medium text-gray-700">ID Laporan</label><input type="number" name="search_id" id="search_id" value={filters.search_id} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/></div>
                <div><label htmlFor="sort" className="block text-sm font-medium text-gray-700">Urutkan</label><select name="sort" id="sort" value={filters.sort} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="updated_at_desc">Diperbarui (Terbaru)</option><option value="updated_at_asc">Diperbarui (Terlama)</option><option value="created_at_desc">Dibuat (Terbaru)</option><option value="created_at_asc">Dibuat (Terlama)</option></select></div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-x-4">
                <button type="button" onClick={handleReset} className="text-sm font-semibold text-gray-600">Reset</button>
                <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">{loading ? 'Mencari...' : 'Cari'}</button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {error ? renderError() : loading ? (
             Array.from({ length: 5 }).map((_, i) => <SkeletonReportCard key={i} />)
          ) : reports.length > 0 ? (
            reports.map((report) => {
              const status = report.statuses[report.statuses.length - 1] || 'unknown';
              const statusClassMap: { [key: string]: string } = {
                pending: 'bg-yellow-100 text-yellow-800',
                process: 'bg-cyan-100 text-cyan-800',
                finished: 'bg-green-100 text-green-800',
                rejected: 'bg-red-100 text-red-800',
              };
              const statusClassName = statusClassMap[status] || 'bg-gray-100 text-gray-800';

              return (
                <div key={report.id} onClick={() => navigate(`/report/${report.id}/track`)} className="bg-white shadow rounded-lg transition-all hover:shadow-lg cursor-pointer">
                  <div className="block p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600">Laporan #{report.id}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1 truncate">{report.title}</p>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{report.description}</p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassName}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          <p className="mt-2 text-xs text-gray-400">Diperbarui: {formatRelativeTime(report.updated_at)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                        <span><strong>Lokasi:</strong> {report.city}</span>
                        <span><strong>Prioritas:</strong> {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}</span>
                        <span><strong>Penanggung Jawab:</strong> {report.assignee?.full_name ?? 'Belum Ditugaskan'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center bg-white p-12 rounded-lg shadow"><h3 className="text-lg font-medium text-gray-900">Tidak Ada Laporan Ditemukan</h3><p className="mt-1 text-sm text-gray-500">Coba ubah filter pencarian Anda.</p></div>
          )}
        </div>
        
        {!loading && paginationInfo && paginationInfo.last_page > 1 && (
            <div className="pt-4 flex justify-between items-center text-sm text-gray-700">
                <p>
                    Menampilkan <span className="font-medium">{paginationInfo.from}</span> sampai <span className="font-medium">{paginationInfo.to}</span> dari <span className="font-medium">{paginationInfo.total}</span> hasil
                </p>
                <div className="flex gap-1">
                  {paginationInfo.links.map((link, index) => {
                      const pageNumber = link.url ? new URL(link.url).searchParams.get('page') : null;

                      // --- PERUBAHAN DIMULAI DI SINI ---
                      let labelContent: React.ReactNode;
                      // Cek apakah label mengandung kata 'Previous' atau 'Next'
                      if (link.label.includes('previous')) {
                          labelContent = 'Sebelumnya';
                      } else if (link.label.includes('next')) {
                          labelContent = 'Selanjutnya';
                      } else {
                          // Jika bukan, berarti ini adalah nomor halaman
                          labelContent = link.label;
                      }
                      // --- PERUBAHAN SELESAI ---

                      return (
                          <button key={index}
                            onClick={() => pageNumber && handlePageChange(parseInt(pageNumber))}
                            disabled={!link.url || link.active}
                            // Hapus `dangerouslySetInnerHTML` dan tampilkan konten secara langsung
                            className={`px-3 py-1.5 rounded-md transition-colors text-sm ${link.active ? 'bg-blue-600 text-white cursor-default' : 'bg-white text-gray-700 hover:bg-gray-100'} ${!link.url ? 'text-gray-400 cursor-not-allowed' : ''}`}
                          >
                              {labelContent}
                          </button>
                      )
                  })}
                </div>
            </div>
        )}
      </section>
    </div>
  );
}