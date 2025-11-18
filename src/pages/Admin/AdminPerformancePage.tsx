import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminPerformanceService, decodeErrorResponse } from '@/services/api'; // Asumsi service API Anda
import { Skeleton } from '@/components/SkeletonLoading'; // Asumsi komponen Skeleton Anda
import { CsrfLoadingProps } from '@/types';

// =================================================================
// 1. TIPE DATA: Disesuaikan agar cocok dengan output Controller Laravel
//    (INI BAGIAN YANG PALING BANYAK BERUBAH)
// =================================================================

// Opsi untuk filter dinamis
// PERBAIKAN: Menggunakan `id` dan `full_name` sesuai API
interface ApiServiceOption {
    id: number;
    full_name: string;
}
interface ApiAdminOption {
    id: number;
    full_name: string;
}
interface FilterOptions {
    services: ApiServiceOption[];
    admins: ApiAdminOption[];
    districts: {key: string, value: string}[];
}

// Kartu KPI
interface KpiCards {
    total: number;
    today: number;
    sla_percent: number;
    avg_hours: string | null; // PERBAIKAN: API mengirim string
}

// Data untuk grafik tren (Struktur ini sudah cocok)
interface TrendData {
    line_labels: string[];
    line_data: number[];
    stacked_labels: string[];
    stacked_pending: number[];
    stacked_process: number[];
    stacked_finished: number[];
}

// Data untuk tabel kinerja
interface DinasPerformance {
    full_name: string;
    total_laporan: number;
    total_selesai: number;
    avg_hours: string | null; // PERBAIKAN: API mengirim string
    sla_breaches: number;
}

// PERBAIKAN: API mengirim objek, bukan array. Kita akan tandai sebagai `any`
// karena strukturnya tidak sesuai dengan yang diharapkan (mirip KpiCards).
type AdminPerformance = any; 

// Kategori Teratas
interface TopCategory {
    category: string; // PERBAIKAN: API mengirim string, bukan objek
    total: number;
}

// Pelanggaran SLA
interface SlaBreachReport {
    id: number;
    title: string;
    priority: string; // PERBAIKAN: API mengirim string, bukan objek
    created_at: string;
    assignee: { full_name: string } | null;
}

// Struktur data lengkap dari API
interface PerformanceResponse {
    kpiCards: KpiCards;
    trendData: TrendData;
    dinasPerformance: DinasPerformance[];
    adminPerformance: AdminPerformance; // PERBAIKAN: Ini adalah objek
    topCategories: TopCategory[];
    slaBreaches: SlaBreachReport[];
    filterOptions: FilterOptions;
}

type ScopeType = 'all' | 'dinas' | 'admin' | 'district';

// Helper untuk format tanggal YYYY-MM-DD
const toYmd = (date: Date): string => date.toISOString().split('T')[0];

