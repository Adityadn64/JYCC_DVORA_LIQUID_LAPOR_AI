import React, { useState, useEffect, FormEvent, useRef } from "react";
import { decodeErrorResponse, reportService } from "../../services/api";
import { useSearchParams } from "react-router-dom";
import { SkeletonReportCard } from "../../components/SkeletonLoading/Report/SkeletonLoadingReportPage";
import {
  CsrfLoadingProps,
  PaginationInfo,
  DOTS,
  generatePaginationItems,
} from "../../types";

interface Admin {
  id: number;
  full_name: string;
}

type Priority = string;

interface Report {
  id: number;
  title: string;
  description: string;
  city_name: string;
  priority: Priority;
  assignee: Admin | null;
  updated_at: string;
  statuses: string[];
}

// --- Komponen Utama ---
export default function ReportTrackPage({ csrfLoading }: CsrfLoadingProps) {
  // State untuk menyimpan data dari API
  const [reports, setReports] = useState<Report[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [PaginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    null
  );

  // State untuk mengelola UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Menggunakan useSearchParams untuk membaca dan menulis query string di URL (contoh: ?search_term=jalan)
  const [searchParams, setSearchParams] = useSearchParams();

  // State untuk input form, nilainya disinkronkan dengan URL
  const [filters, setFilters] = useState({
    search_term: searchParams.get("search_term") || "",
    search_location: searchParams.get("search_location") || "",
    search_priority: searchParams.get("search_priority") || "",
    search_admin: searchParams.get("search_admin") || "",
    search_id: searchParams.get("search_id") || "",
    sort: searchParams.get("sort") || "updated_at_desc",
  });

  // useEffect akan berjalan saat komponen pertama kali dimuat atau saat searchParams berubah
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const filtersFromParams = Object.fromEntries(searchParams.entries());
        const response = await reportService.searchReports(filtersFromParams);

        setReports(response.data.reports.data);
        setAdmins(response.data.admins);
        setPriorities(response.data.priorities);
        setPaginationInfo(response.data.reports);
      } catch (err: any) {
        setError(
          (await decodeErrorResponse(err)) || "Gagal memuat data laporan"
        );
      } finally {
        setLoading(false);
      }
    };

    if (csrfLoading) fetchData();
  }, [searchParams, csrfLoading]); // Dependensi: jalankan ulang effect ini jika searchParams berubah

  // Menangani perubahan pada input filter
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Menangani submit form pencarian
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    // Membuat objek URLSearchParams baru dari state filter
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        // Hanya tambahkan parameter yang ada nilainya
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams); // Memperbarui URL, yang akan memicu useEffect untuk fetch data baru
  };

  // Menangani reset filter
  const handleReset = () => {
    setFilters({
      search_term: "",
      search_location: "",
      search_priority: "",
      search_admin: "",
      search_id: "",
      sort: "updated_at_desc",
    });
    setSearchParams({}); // Mengosongkan query string di URL
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      process: "bg-cyan-100 text-cyan-800",
      finished: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const paginationItems = PaginationInfo
    ? generatePaginationItems(
        PaginationInfo.current_page,
        PaginationInfo.last_page
      )
    : [];

  const filterEl = useRef<HTMLDivElement>(null);
  const endEl = useRef<HTMLDivElement>(null);

  const scrollToTarget = (isUp: boolean = true) => {
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
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dasbor Transparansi Laporan
        </h1>
        <p className="mt-2 text-gray-600">
          Cari dan lihat semua laporan yang telah masuk ke dalam sistem.
        </p>
      </div>

      {/* --- Filter Form --- */}
      <div className="bg-white p-6 rounded-xl shadow-lg border" ref={filterEl}>
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label
                htmlFor="search_term"
                className="block text-sm font-medium text-gray-700"
              >
                Judul / Deskripsi
              </label>
              <input
                type="text"
                name="search_term"
                id="search_term"
                value={filters.search_term}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jalan berlubang..."
              />
            </div>

            <div>
              <label
                htmlFor="search_location"
                className="block text-sm font-medium text-gray-700"
              >
                Lokasi
              </label>
              <input
                type="text"
                name="search_location"
                id="search_location"
                value={filters.search_location}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nama jalan, kota..."
              />
            </div>

            <div>
              <label
                htmlFor="search_priority"
                className="block text-sm font-medium text-gray-700"
              >
                Prioritas
              </label>
              <select
                name="search_priority"
                id="search_priority"
                value={filters.search_priority}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Prioritas</option>
                {/* PERBAIKAN: Menggunakan .charAt(0).toUpperCase() untuk meniru ucfirst() */}
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {String(p).charAt(0).toUpperCase() + String(p).slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="search_admin"
                className="block text-sm font-medium text-gray-700"
              >
                Ditangani Oleh
              </label>
              <select
                name="search_admin"
                id="search_admin"
                value={filters.search_admin}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Admin</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="search_id"
                className="block text-sm font-medium text-gray-700"
              >
                ID Laporan
              </label>
              <input
                type="number"
                name="search_id"
                id="search_id"
                value={filters.search_id}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="123"
              />
            </div>

            <div>
              <label
                htmlFor="sort"
                className="block text-sm font-medium text-gray-700"
              >
                Urutkan Berdasarkan
              </label>
              <select
                name="sort"
                id="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {/* PERBAIKAN: Menambahkan semua opsi sorting */}
                <option value="updated_at_desc">Diperbarui (Terbaru)</option>
                <option value="updated_at_asc">Diperbarui (Terlama)</option>
                <option value="created_at_desc">Dibuat (Terbaru)</option>
                <option value="created_at_asc">Dibuat (Terlama)</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-x-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-semibold text-gray-600 hover:text-gray-800"
            >
              Reset Filter
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Cari
            </button>
          </div>
        </form>
      </div>

      {/* --- Daftar Laporan --- */}
      <div className="space-y-4">
        {loading ? (
          [...Array(20)].map((_, i) => <SkeletonReportCard key={i} />)
        ) : error ? (
          <div className="text-center bg-white p-12 rounded-lg shadow">
            <p className="text-red-600">{error}</p>
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => {
            const latestStatus =
              report.statuses[report.statuses.length - 1] || "unknown";
            return (
              <div
                key={report.id}
                className="bg-white shadow rounded-lg transition-all hover:shadow-lg"
              >
                <a href={`/report/${report.id}/track`} className="block p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600">
                        Laporan #{report.id}
                      </p>
                      <p className="text-lg font-bold mt-1">{report.title}</p>
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          latestStatus
                        )}`}
                      >
                        {latestStatus.charAt(0).toUpperCase() +
                          latestStatus.slice(1)}
                      </span>
                      <p className="mt-2 text-xs text-gray-400">
                        Diperbarui:{" "}
                        {new Date(report.updated_at).toLocaleDateString(
                          "id-ID",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                    <span>
                      <strong>Lokasi:</strong> {report.city_name}
                    </span>
                    <span>
                      <strong>Prioritas:</strong> {report.priority}
                    </span>
                    <span>
                      <strong>Penanggung Jawab:</strong>{" "}
                      {report.assignee?.full_name ?? "Belum Ditugaskan"}
                    </span>
                  </div>
                </a>
              </div>
            );
          })
        ) : (
          <div className="text-center bg-white p-12 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
              Tidak Ada Laporan yang Ditemukan
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Coba ubah atau reset filter pencarian Anda.
            </p>
          </div>
        )}

        {PaginationInfo && PaginationInfo.total > 0 && !loading && (
          <div className="pt-4 flex items-center justify-between md:flex-row flex-col gap-4">
            <p className="text-sm text-gray-700">
              Menampilkan{" "}
              <span className="font-medium">{PaginationInfo.from}</span> sampai{" "}
              <span className="font-medium">{PaginationInfo.to}</span> dari{" "}
              <span className="font-medium">{PaginationInfo.total}</span> hasil
            </p>
            <nav
              aria-label="Pagination"
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            >
              <button
                onClick={() => {
                  setSearchParams((prev) => {
                    prev.set("page", String(PaginationInfo.current_page - 1));
                    return prev;
                  });
                  scrollToTarget(false);
                }}
                disabled={PaginationInfo.current_page === 1}
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

                const isCurrent = item === PaginationInfo.current_page;
                return (
                  <button
                    key={item}
                    onClick={() => {
                      setSearchParams((prev) => {
                        prev.set("page", String(item));
                        return prev;
                      });
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
                  setSearchParams((prev) => {
                    prev.set("page", String(PaginationInfo.current_page + 1));
                    return prev;
                  });
                  scrollToTarget();
                }}
                disabled={
                  PaginationInfo.current_page === PaginationInfo.last_page
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
    </div>
  );
}
