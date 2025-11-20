<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Enums\RoleAdministratorEnum;
use App\Enums\ReportStatusEnum;
use App\Traits\Controller\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;

class PerformanceController extends Controller
{
    use ApiResponseTrait;

    // Definisikan SLA (dalam jam)
    private const SLA_HOURS = [
        'critical' => 12,
        'high' => 24,
        'medium' => 72,
        'low' => 168,
    ];

    private $statusPending;
    private $statusProcess;
    private $statusFinished;
    private $statusRejected;

    public function __construct()
    {
        $this->statusPending = ReportStatusEnum::Pending->value;
        $this->statusProcess = ReportStatusEnum::Process->value;
        $this->statusFinished = ReportStatusEnum::Finished->value;
        $this->statusRejected = ReportStatusEnum::Rejected->value; // Asumsi
    }

    /**
     * Tampilkan halaman analisis performa.
     */
    public function index(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        // 1. BUAT FILTER (BUKAN KUERI)
        $filters = $this->buildFilters($request);

        // 2. Ambil data dengan menerapkan filter
        $kpiCards = $this->getKpiCards($filters, $request);
        $trendData = $this->getTrendData($filters, $request);
        $dinasPerformance = $this->getDinasPerformance($filters);
        $adminPerformance = $this->getAdminPerformance($filters);
        $topCategories = $this->getTopCategories($filters);
        $slaBreaches = $this->getSlaBreaches($filters);

        // Data untuk dropdown filter
        $filterOptions = $this->getFilterOptions();

        // return view('admin.performance', compact(
        //     'kpiCards',
        //     'trendData',
        //     'dinasPerformance',
        //     'adminPerformance',
        //     'topCategories',
        //     'slaBreaches',
        //     'filterOptions'
        // ));
        
        return $this->successResponse([
            'kpiCards' => $kpiCards,
            'trendData' => $trendData,
            'dinasPerformance' => $dinasPerformance,
            'adminPerformance' => $adminPerformance,
            'topCategories' => $topCategories,
            'slaBreaches' => $slaBreaches,
            'filterOptions' => $filterOptions,
        ]);
    }

    /**
     * POINT 1: Membuat Kumpulan Filter (bukan Builder).
     */
    private function buildFilters(Request $request): array
    {
        $admin = Auth::user();
        return [
            'admin_role' => $admin->role,
            'admin_service_code' => ($admin->role === RoleAdministratorEnum::BaseAdmin) ? $admin->service_code : null,
            'scope_type' => $request->scope_type ?? 'all',
            'scope_value' => $request->scope_value ?? null,
            'date_start' => $request->date_start != "" ? Carbon::parse($request->date_start) : now()->subDays(30),
            'date_end' => $request->date_end != "" ? Carbon::parse($request->date_end)->endOfDay() : now()->endOfDay(),
        ];
    }

    /**
     * Helper BARU: Menerapkan filter ke kueri APAPUN.
     */
    private function applyFiltersToQuery(EloquentBuilder|QueryBuilder $query, array $filters)
    {
        // Filter Wajib: Peran Admin
        if ($filters['admin_role'] === RoleAdministratorEnum::BaseAdmin) {
            $query->where('reports.service_code', $filters['admin_service_code']);
        }

        // Filter Opsional: Scope Selector
        switch ($filters['scope_type']) {
            case 'dinas':
                $query->when($filters['scope_value'], fn($q) => $q->where('reports.service_code', $filters['scope_value']));
                break;
            case 'admin':
                $query->when($filters['scope_value'], fn($q) => $q->where('reports.assignee_admin_id', $filters['scope_value']));
                break;
            case 'district':
                $query->when($filters['scope_value'], fn($q) => $q->where('reports.district', $filters['scope_value']));
                break;
        }

        // Filter Tanggal
        $query->whereBetween('reports.created_at', [$filters['date_start'], $filters['date_end']]);
        
        return $query;
    }

    /**
     * Helper untuk mengisi dropdown filter.
     */
    private function getFilterOptions()
    {
        $admin = Auth::user();

        $serviceQuery = ServiceProfile::query()->orderBy('full_name');
        $adminQuery = Administrator::query()->where('role', RoleAdministratorEnum::BaseAdmin)->orderBy('full_name');
        
        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $serviceQuery->where('code', $admin->service_code);
            $adminQuery->where('service_code', $admin->service_code);
        }