export default function AdminPerformancePage({csrfLoading}: CsrfLoadingProps) {
    // 2. STATE MANAGEMENT: (Tidak ada perubahan di sini)
    // =================================================================
    const [performanceData, setPerformanceData] = useState<PerformanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scopeType, setScopeType] = useState<ScopeType>('all');
    const [scopeValue, setScopeValue] = useState<string>('');
    const [dateStart, setDateStart] = useState<string>("");
    const [dateEnd, setDateEnd] = useState<string>("");

    // 3. DATA FETCHING & SIDE EFFECTS (Tidak ada perubahan di sini)
    // =================================================================
    const fetchPerformance = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                scope_type: scopeType,
                date_start: dateStart,
                date_end: dateEnd,
            });
            if (scopeType !== 'all' && scopeValue) {
                params.append('scope_value', scopeValue);
            }
            const data = Object.fromEntries(params)
            const response = await adminPerformanceService.getPerformance(data);
            setPerformanceData(response.data);
        } catch (err: any) {
            setError((await decodeErrorResponse(err)) || 'Gagal memuat data performa');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPerformance();
    }, []);

    useEffect(() => {
        setScopeValue('');
    }, [scopeType]);

    const handleReset = () => {
        setScopeType('all');
        setScopeValue('');
        setDateStart(toYmd(new Date(new Date().setDate(new Date().getDate() - 30))));
        setDateEnd(toYmd(new Date()));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPerformance();
    }

    // 4. DATA TRANSFORMASI UNTUK GRAFIK (Tidak ada perubahan di sini)
    // =================================================================
    const trendChartData = useMemo(() => {
        // Guard clause ini mencegah error saat performanceData masih null
        if (!performanceData?.trendData) return [];
        return performanceData.trendData.line_labels.map((label, index) => ({
            label,
            'Laporan Masuk': performanceData.trendData.line_data[index] || 0,
        }));
    }, [performanceData]);

    const statusChartData = useMemo(() => {
        // Guard clause ini juga penting
        if (!performanceData?.trendData) return [];
        return performanceData.trendData.stacked_labels.map((label, index) => ({
            label,
            'Pending': performanceData.trendData.stacked_pending[index] || 0,
            'Proses': performanceData.trendData.stacked_process[index] || 0,
            'Selesai': performanceData.trendData.stacked_finished[index] || 0,
        }));
    }, [performanceData]);


    // 5. RENDER KOMPONEN (JSX)
    // =================================================================
    return (
        <div className="space-y-8">
            {/* POINT 1: SCOPE SELECTOR */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Performa</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Filter Utama (Scope) */}
                        <div>
                            <label htmlFor="scope_type" className="block text-sm font-medium text-gray-700">Fokus Analisis</label>
                            <select name="scope_type" id="scope_type" value={scopeType} onChange={e => setScopeType(e.target.value as ScopeType)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="all">Semua Laporan</option>
                                <option value="dinas">Per Dinas</option>
                                <option value="admin">Per Admin</option>
                                <option value="district">Per Kecamatan</option>
                            </select>
                        </div>
                        {/* Filter Value (Dinamis) */}
                        <div>
                            <label htmlFor="scope_value" className="block text-sm font-medium text-gray-700">Pilihan</label>
                            <select name="scope_value" id="scope_value" value={scopeValue} onChange={e => setScopeValue(e.target.value)} disabled={scopeType === 'all' || loading} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100">
                                <option value="">{scopeType === 'all' ? '(Tidak Perlu)' : 'Semua'}</option>
                                {/* PERBAIKAN #1: Menggunakan `opt.id` dan `opt.full_name` untuk filter options */}
                                {scopeType === 'dinas' && performanceData?.filterOptions.services.map(opt => <option key={opt.id} value={opt.id}>{opt.full_name}</option>)}
                                {scopeType === 'admin' && performanceData?.filterOptions.admins.map(opt => <option key={opt.id} value={opt.id}>{opt.full_name}</option>)}
                                {scopeType === 'district' && performanceData?.filterOptions.districts.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
                            </select>
                        </div>
                        {/* Filter Tanggal */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date_start" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                                <input type="date" name="date_start" id="date_start" value={dateStart} onChange={e => setDateStart(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"/>
                            </div>
                            <div>
                                <label htmlFor="date_end" className="block text-sm font-medium text-gray-700">Tanggal Akhir</label>
                                <input type="date" name="date_end" id="date_end" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"/>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-x-4">
                        <button type="button" onClick={handleReset} className="text-sm font-semibold text-gray-600">Reset</button>
                        <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Menganalisis...' : 'Analisis'}
                        </button>
                    </div>
                </form>
            </div>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}

            {/* POINT 2: KPI UTAMA (CARDS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading || !performanceData ? (
                    <>
                        <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
                    </>
                ) : (
                    <>
                        <KpiCard title="Total Laporan" value={performanceData.kpiCards.total.toLocaleString()} color="text-blue-600" />
                        <KpiCard title="Laporan Hari Ini" value={performanceData.kpiCards.today.toLocaleString()} color="text-blue-500" />
                        <KpiCard title="Penyelesaian Tepat Waktu" value={`${performanceData.kpiCards.sla_percent.toFixed(1)}%`} color="text-green-600" />
                        {/* PERBAIKAN #2: Mengubah string menjadi angka sebelum `toFixed` */}
                        <KpiCard title="Rata-rata Penyelesaian" value={performanceData.kpiCards.avg_hours ? `${parseFloat(performanceData.kpiCards.avg_hours).toFixed(1)} Jam` : 'N/A'} color="text-cyan-500" />
                    </>
                )}
            </div>

            {/* POINT 3: TREND & VOLUME */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartBox title="Tren Laporan Masuk">
                    {loading ? <Skeleton className='h-80 w-full'/> :
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={trendChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" fontSize={12} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Laporan Masuk" stroke="#3B82F6" strokeWidth={2} fill="rgba(59, 130, 246, 0.1)" />
                            </LineChart>
                        </ResponsiveContainer>
                    }
                </ChartBox>
                <ChartBox title="Tren Status Laporan">
                     {loading ? <Skeleton className='h-80 w-full'/> :
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={statusChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" fontSize={12} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Pending" stackId="a" fill="#F59E0B" />
                                <Bar dataKey="Proses" stackId="a" fill="#38BDF8" />
                                <Bar dataKey="Selesai" stackId="a" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    }
                </ChartBox>
            </div>

             {/* POINT 4 & 5: KINERJA DINAS & ADMIN */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TableBox title="Kinerja Dinas">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-2 text-left">Dinas</th>
                            <th className="px-4 py-2 text-left">Total</th>
                            <th className="px-4 py-2 text-left">Selesai</th>
                            <th className="px-4 py-2 text-left">Avg. Jam</th>
                            <th className="px-4 py-2 text-left">Lolos SLA (%)</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? <SkeletonTableRows cols={5} /> :
                                performanceData?.dinasPerformance.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">Tidak ada data.</td></tr>
                                ) : (
                                    performanceData?.dinasPerformance.map(dinas => {
                                        const slaPercent = dinas.total_selesai > 0 ? 100 * (1 - (dinas.sla_breaches / dinas.total_selesai)) : 100;
                                        const slaColor = slaPercent < 80 ? 'text-red-600' : 'text-green-600';
                                        return (
                                            <tr key={dinas.full_name}>
                                                <td className="px-4 py-2 font-medium text-gray-900">{dinas.full_name}</td>
                                                <td className="px-4 py-2">{dinas.total_laporan}</td>
                                                <td className="px-4 py-2">{dinas.total_selesai}</td>
                                                {/* PERBAIKAN #2 (lagi): Mengubah string menjadi angka */}
                                                <td className="px-4 py-2">{dinas.avg_hours ? parseFloat(dinas.avg_hours).toFixed(1) : 'N/A'}</td>
                                                <td className={`px-4 py-2 font-medium ${slaColor}`}>{slaPercent.toFixed(1)}%</td>
                                            </tr>
                                        )
                                    })
                                )
                            }
                        </tbody>
                    </table>
                </TableBox>
                <TableBox title="Kinerja Admin">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-2 text-left">Admin</th>
                            <th className="px-4 py-2 text-left">Ditugaskan</th>
                            <th className="px-4 py-2 text-left">Selesai</th>
                            <th className="px-4 py-2 text-left">Avg. Jam</th>
                            <th className="px-4 py-2 text-left">Dibuka Lagi</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* PERBAIKAN #3: Logika untuk `adminPerformance` yang tidak sesuai */}
                             {loading ? <SkeletonTableRows cols={5} /> :
                                // Cek apakah data adalah array (seharusnya), jika tidak, tampilkan pesan error/data tidak valid.
                                !Array.isArray(performanceData?.adminPerformance) ? (
                                    <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">Format data kinerja admin tidak valid.</td></tr>
                                ) : (
                                    performanceData?.adminPerformance.map((admin: any) => ( // Gunakan `any` karena data asli tidak diketahui
                                        <tr key={admin.full_name}>
                                            <td className="px-4 py-2 font-medium text-gray-900">{admin.full_name}</td>
                                            <td className="px-4 py-2">{admin.total_ditugaskan}</td>
                                            <td className="px-4 py-2">{admin.total_selesai}</td>
                                            <td className="px-4 py-2">{admin.avg_hours ? parseFloat(admin.avg_hours).toFixed(1) : 'N/A'}</td>
                                            <td className="px-4 py-2">{admin.reopened_count}</td>
                                        </tr>
                                    ))
                                )
                            }
                        </tbody>
                    </table>
                </TableBox>
             </div>
             
             {/* POINT 6 & 7: TOP ISSUES & SLA BREACHES */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <ListBox title="Top Kategori Laporan">
                    {loading ? <SkeletonListItems /> : 
                        performanceData?.topCategories.length === 0 ? (
                             <li className="py-4 text-center text-gray-500">Tidak ada data.</li>
                        ) : (
                            performanceData?.topCategories.map((cat, index) => (
                                <li key={index} className="flex justify-between items-center py-3">
                                    {/* PERBAIKAN #4: `cat.category` sekarang adalah string */}
                                    <span className="text-sm font-medium text-gray-800">{cat.category ?? 'N/A'}</span>
                                    <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{cat.total}</span>
                                </li>
                            ))
                        )
                    }
                 </ListBox>

                 <div className="bg-red-50 p-6 rounded-xl shadow border border-red-200">
                    <h3 className="text-lg font-semibold text-red-800 mb-4">Laporan Mendesak (Lewat SLA & Aktif)</h3>
                     <div className="overflow-x-auto max-h-96">
                        <ul className="divide-y divide-red-200">
                             {loading ? <SkeletonListItems /> : 
                                performanceData?.slaBreaches.length === 0 ? (
                                     <li className="py-4 text-center text-red-700">👍 Tidak ada laporan aktif yang melewati SLA.</li>
                                ) : (
                                    performanceData?.slaBreaches.map(report => (
                                        <li key={report.id} className="py-3">
                                            <a href={`/report/track/${report.id}`} className="block hover:bg-red-100 p-2 rounded-md">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-medium text-red-900 truncate">{report.title} (#{report.id})</p>
                                                    {/* PERBAIKAN #5: `report.priority` sekarang adalah string */}
                                                    <span className="text-xs font-bold text-red-700">{report.priority}</span>
                                                </div>
                                                <p className="text-xs text-red-700">
                                                    Dibuat: {formatDateRelative(report.created_at)} | Penanggung: {report.assignee?.full_name ?? 'N/A'}
                                                </p>
                                            </a>
                                        </li>
                                    ))
                                )
                            }
                        </ul>
                     </div>
                 </div>
             </div>
        </div>
    );
}

// 6. KOMPONEN BANTUAN (HELPERS) - Tidak ada perubahan
// =================================================================
const KpiCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow border">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
);
const ChartBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        {children}
    </div>
);
const TableBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="overflow-x-auto max-h-96">{children}</div>
    </div>
);
const ListBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
     <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="overflow-x-auto max-h-96">
            <ul className="divide-y divide-gray-200">{children}</ul>
        </div>
    </div>
);
const SkeletonCard = () => <div className="bg-white p-6 rounded-xl shadow border"><Skeleton className="h-5 w-3/4 mb-2"/><Skeleton className="h-9 w-1/2"/></div>;
const SkeletonTableRows = ({ cols, rows = 5}: { cols: number, rows?: number }) => (
    Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>{Array.from({ length: cols }).map((_, j) => <td key={j} className="px-4 py-4"><Skeleton className="h-5 w-full"/></td>)}</tr>
    ))
);
const SkeletonListItems = ({ rows = 5}: {rows?: number}) => (
    Array.from({ length: rows }).map((_, i) => <li key={i} className="py-4"><Skeleton className="h-5 w-3/4"/></li>)
)
function formatDateRelative(dateString: string): string {
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
}