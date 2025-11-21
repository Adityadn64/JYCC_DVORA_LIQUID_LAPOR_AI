import React, { useState, useEffect, useMemo, useRef } from "react";
import { adminAnalyticsService, decodeErrorResponse } from "../../services/api";
import {
  SkeletonFilter,
  SkeletonInsights,
  SkeletonKpiCards,
  SkeletonChartCard,
  SkeletonAnalysisTableCard,
  SkeletonDataGrid,
} from "../../components/SkeletonLoading/Admin/SkeletonLoadingAdminPage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { errorMessage } from "../../components/Error";
import {
  CsrfLoadingProps,
  DOTS,
  generatePaginationItems,
  PaginationInfo,
} from "../../types";

// [PERBAIKAN TOTAL] Interface data disesuaikan dengan struktur JSON dari API
interface FilterOptions {
  categories: string[];
  statuses: string[];
  service_profiles: { id: number; code: string; full_name: string }[];
  admins: { id: number; full_name: string }[];
  priorities: string[];
}

interface Report {
  id: number;
  title: string;
  statuses: string[];
  service_profile: { full_name: string } | null; // service_profile bukan serviceProfile
  assignee: { full_name: string } | null;
  updated_at: string; // ISO string
}

interface AnalyticsData {
  kpiStats: {
    total: number;
    avg_resolution_hours: number | null;
    completion_rate: number;
    total_this_month: number;
    total_last_month: number;
  };
  trendData: {
    main_trend_labels: string[];
    main_trend_data: number[];
    status_trend_labels: string[];
    status_trend_pending: number[];
    status_trend_process: number[];
    status_trend_finished: number[];
  };
  distributionData: {
    category_labels: string[];
    category_data: number[];
    dinas_labels: string[];
    dinas_data: number[];
  };
  adminPerformance: {
    full_name: string;
    total_ditugaskan: number; // Properti ini hilang sebelumnya
    total_selesai: number;
    avg_hours: string | null; // API mengembalikan string
  }[];
  dinasPerformance: {
    full_name: string;
    total_laporan: number;
    total_selesai: number;
    avg_hours: string | null; // API mengembalikan string
  }[];
  categoryAnalysis: {
    category: string; // Langsung string
    avg_hours: string; // API mengembalikan string
    city_name: string | null;
    district_name: string | null;
  }[];
  locationAnalysis: {
    district: string;
    total: number;
    city_name: string | null;
    district_name: string; // Properti ini hilang sebelumnya
  }[];
  reports: {
    data: Report[];
    links: any; // Untuk pagination
  };
  insights: string[];
  filterOptions: FilterOptions;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#38BDF8",
  "#EC4899",
];

