import React, { useEffect, useState, useMemo } from 'react';
import { adminDashboardService, decodeErrorResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { SkeletonAdminDashboard, Skeleton } from '../components/SkeletonLoading';

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
  city_name: string;
  priority: string;
  assignee?: { full_name: string };
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
    links: { url: string | null; label: string; active: boolean }[];
}


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<{
    reportTrend: ChartData[];
    serviceDistribution: ChartData[];
    topAdmins: ChartData[];
  } | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  // 3. Tambahkan state untuk paginasi
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

  // 4. Perbarui fungsi fetch data untuk menangani paginasi
  const fetchDashboardData = async (currentFilters: any, page: number = 1) => {
    try {
      const response = await adminDashboardService.getDashboardData({ ...currentFilters, page });
      
      if (!stats) setStats(response.stats); // Statistik & chart hanya di-load sekali
      if (!charts) setCharts(response.charts);
      if (!filterOptions.admins.length) setFilterOptions(response.filters);

      setReports(response.reports.data);
      setPaginationInfo(response.reports); // Simpan semua info paginasi
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(decodeErrorResponse(err) || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(filters);
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, name: String(e.target.value) }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetchDashboardData(filters, 1); // Selalu kembali ke halaman 1 saat search
  };

  const handleReset = async () => {
    const defaultFilters = {
      search_term: '', search_location: '', search_priority: '',
      search_admin: '', search_id: '', sort: 'updated_at_desc'
    };
    setFilters(defaultFilters);
    setLoading(true);
    await fetchDashboardData(defaultFilters, 1);
  };
  
  // 5. Buat handler untuk klik paginasi
  const handlePageChange = (page: number) => {
      if (page !== paginationInfo?.current_page) {
          setLoading(true);
          fetchDashboardData(filters, page);
      }
  };
  
  // Memoize chart data to prevent re-rendering
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

  // Tampilkan skeleton besar hanya saat loading awal
  if (loading && !stats) {
    return <SkeletonAdminDashboard />;
  }

  function renderError() {
    return errorDiv(error || 'Terjadi kesalahan');
  }

  // 6. Lengkapi JSX sesuai Blade
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dasbor Analitik</h1>
        <p className="mt-2 text-gray-600">Ringkasan, tren, dan manajemen laporan Lapor.ai.</p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border"><p className="text-sm font-medium text-gray-500">Total Laporan</p>{error ? renderError() : loading ? <Skeleton className="h-10 w-24 mt-2" /> : <p className="mt-1 text-3xl font-bold text-blue-600">{stats?.totalReports || 0}</p>}</div>
        <div className="bg-white p-6 rounded-xl shadow border"><p className="text-sm font-medium text-gray-500">Laporan Hari Ini</p>{error ? renderError() : loading ? <Skeleton className="h-10 w-24 mt-2" /> : <p className="mt-1 text-3xl font-bold text-green-500">+{stats?.reportsToday || 0}</p>}</div>
        <div className="bg-white p-6 rounded-xl shadow border"><p className="text-sm font-medium text-gray-500">Waktu Penyelesaian Rata-rata</p>{error ? renderError() : loading ? <Skeleton className="h-10 w-24 mt-2" /> : <p className="mt-1 text-3xl font-bold text-cyan-500">{stats?.avgResolutionTime || 'N/A'}</p>}</div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border"><h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Laporan Masuk (30 Hari Terakhir)</h3><div className="h-80"><Line data={reportTrendChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>
        <div className="bg-white p-6 rounded-xl shadow border"><h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Laporan per Dinas</h3><div className="h-80"><Pie data={serviceDistributionChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div></div>
      </section>
      <section className="bg-white p-6 rounded-xl shadow border"><h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Admin Produktif (Laporan Selesai)</h3><div className="h-80"><Bar data={topAdminsChartData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }} /></div></section>

      <section className="space-y-8">
        <div><h2 className="text-2xl font-bold text-gray-900">Manajemen Laporan</h2><p className="mt-1 text-gray-600">Cari, filter, dan kelola semua laporan yang masuk.</p></div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <form onSubmit={handleSearch}> {/* Form Lengkap */}
             {/* ... (Semua input filter seperti di Blade, terhubung ke state 'filters' dan 'handleFilterChange') ... */}
             <div className="mt-6 flex items-center justify-end gap-x-4">
                 <button type="button" onClick={handleReset} className="text-sm font-semibold text-gray-600">Reset</button>
                 <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">{error ? renderError() : loading ? 'Mencari...' : 'Cari'}</button>
             </div>
          </form>
        </div>

        <div className="space-y-4">
          {error ? renderError() : loading ? (
             Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)
          ) : reports.length > 0 ? (
            reports.map((report) => {
              const status = report.statuses[report.statuses.length - 1] || 'unknown';
              const priorityName = filterOptions.priorities.find(p => p.value === report.priority)?.name || report.priority;
              return (
                <div key={report.id} onClick={() => navigate(`/admin/report/${report.id}`)} className="bg-white shadow rounded-lg transition-all hover:shadow-lg cursor-pointer">
                  {/* Kartu Laporan Lengkap */}
                </div>
              );
            })
          ) : (
            <div className="text-center bg-white p-12 rounded-lg shadow"> ... </div>
          )}
        </div>
        
        {/* 7. Komponen Paginasi */}
        {!loading && paginationInfo && paginationInfo.last_page > 1 && (
            <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-700">Menampilkan halaman {paginationInfo.current_page} dari {paginationInfo.last_page}</p>
                <div className="flex gap-1">
                    {paginationInfo.links.map((link, index) => (
                        <button key={index}
                           onClick={() => link.url && handlePageChange(parseInt(link.label))}
                           disabled={!link.url || link.active}
                           dangerouslySetInnerHTML={{ __html: link.label }}
                           className={`px-3 py-1 text-sm rounded-md ${link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} ${!link.url ? 'text-gray-400' : ''}`}
                        />
                    ))}
                </div>
            </div>
        )}
      </section>
    </div>
  );
}