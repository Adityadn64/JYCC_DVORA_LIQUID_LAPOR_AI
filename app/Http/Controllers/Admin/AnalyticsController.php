<?php

namespace App\Http\Controllers\Admin;

use App\Export\ExportFile;
use App\Http\Controllers\Controller;
use App\Http\Controllers\ReportController;
use App\Models\Report;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Enums\RoleAdministratorEnum;
use App\Enums\ReportCategoryEnum;
use App\Enums\PriorityEnum;
use App\Enums\ReportStatusEnum;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    use ApiResponseTrait;

    // Variabel enum status untuk kueri
    private $statusPending;
    private $statusProcess;
    private $statusFinished;
    private $statusRejected;

    public function __construct()
    {
        // Inisialisasi nilai Enum untuk kueri yang lebih bersih
        $this->statusPending = ReportStatusEnum::Pending->value;
        $this->statusProcess = ReportStatusEnum::Process->value;
        $this->statusFinished = ReportStatusEnum::Finished->value;
        $this->statusRejected = ReportStatusEnum::Rejected->value;
    }

    /**
     * Tampilkan halaman Analisis BI utama.
     */
    public function index(Request $request)
    {
        // 1. BUAT KUERI DASAR (POINT 1: FILTERS)
        $baseQuery = $this->buildBaseQuery($request);

        // 2. STATISTIK UMUM (POINT 2)
        $kpiStats = $this->getKpiStats(clone $baseQuery, $request);

        // 3. ANALISIS TREN & POLA WAKTU (POINT 3)
        $trendData = $this->getTrendData(clone $baseQuery, $request);

        // 4. ANALISIS DISTRIBUSI (POINT 4 - Chart)
        $distributionData = $this->getDistributionData(clone $baseQuery);

        // 5. KINERJA ADMIN (POINT 5)
        $adminPerformance = $this->getAdminPerformance(clone $baseQuery);

        // 6. ANALISIS DINAS (POINT 6)
        $dinasPerformance = $this->getDinasPerformance(clone $baseQuery);

        // 7. ANALISIS KATEGORI (POINT 7)
        $categoryAnalysis = $this->getCategoryAnalysis(clone $baseQuery);

        // 8. ANALISIS LOKASI (POINT 8)
        $locationAnalysis = $this->getLocationAnalysis(clone $baseQuery);

        // 10. TABEL DATA LENGKAP (POINT 10)
        $reports = (clone $baseQuery)
            ->with(['assignee', 'serviceProfile'])
            ->orderBy('updated_at', 'desc')
            ->paginate(20)
            ->withQueryString(); // Bawa filter saat paginasi

        // 12. INSIGHT OTOMATIS (POINT 12)
        $insights = $this->getAutoInsights($kpiStats);

        // Data untuk dropdown filter
        $filterOptions = $this->getFilterOptions();

        // [FIXED] Mengembalikan view, bukan response JSON, agar sesuai dengan file Blade.
        // return view('admin.analytics', compact(
        //     'reports',
        //     'kpiStats',
        //     'trendData',
        //     'distributionData',
        //     'adminPerformance',
        //     'dinasPerformance',
        //     'categoryAnalysis',
        //     'locationAnalysis',
        //     'insights',
        //     'filterOptions'
        // ));

        return $this->successResponse([
            'reports' => $reports,
            'kpiStats' => $kpiStats,
            'trendData' => $trendData,
            'distributionData' => $distributionData,
            'adminPerformance' => $adminPerformance,
            'dinasPerformance' => $dinasPerformance,
            'categoryAnalysis' => $categoryAnalysis,
            'locationAnalysis' => $locationAnalysis,
            'insights' => $insights,
            'filterOptions' => $filterOptions,
        ]);
    }

    private function buildBaseQuery(Request $request)
    {
        $admin = Auth::user();
        $query = Report::query();

        // Filter Wajib: Peran Admin
        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $query->where('service_code', $admin->service_code);
        }

        // Filter Opsional dari Request
        $query->when($request->filled('date_start'), function ($q) use ($request) {
            $q->where('created_at', '>=', Carbon::parse($request->date_start));
        });

        $query->when($request->filled('date_end'), function ($q) use ($request) {
            $q->where('created_at', '<=', Carbon::parse($request->date_end)->endOfDay());
        });

        $query->when($request->filled('category'), function ($q) use ($request) {
            $q->where('category', $request->category);
        });

        $query->when($request->filled('status'), function ($q) use ($request) {
            // Kueri status terakhir di array JSON (PostgreSQL)
            $q->whereRaw("statuses->>(jsonb_array_length(statuses) - 1) = ?", [$request->status]);
        });

        $query->when($request->filled('service_code'), function ($q) use ($request) {
            $q->where('service_code', $request->service_code);
        });

        $query->when($request->filled('assignee_admin_id'), function ($q) use ($request) {
            $q->where('assignee_admin_id', $request->assignee_admin_id);
        });

        $query->when($request->filled('priority'), function ($q) use ($request) {
            $q->where('priority', $request->priority);
        });

        // Filter Lokasi (Sederhana)
        $query->when($request->filled('location'), function ($q) use ($request) {
            $loc = '%' . $request->location . '%';
            $q->where(fn($sub) => $sub->where('city', 'like', $loc)
                ->orWhere('district', 'like', 'like', $loc)
                ->orWhere('address', 'like', 'like', $loc));
        });

        return $query;
    }

    private function getFilterOptions()
    {
        $admin = request()->user();
        $serviceQuery = ServiceProfile::query()->orderBy('full_name');
        $adminQuery = Administrator::query()->where('role', RoleAdministratorEnum::BaseAdmin)->orderBy('full_name');

        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $serviceQuery->where('code', $admin->service_code);
            $adminQuery->where('service_code', $admin->service_code);
        }

        return [
            'categories' => ReportCategoryEnum::cases(),
            'priorities' => PriorityEnum::cases(),
            'statuses' => ReportStatusEnum::cases(),
            'service_profiles' => $serviceQuery->get(),
            'admins' => $adminQuery->get(),
        ];
    }

    private function getKpiStats($baseQuery, Request $request)
    {
        $stats = [];
        $stats['total'] = (clone $baseQuery)->count();

        // Waktu Penyelesaian Rata-rata (Jam)
        $stats['avg_resolution_hours'] = (clone $baseQuery)
            ->whereRaw("statuses->>(jsonb_array_length(statuses) - 1) = '{$this->statusFinished}'")
            ->select(DB::raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600'))
            ->value('avg'); // Menggunakan alias 'avg'

        // Persentase Selesai
        $totalFinished = (clone $baseQuery)->whereRaw("statuses->>(jsonb_array_length(statuses) - 1) = '{$this->statusFinished}'")->count();
        $stats['completion_rate'] = ($stats['total'] > 0) ? ($totalFinished / $stats['total']) * 100 : 0;

        // Perbandingan Bulan Ini vs Lalu (Jika filter tidak aktif)
        if (!$request->filled('date_start') && !$request->filled('date_end')) {
            $stats['total_this_month'] = (clone $baseQuery)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count();
            $stats['total_last_month'] = (clone $baseQuery)->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->count();
        } else {
            $stats['total_this_month'] = $stats['total']; // Jika ada filter, anggap total = total_this_month
            $stats['total_last_month'] = 0;
        }

        return $stats;
    }

    private function getTrendData($baseQuery, Request $request)
    {
        // Tentukan format grup berdasarkan rentang tanggal
        $daysDiff = $this->getDateDiff($request);
        $format = ($daysDiff > 90) ? 'month' : 'day'; // Grup per bulan jika > 90 hari, per hari jika <= 90 hari

        $dbFormat = ($format == 'month') ? 'YYYY-MM' : 'YYYY-MM-DD';
        $phpFormat = ($format == 'month') ? 'M Y' : 'd M Y';

        $startDate = $request->filled('date_start') ? Carbon::parse($request->date_start) : now()->subDays(30);
        $endDate = $request->filled('date_end') ? Carbon::parse($request->date_end) : now();

        $trend = (clone $baseQuery)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("TO_CHAR(created_at, '$dbFormat') as date_group"),
                DB::raw('count(*) as count')
            )
            ->groupBy('date_group')
            ->orderBy('date_group', 'asc')
            ->get();

        // Breakdown Status
        $statusTrend = (clone $baseQuery)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("TO_CHAR(created_at, '$dbFormat') as date_group"),
                DB::raw("COUNT(*) FILTER (WHERE statuses->>(jsonb_array_length(statuses) - 1) = '{$this->statusPending}') as pending"),
                DB::raw("COUNT(*) FILTER (WHERE statuses->>(jsonb_array_length(statuses) - 1) = '{$this->statusProcess}') as process"),
                DB::raw("COUNT(*) FILTER (WHERE statuses->>(jsonb_array_length(statuses) - 1) = '{$this->statusFinished}') as finished")
            )
            ->groupBy('date_group')
            ->orderBy('date_group', 'asc')
            ->get();

        return [
            'main_trend_labels' => $trend->pluck('date_group')->map(fn($d) => Carbon::parse($d)->format($phpFormat)),
            'main_trend_data' => $trend->pluck('count'),
            'status_trend_labels' => $statusTrend->pluck('date_group')->map(fn($d) => Carbon::parse($d)->format($phpFormat)),
            'status_trend_pending' => $statusTrend->pluck('pending'),
            'status_trend_process' => $statusTrend->pluck('process'),
            'status_trend_finished' => $statusTrend->pluck('finished'),
        ];
    }

    private function getDistributionData($baseQuery)
    {
        // Distribusi Kategori
        $categoryDist = (clone $baseQuery)
            ->select('category', DB::raw('count(id) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        // Distribusi Dinas
        // [FIXED] Join menggunakan 'reports.service_code' ke 'service_profiles.code'
        $dinasDist = (clone $baseQuery)
            ->join('service_profiles', 'reports.service_code', '=', 'service_profiles.code')
            ->select('service_profiles.full_name', DB::raw('count(reports.id) as count'))
            ->groupBy('service_profiles.full_name')
            ->orderByDesc('count')
            ->get();

        return [
            // [FIXED] Map value kategori ke nama yang lebih mudah dibaca untuk label chart
            'category_labels' => $categoryDist->pluck('category')->map(fn($catEnum) => $catEnum->name ?? 'N/A'),
            'category_data' => $categoryDist->pluck('count'),
            'dinas_labels' => $dinasDist->pluck('full_name'),
            'dinas_data' => $dinasDist->pluck('count'),
        ];
    }

    private function getAdminPerformance($baseQuery)
    {
        return Administrator::query()
            ->joinSub((clone $baseQuery), 'reports', 'administrators.id', '=', 'reports.assignee_admin_id')
            ->where('administrators.role', RoleAdministratorEnum::BaseAdmin)
            ->select(
                'administrators.full_name',
                DB::raw('COUNT(reports.id) as total_ditugaskan'),
                DB::raw("COUNT(reports.id) FILTER (WHERE reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}') as total_selesai"),
                DB::raw("AVG(CASE WHEN reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}' THEN EXTRACT(EPOCH FROM (reports.updated_at - reports.created_at)) / 3600 ELSE NULL END) as avg_hours")
            )
            ->groupBy('administrators.id', 'administrators.full_name')
            ->orderByDesc('total_selesai')
            ->get();
    }

    private function getDinasPerformance($baseQuery)
    {
        // [FIXED] Join menggunakan 'service_profiles.code' ke 'reports.service_code'
        return ServiceProfile::query()
            ->joinSub((clone $baseQuery), 'reports', 'service_profiles.code', '=', 'reports.service_code')
            ->select(
                'service_profiles.full_name',
                DB::raw('COUNT(reports.id) as total_laporan'),
                DB::raw("COUNT(reports.id) FILTER (WHERE reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}') as total_selesai"),
                DB::raw("AVG(CASE WHEN reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}' THEN EXTRACT(EPOCH FROM (reports.updated_at - reports.created_at)) / 3600 ELSE NULL END) as avg_hours")
            )
            ->groupBy('service_profiles.id', 'service_profiles.full_name')
            ->orderByDesc('total_laporan')
            ->get();
    }

    private function getCategoryAnalysis($baseQuery)
    {
        // [FIXED] Mengubah hasil kueri agar sesuai dengan ekspektasi Blade: $cat->category->value
        $analysis = (clone $baseQuery)
            ->whereRaw("statuses->>(jsonb_array_length(statuses) - 1) = '{$this->statusFinished}'")
            ->select(
                'category',
                DB::raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 as avg_hours')
            )
            ->groupBy('category')
            ->orderByDesc('avg_hours')
            ->get();
        
        // Map string 'category' menjadi objek Enum
        return $analysis->map(function ($item) {
            $item->category = $item->category ?? 'N/A';
            return $item;
        })->filter(fn($item) => $item->category !== null); // Hapus jika enum tidak ditemukan
    }

    private function getLocationAnalysis($baseQuery)
    {
        // Hot Zone (per Kecamatan)
        return (clone $baseQuery)
            ->select('district', DB::raw('count(*) as total'))
            ->whereNotNull('district')
            ->groupBy('district')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }

    private function getAutoInsights($kpiStats)
    {
        $insights = [];
        if (isset($kpiStats['total_last_month']) && $kpiStats['total_last_month'] > 0) {
            $percentChange = (($kpiStats['total_this_month'] - $kpiStats['total_last_month']) / $kpiStats['total_last_month']) * 100;
            if ($percentChange > 10) {
                $insights[] = "Jumlah laporan meningkat signifikan sebesar " . number_format($percentChange, 1) . "% dibanding periode sebelumnya.";
            } elseif ($percentChange < -10) {
                $insights[] = "Terjadi penurunan laporan sebesar " . number_format(abs($percentChange), 1) . "% dibanding periode sebelumnya, kinerja membaik!";
            }
        }

        if ($kpiStats['avg_resolution_hours'] > 48) {
            $insights[] = "Waktu penyelesaian rata-rata (" . number_format($kpiStats['avg_resolution_hours'], 1) . " jam) masih di atas target 2 hari. Perlu evaluasi proses.";
        }
        
        if ($kpiStats['completion_rate'] < 75) {
             $insights[] = "Tingkat penyelesaian (" . number_format($kpiStats['completion_rate'], 1) . "%) berada di bawah 75%. Identifikasi laporan yang tertunda.";
        }

        return $insights;
    }

    private function getDateDiff(Request $request)
    {
        $start = $request->filled('date_start') ? Carbon::parse($request->date_start) : now()->subDays(30);
        $end = $request->filled('date_end') ? Carbon::parse($request->date_end) : now();
        return $start->diffInDays($end);
    }

    public function exportReports(Request $request) {
        $validator = Validator::make($request->all(), [
            'exportType' => ['required', 'string', Rule::in(['CSV', 'Excel'])],
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Tipe ekspor tidak valid.', 422);
        }

        $baseQuery = $this->buildBaseQuery($request);

        $reports = (clone $baseQuery)
            ->with(['assignee', 'serviceProfile'])
            ->orderBy('updated_at', 'desc')
            ->cursor();

        $columns = [
            'ID' => 'id',
            'JUDUL' => 'title',
            'STATUS' => function($report) {
                $statusesArray = $report->statuses;
                return !empty($statusesArray) ? ucfirst(end($statusesArray)) : 'Unknown';
            },
            'KATEGORI' => function($report) {
                return $report->category->name ?? 'N/A';
            },
            'DINAS' => function($report) {
                return $report->serviceProfile->full_name ?? 'N/A';
            },
            'ADMIN' => function($report) {
                return $report->assignee->full_name ?? 'Belum Ditugaskan';
            },
            'DIBUAT' => fn($report) => $report->created_at->toDateTimeString(),
            'DIPERBARUI' => fn($report) => $report->updated_at->toDateTimeString(),
            'LINK' => function($report) {
                return route('report.track.show', ['report' => $report]);
            }
        ];

        $exportType = $request->input('exportType');
        $fileName = 'laporan-analisis-' . now()->format('YmdHis');

        return $exportType === "CSV"
            ? ExportFile::exportCSV($reports, $columns, $fileName . '.csv')
            : ExportFile::exportExcel($reports, $columns, $fileName . '.xlsx');
    }
}