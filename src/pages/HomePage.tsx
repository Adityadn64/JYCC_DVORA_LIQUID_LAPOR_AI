import { useEffect, useState } from 'react';
import { decodeErrorResponse, homeService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton, SkeletonChart } from '../components/SkeletonLoading';
import { errorDiv } from '@/components/Error';

interface ReportStats {
  pending: number;
  process: number;
  finished: number;
  rejected: number;
  total: number;
}

interface CityReport {
  city: string;
  count: number;
}

interface ReportHistoryItem {
  date: string;
  pending: number;
  process: number;
  finished: number;
  rejected: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<ReportStats>({
    pending: 0,
    process: 0,
    finished: 0,
    rejected: 0,
    total: 0
  });

  const [historyData, setHistoryData] = useState<ReportHistoryItem[]>([]);
  const [topCities, setTopCities] = useState<CityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await homeService.getHome();
        const viewData = response.data.viewData;

        // Set report statistics
        setStats({
          pending: viewData.pendingReports || 0,
          process: viewData.processReports || 0,
          finished: viewData.finishedReports || 0,
          rejected: viewData.rejectedReports || 0,
          total: viewData.totalReports || 0
        });

        // Format history chart data with separate datasets for each status
        const formattedHistory = viewData.chartLabels.map((date: string, index: number) => ({
          date: date,
          pending: viewData.chartData.pending[index] || 0,
          process: viewData.chartData.process[index] || 0,
          finished: viewData.chartData.finished[index] || 0,
          rejected: viewData.chartData.rejected[index] || 0
        }));
        setHistoryData(formattedHistory);

        // Format top cities from API response
        const formattedCities = viewData.topCities.map((city: any) => ({
          city: city.city_name,
          count: city.total_reports
        }));
        setTopCities(formattedCities);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError(decodeErrorResponse(err) || 'Gagal memuat data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function renderError() {
    return errorDiv(error || 'Terjadi kesalahan');
  }

  return (
    <div className="space-y-20">
      <section className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          Layanan Pelaporan Publik Cerdas
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
          Punya keluhan atau melihat masalah di sekitar Anda? Laporkan dengan mudah dan pantau perkembangannya secara transparan. Didukung oleh AI untuk penanganan yang lebih cepat dan tepat.
        </p>
        <div className="mt-10 flex justify-center items-center gap-4 flex-wrap">
          <a
            href="/report/create"
            className="inline-block bg-blue-600 text-white rounded-lg px-8 py-3 text-base font-medium hover:bg-blue-700 transition-all shadow-lg"
          >
            Buat Laporan Sekarang
          </a>
          <a
            href="/report/track"
            className="inline-block bg-white text-gray-700 rounded-lg px-8 py-3 text-base font-medium hover:bg-gray-100 transition-all shadow-lg border"
          >
            Lacak Laporan
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-gray-900">Apa itu Lapor.ai?</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Lapor.ai adalah platform terintegrasi yang merevolusi cara masyarakat berinteraksi dengan pemerintah. Dengan memanfaatkan kecerdasan buatan (AI), setiap laporan yang masuk akan dianalisis dan diteruskan secara otomatis ke dinas yang berwenang, memastikan setiap masalah ditangani oleh ahlinya tanpa penundaan.
          </p>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Visi kami adalah menciptakan ekosistem pelayanan publik yang responsif, transparan, dan berbasis data untuk Jawa Timur yang lebih baik.
          </p>
        </div>
        <div>
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Laporan Bulanan</h3>
            <div className={`${error ? 'flex justify-center items-center' : ''} h-64`}>
              {error ? renderError() : loading ? (
                <>
                  <SkeletonChart />
                  <br />
                  <div className="flex flex-row gap-4">
                    <Skeleton className="h-8 w-full mx-auto" />
                    <Skeleton className="h-8 w-full mx-auto" />
                    <Skeleton className="h-8 w-full mx-auto" />
                    <Skeleton className="h-8 w-full mx-auto" />
                  </div>
                </>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="pending" stroke="#EAB308" strokeWidth={2} name="Pending" dot={false} />
                    <Line type="monotone" dataKey="process" stroke="#06B6D4" strokeWidth={2} name="Diproses" dot={false} />
                    <Line type="monotone" dataKey="finished" stroke="#22C55E" strokeWidth={2} name="Selesai" dot={false} />
                    <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} name="Ditolak" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Manfaat Utama</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg border text-left">
            <h3 className="text-xl font-semibold text-gray-900">Cepat & Tepat Sasaran</h3>
            <p className="mt-2 text-gray-600">
              AI kami secara otomatis merutekan laporan Anda ke dinas yang benar, memotong birokrasi dan mempercepat waktu respons awal.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border text-left">
            <h3 className="text-xl font-semibold text-gray-900">Transparan & Akuntabel</h3>
            <p className="mt-2 text-gray-600">
              Lacak setiap progres penanganan laporan Anda secara real-time. Tidak ada lagi ketidakpastian.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border text-left">
            <h3 className="text-xl font-semibold text-gray-900">Berbasis Data</h3>
            <p className="mt-2 text-gray-600">
              Semua laporan menjadi data berharga bagi pemerintah untuk menganalisis masalah dan membuat kebijakan yang lebih baik.
            </p>
          </div>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Analisis Laporan Terkini</h2>
        <p className="mt-2 max-w-2xl mx-auto text-md text-gray-600">
          Statistik semua laporan yang telah masuk ke dalam sistem kami secara transparan.
        </p>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
          {error ? renderError() : loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-24 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-indigo-600">{stats.total}</p>
              <p className="mt-1 text-sm font-medium text-gray-500">Total Diterima</p>
            </>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            {error ? renderError() : loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-24 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-yellow-500">{stats.pending}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">Pending</p>
              </>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            {error ? renderError() : loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-24 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-blue-500">{stats.process}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">Diproses</p>
              </>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            {error ? renderError() : loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-24 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-green-500">{stats.finished}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">Selesai</p>
              </>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            {error ? renderError() : loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-24 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-red-500">{stats.rejected}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">Ditolak</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Sebaran Laporan & Kota Teraktif</h2>
          <p className="mt-2 max-w-2xl mx-auto text-md text-gray-600">
            Lihat sebaran laporan dan kota/kabupaten dengan jumlah laporan terbanyak di Jawa Timur.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">
              Kota/Kabupaten Teratas
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {error ? renderError() : loading ? (
                // Show skeleton placeholders for city list
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))
              ) : (
                topCities.map((city, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="text-sm text-gray-700">{city.city}</span>
                    <span className="text-sm font-semibold text-blue-600">{city.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-lg border">
            <iframe
              title="Provinsi Jawa Timur"
              className="w-full h-96 rounded-lg"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4056129.9937991137!2d108.55671036673036!3d-6.882883454757672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2da393f79feeb5c5%3A0x1030bfbca7cb850!2sJawa%20Timur%2C%20Indonesia!5e0!3m2!1sid!2sus!4v1762349460077!5m2!1sid!2sus"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