export default function AdminAnalyticsPage({ csrfLoading }: CsrfLoadingProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    date_start: "",
    date_end: "",
    category: "",
    status: "",
    service_code: "",
    assignee_admin_id: "",
    priority: "",
    location: "",
  });

  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    null
  );

  useEffect(() => {
    if (csrfLoading) fetchAnalytics();
  }, [csrfLoading]);

  const fetchAnalytics = async (appliedFilters = {}, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const cleanFilters = Object.fromEntries(
        Object.entries(appliedFilters).filter(
          ([_, v]) => v !== "" && v !== null
        )
      );
      cleanFilters.page = page;
      const response = await adminAnalyticsService.getAnalytics(cleanFilters);
      setData(response.data);
      setPaginationInfo(response.data.reports);
    } catch (err: any) {
      setError(
        (await decodeErrorResponse(err)) || "Gagal memuat data analisis"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(filters);
  };

  const handleResetFilter = () => {
    const resetFilters = {
      date_start: "",
      date_end: "",
      category: "",
      status: "",
      service_code: "",
      assignee_admin_id: "",
      priority: "",
      location: "",
    };
    setFilters(resetFilters);
    fetchAnalytics(resetFilters);
  };

  // Memoize data untuk Recharts
  const chartData = useMemo(() => {
    if (!data) return null;
    return {
      mainTrend: data.trendData.main_trend_labels.map((label, index) => ({
        name: label,
        "Laporan Masuk": data.trendData.main_trend_data[index],
      })),
      statusTrend: data.trendData.status_trend_labels.map((label, index) => ({
        name: label,
        Pending: data.trendData.status_trend_pending[index],
        Proses: data.trendData.status_trend_process[index],
        Selesai: data.trendData.status_trend_finished[index],
      })),
      categoryDist: data.distributionData.category_labels.map(
        (label, index) => ({
          name: label,
          value: data.distributionData.category_data[index],
        })
      ),
      dinasDist: data.distributionData.dinas_labels.map((label, index) => ({
        name: label,
        value: data.distributionData.dinas_data[index],
      })),
    };
  }, [data]);

  function renderError() {
    return errorMessage(error || "Terjadi kesalahan");
  }

  const getStatusInfo = (statuses: string[]) => {
    const status =
      statuses.length > 0 ? statuses[statuses.length - 1] : "unknown";
    const statusClass =
      {
        pending: "bg-yellow-100 text-yellow-800",
        process: "bg-cyan-100 text-cyan-800",
        finished: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
      }[status] || "bg-gray-100 text-gray-800";
    return { status, statusClass };
  };

  const handlePageChange = (page: number) => {
    if (page !== paginationInfo?.current_page) {
      setLoading(true);
      fetchAnalytics(filters, page);
    }
  };

  const paginationItems = paginationInfo
    ? generatePaginationItems(
        paginationInfo.current_page,
        paginationInfo.last_page
      )
    : [];

  const filterEl = useRef<HTMLDivElement>(null);
  const endEl = useRef<HTMLDivElement>(null);

  const scrollToTarget = (isUp: boolean = true) => {
    // ... implementasi tidak berubah
    if (isUp) {
      if (filterEl.current) {
        filterEl.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else {
      if (endEl.current) {
        endEl.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50">
      {/* [BARU] Filter Section with Skeleton */}
      {error ? (
        renderError()
      ) : loading ? (
        <SkeletonFilter />
      ) : (
        <div
          className="mb-8 bg-white p-6 rounded-xl shadow-lg border"
          ref={filterEl}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Filter Analisis
          </h2>
          <form onSubmit={handleApplyFilter}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label
                  htmlFor="date_start"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="date_start"
                  id="date_start"
                  value={filters.date_start}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="date_end"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  name="date_end"
                  id="date_end"
                  value={filters.date_end}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Kategori
                </label>
                <select
                  name="category"
                  id="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  {/* [PERBAIKAN] Mapping dari array of string */}
                  {data?.filterOptions.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Status</option>
                  {/* [PERBAIKAN] Mapping dari array of string */}
                  {data?.filterOptions.statuses.map((stat) => (
                    <option key={stat} value={stat}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="service_code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dinas / Instansi
                </label>
                <select
                  name="service_code"
                  id="service_code"
                  value={filters.service_code}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Dinas</option>
                  {/* [PERBAIKAN] Akses `service.code` langsung */}
                  {data?.filterOptions.service_profiles.map((service) => (
                    <option key={service.id} value={service.code}>
                      {service.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="assignee_admin_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admin Penanggung Jawab
                </label>
                <select
                  name="assignee_admin_id"
                  id="assignee_admin_id"
                  value={filters.assignee_admin_id}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Admin</option>
                  {data?.filterOptions.admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tingkat Prioritas
                </label>
                <select
                  name="priority"
                  id="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Prioritas</option>
                  {/* [PERBAIKAN] Mapping dari array of string */}
                  {data?.filterOptions.priorities.map((prio) => (
                    <option key={prio} value={prio}>
                      {prio.charAt(0).toUpperCase() + prio.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Lokasi (Kota/Kec/Alamat)
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Contoh: Surabaya"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-x-4">
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-sm font-semibold text-gray-600"
              >
                Reset Filter
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Terapkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* [BARU] Insight Section with Skeleton */}
      {error ? (
        renderError()
      ) : loading ? (
        <SkeletonInsights />
      ) : data ? (
        data.insights.length > 0 && (
          <div className="mb-8 space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              💡 Insight Otomatis
            </h3>
            {data.insights.map((insight, index) => (
              <div
                key={index}
                className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md"
              >
                <p>{insight}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        renderError()
      )}

      {/* [BARU] KPI Section with Skeleton */}
      {error ? (
        renderError()
      ) : loading ? (
        <SkeletonKpiCards />
      ) : (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Statistik Umum
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow border">
              <p className="text-sm font-medium text-gray-500">
                Total Laporan (Filtered)
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-600">
                {data?.kpiStats.total}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border">
              <p className="text-sm font-medium text-gray-500">
                Waktu Penyelesaian Rata-rata
              </p>
              <p className="mt-1 text-3xl font-bold text-green-500">
                {data?.kpiStats.avg_resolution_hours
                  ? `${Number(data.kpiStats.avg_resolution_hours).toFixed(
                      1
                    )} Jam`
                  : "N/A"}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border">
              <p className="text-sm font-medium text-gray-500">
                Tingkat Penyelesaian
              </p>
              <p className="mt-1 text-3xl font-bold text-cyan-500">
                {data?.kpiStats.completion_rate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border">
              <p className="text-sm font-medium text-gray-500">
                Perbandingan Periode
              </p>
              <p className="mt-1 text-3xl font-bold text-purple-500">
                {data?.kpiStats.total_this_month}{" "}
                <span className="text-lg text-gray-500">
                  vs {data?.kpiStats.total_last_month}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* [BARU] Charts Section with Skeleton */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {error ? (
          renderError()
        ) : loading ? (
          <SkeletonChartCard />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Tren Laporan Masuk
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData?.mainTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Laporan Masuk"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {error ? (
          renderError()
        ) : loading ? (
          <SkeletonChartCard />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Tren Perbandingan Status
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData?.statusTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ position: "relative" }} />
                <Line type="monotone" dataKey="Pending" stroke={COLORS[2]} />
                <Line type="monotone" dataKey="Proses" stroke={COLORS[5]} />
                <Line type="monotone" dataKey="Selesai" stroke={COLORS[1]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* [BARU] Analysis Tables Section with Skeleton */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {error ? (
          renderError()
        ) : loading ? (
          <SkeletonAnalysisTableCard />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Kinerja Admin
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Admin</th>
                    <th className="px-4 py-2 text-left">Selesai</th>
                    <th className="px-4 py-2 text-left">Rata2 Waktu (Jam)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data ? (
                    data.adminPerformance.length > 0 ? (
                      data.adminPerformance.map((admin) => (
                        <tr key={admin.full_name}>
                          <td className="px-4 py-2 font-medium">
                            {admin.full_name}
                          </td>
                          <td className="px-4 py-2">{admin.total_selesai}</td>
                          <td className="px-4 py-2">
                            {admin.avg_hours
                              ? Number(admin.avg_hours).toFixed(1)
                              : "N/A"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          Tidak ada data.
                        </td>
                      </tr>
                    )
                  ) : (
                    renderError()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {error ? (
          renderError()
        ) : loading ? (
          <SkeletonAnalysisTableCard />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Kinerja Dinas
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Dinas</th>
                    <th className="px-4 py-2 text-left">Total</th>
                    <th className="px-4 py-2 text-left">Selesai</th>
                    <th className="px-4 py-2 text-left">Rata2 Waktu (Jam)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data ? (
                    data.dinasPerformance.length > 0 ? (
                      data.dinasPerformance.map((dinas) => (
                        <tr key={dinas.full_name}>
                          <td className="px-4 py-2 font-medium">
                            {dinas.full_name}
                          </td>
                          <td className="px-4 py-2">{dinas.total_laporan}</td>
                          <td className="px-4 py-2">{dinas.total_selesai}</td>
                          <td className="px-4 py-2">
                            {dinas.avg_hours
                              ? Number(dinas.avg_hours).toFixed(1)
                              : "N/A"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          Tidak ada data.
                        </td>
                      </tr>
                    )
                  ) : (
                    renderError()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {error ? (
          renderError()
        ) : loading ? (
          <SkeletonAnalysisTableCard />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Waktu Penyelesaian per Kategori (Terlama)
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Kategori</th>
                    <th className="px-4 py-2 text-left">Rata2 Waktu (Jam)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data ? (
                    data.categoryAnalysis.length > 0 ? (
                      data.categoryAnalysis.map((cat) => (
                        <tr key={cat.category}>
                          <td className="px-4 py-2 font-medium">
                            {cat.category ?? "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            {Number(cat.avg_hours).toFixed(1)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          Tidak ada data.
                        </td>
                      </tr>
                    )
                  ) : (
                    renderError()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {error ? (
          renderError()
        ) : loading ? (
          <SkeletonAnalysisTableCard />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              "Hot Zone" Kecamatan
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Kecamatan</th>
                    <th className="px-4 py-2 text-left">Total Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data ? (
                    data.locationAnalysis.length > 0 ? (
                      data.locationAnalysis.map((loc) => (
                        <tr key={loc.district}>
                          <td className="px-4 py-2 font-medium">
                            {loc.district_name}
                          </td>
                          <td className="px-4 py-2">{loc.total}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          Tidak ada data.
                        </td>
                      </tr>
                    )
                  ) : (
                    renderError()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* [BARU] Data Grid Section with Skeleton */}
      {error ? (
        renderError()
      ) : loading ? (
        <SkeletonDataGrid />
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Data Grid Laporan
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Judul
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dinas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Diperbarui
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data ? (
                  data.reports.data.length > 0 ? (
                    data.reports.data.map((report) => {
                      const { status, statusClass } = getStatusInfo(
                        report.statuses
                      );
                      return (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            #{report.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                            {report.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          {/* [PERBAIKAN] Menggunakan service_profile */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.service_profile?.full_name ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.assignee?.full_name ?? "Belum Ditugaskan"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(report.updated_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a
                              href={`/report/${report.id}/track`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Lihat Detail
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        Tidak ada laporan yang ditemukan dengan filter ini.
                      </td>
                    </tr>
                  )
                ) : (
                  renderError()
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paginationInfo && paginationInfo.total > 0 && !loading && (
        <div className="pt-4 flex items-center justify-between md:flex-row flex-col gap-4">
          <p className="text-sm text-gray-700">
            Menampilkan{" "}
            <span className="font-medium">{paginationInfo.from}</span> sampai{" "}
            <span className="font-medium">{paginationInfo.to}</span> dari{" "}
            <span className="font-medium">{paginationInfo.total}</span> hasil
          </p>
          <nav
            aria-label="Pagination"
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
          >
            <button
              onClick={() => {
                handlePageChange(
                  parseInt(String(paginationInfo.current_page - 1))
                );
                scrollToTarget(false);
              }}
              disabled={paginationInfo.current_page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Sebelumnya</span>
              &lt;
            </button>

            {paginationItems.map((item, index) => {
              if (item === DOTS) {
                return (
                  <span
                    key={`dots-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = item === paginationInfo.current_page;
              return (
                <button
                  key={item}
                  onClick={() => {
                    handlePageChange(parseInt(String(item)));
                    scrollToTarget();
                  }}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrent
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              );
            })}

            <button
              onClick={() => {
                handlePageChange(
                  parseInt(String(paginationInfo.current_page + 1))
                );
                scrollToTarget();
              }}
              disabled={
                paginationInfo.current_page === paginationInfo.last_page
              }
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Selanjutnya</span>
              &gt;
            </button>
          </nav>
        </div>
      )}
      <div className="mt-4" ref={endEl}>
        <br />
      </div>
    </div>
  );
}