        $reportsByDistrict = Report::whereNotNull('district')
            ->select('district')
            ->groupBy('district')
            ->orderBy('district')
            ->get();

        $formattedDistricts = $reportsByDistrict->map(function ($report) {
            return [
                'key'  => $report->district,
                'value' => $report->district_name,
            ];
        });

        return [
            'services' => $serviceQuery->get(),
            'admins' => $adminQuery->get(),
            'districts' => $formattedDistricts,
        ];
    }

    /**
     * POINT 2: KPI utama (cards).
     */
    private function getKpiCards(array $filters, Request $request)
    {
        // Terapkan filter ke kueri baru
        $query = $this->applyFiltersToQuery(Report::query(), $filters);
        
        $kpi = [];
        $kpi['total'] = (clone $query)->count();
        $kpi['today'] = (clone $query)->whereDate('reports.created_at', now())->count();

        // Kueri untuk laporan Selesai (mulai DARI AWAL)
        $finishedQuery = $this->applyFiltersToQuery(Report::query(), $filters)
            ->whereRaw("reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = ?", [$this->statusFinished]);
        
        $totalFinished = (clone $finishedQuery)->count();
        
        $slaBreaches = (clone $finishedQuery)->where(function ($q) {
            // Helper ini sekarang SELALU aman karena tidak ada JOIN yang ambigu
            $this->addSlaBreachLogic($q, 'created_at', 'updated_at');
        })->count();

        $kpi['sla_percent'] = ($totalFinished > 0) ? (1 - ($slaBreaches / $totalFinished)) * 100 : 0;
        
        // Kueri ini sekarang AMAN. Tidak ada join, tidak ada ambiguitas.
        $kpi['avg_hours'] = (clone $finishedQuery)
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (reports.updated_at - reports.created_at))) / 3600 as avg')
            ->value('avg');
            
        return (object) $kpi;
    }

    /**
     * POINT 3: Trend & Volume.
     */
    private function getTrendData(array $filters, Request $request)
    {
        // Terapkan filter ke kueri baru
        $query = $this->applyFiltersToQuery(Report::query(), $filters);
        
        $daysDiff = $filters['date_start']->diffInDays($filters['date_end']);
        $dbFormat = ($daysDiff > 90) ? 'YYYY-MM' : 'YYYY-MM-DD';
        $phpFormat = ($daysDiff > 90) ? 'M Y' : 'd M';

        // Line chart
        $trend = (clone $query)
            ->select(DB::raw("TO_CHAR(reports.created_at, '$dbFormat') as date_group"), DB::raw('count(*) as count'))
            ->groupBy('date_group')
            ->orderBy('date_group', 'asc')
            ->get();

        // Stacked chart
        $statusTrend = (clone $query)
            ->select(
                DB::raw("TO_CHAR(reports.created_at, '$dbFormat') as date_group"),
                DB::raw("COUNT(*) FILTER (WHERE reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusPending}') as pending"),
                DB::raw("COUNT(*) FILTER (WHERE reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusProcess}') as process"),
                DB::raw("COUNT(*) FILTER (WHERE reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}') as finished")
            )
            ->groupBy('date_group')
            ->orderBy('date_group', 'asc')
            ->get();

        return [
            'line_labels' => $trend->pluck('date_group')->map(fn($d) => Carbon::parse($d)->format($phpFormat)),
            'line_data' => $trend->pluck('count'),
            'stacked_labels' => $statusTrend->pluck('date_group')->map(fn($d) => Carbon::parse($d)->format($phpFormat)),
            'stacked_pending' => $statusTrend->pluck('pending'),
            'stacked_process' => $statusTrend->pluck('process'),
            'stacked_finished' => $statusTrend->pluck('finished'),
        ];
    }

    /**
     * POINT 4: Kinerja Dinas (table + chart).
     */
    private function getDinasPerformance(array $filters)
    {
        // 1. SubQuery 1 (Stats)
        $dinasSubQuery = $this->applyFiltersToQuery(Report::query(), $filters) // Mulai baru
            ->join('service_profiles', 'reports.service_id', '=', 'service_profiles.id')
            ->select(
                'service_profiles.full_name',
                'service_profiles.id',
                DB::raw('COUNT(reports.id) as total_laporan'),
                DB::raw("COUNT(*) FILTER (WHERE reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}') as total_selesai"),
                // Kueri ini AMAN karena JOIN didefinisikan DI SINI.
                DB::raw("AVG(CASE WHEN reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}' THEN EXTRACT(EPOCH FROM (reports.updated_at - reports.created_at)) ELSE NULL END) / 3600 as avg_hours")
            )
            ->groupBy('service_profiles.id', 'service_profiles.full_name');
        
        // 2. SubQuery 2 (SLA)
        $slaBreaches = $this->applyFiltersToQuery(Report::query(), $filters) // Mulai baru
            ->whereRaw("reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = ?", [$this->statusFinished])
            ->where(fn($q) => $this->addSlaBreachLogic($q, 'created_at', 'updated_at'))
            ->join('service_profiles', 'reports.service_id', '=', 'service_profiles.id')
            ->select('service_profiles.id', DB::raw('COUNT(reports.id) as breach_count'))
            ->groupBy('service_profiles.id');

        // 3. Gabungkan
        return DB::query()
            ->fromSub($dinasSubQuery, 'dinas_stats')
            ->leftJoinSub($slaBreaches, 'sla', 'dinas_stats.id', '=', 'sla.id')
            ->select(
                'dinas_stats.*',
                DB::raw('COALESCE(sla.breach_count, 0) as sla_breaches')
            )
            ->orderByDesc('total_laporan')
            ->get();
    }

    /**
     * POINT 5: Kinerja Admin (table + ranking).
     */
    private function getAdminPerformance(array $filters)
    {
        // Mulai kueri baru dan terapkan filter
        $query = $this->applyFiltersToQuery(Report::query(), $filters);
        
        return $query
            ->whereNotNull('reports.assignee_admin_id')
            ->join('administrators', 'reports.assignee_admin_id', '=', 'administrators.id')
            ->select(
                'administrators.full_name',
                DB::raw('COUNT(reports.id) as total_ditugaskan'),
                DB::raw("COUNT(*) FILTER (WHERE reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}') as total_selesai"),
                // Kueri ini AMAN karena JOIN didefinisikan DI SINI.
                DB::raw("AVG(CASE WHEN reports.statuses->>(jsonb_array_length(reports.statuses) - 1) = '{$this->statusFinished}' THEN EXTRACT(EPOCH FROM (reports.updated_at - reports.created_at)) ELSE NULL END) / 3600 as avg_hours"),
                DB::raw("COUNT(*) FILTER (WHERE '\"{$this->statusFinished}\"' IN (SELECT * FROM jsonb_array_elements_text(reports.statuses) LIMIT jsonb_array_length(reports.statuses) - 1)) as reopened_count")
            )
            ->groupBy('administrators.id', 'administrators.full_name')
            ->orderByDesc('total_selesai')
            ->get();
    }
    
    /**
     * POINT 6: Top Issues by Category.
     */
    private function getTopCategories(array $filters)
    {
        $query = $this->applyFiltersToQuery(Report::query(), $filters); // Mulai baru
        return $query
            ->select('category', DB::raw('count(*) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }
    
    /**
     * POINT 7: SLA Breaches & Hot Alerts.
     */
    private function getSlaBreaches(array $filters)
    {
        $query = $this->applyFiltersToQuery(Report::query(), $filters); // Mulai baru
        return $query
            ->with('assignee')
            ->whereRaw("reports.statuses->>(jsonb_array_length(reports.statuses) - 1) <> ?", [$this->statusFinished])
            ->whereRaw("reports.statuses->>(jsonb_array_length(reports.statuses) - 1) <> ?", [$this->statusRejected])
            ->where(fn($q) => $this->addSlaBreachLogic($q, 'created_at', 'NOW()'))
            ->orderBy('reports.created_at', 'asc') // Spesifik
            ->limit(10)
            ->get();
    }

    /**
     * Helper DRY untuk logika kueri SLA Breach (Sudah Diperbaiki).
     */
    private function addSlaBreachLogic($query, $startColumn, $endColumn)
    {
        $endColumnPrefixed = ($endColumn === 'NOW()') ? 'NOW()' : "reports.{$endColumn}";
        $startColumnPrefixed = "reports.{$startColumn}";

        foreach (self::SLA_HOURS as $priority => $hours) {
            $query->orWhere(function ($q) use ($priority, $hours, $startColumnPrefixed, $endColumnPrefixed) {
                $q->where('reports.priority', $priority) // <-- "reports."
                  ->whereRaw("{$endColumnPrefixed} > {$startColumnPrefixed} + interval '{$hours} hours'");
            });
        }
    }
}