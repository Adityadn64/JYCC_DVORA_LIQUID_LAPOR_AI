<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Administrator;
use App\Enums\PriorityEnum;
use App\Enums\RoleAdministratorEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    use ApiResponseTrait;
    
    public function index(Request $request)
    {
        /** @var Request $request */
        // Decode request
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $baseReportQuery = Report::query();
        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $baseReportQuery->where('service_code', $admin->service_code);
        }

        $totalReports = (clone $baseReportQuery)->count();
        $reportsToday = (clone $baseReportQuery)->whereDate('created_at', Carbon::today())->count();
        
        $avgResolutionHours = (clone $baseReportQuery)->whereJsonContains('statuses', 'finished')
            ->select(DB::raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 as avg_hours'))
            ->value('avg_hours');
        $avgResolutionTime = $avgResolutionHours ? round($avgResolutionHours, 1) . ' Jam' : 'N/A';
        
        $reportTrend = (clone $baseReportQuery)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')->orderBy('date', 'asc')->get()
            ->map(fn($item) => ['label' => Carbon::parse($item->date)->format('d M'), 'value' => $item->count]);

        $reportsByServiceQuery = Report::query();
        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $reportsByServiceQuery->where('service_code', $admin->service_code);
        }
        $serviceDistribution = $reportsByServiceQuery
            ->join('service_profiles', 'reports.service_id', '=', 'service_profiles.id')
            ->select('service_profiles.full_name as label', DB::raw('count(reports.id) as value'))
            ->groupBy('service_profiles.full_name')->orderByDesc('value')->take(7)->get();

        $topAdminsQuery = Report::query();
        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $topAdminsQuery->whereIn('assignee_admin_id', function ($query) use ($admin) {
                $query->select('id')->from('administrators')->where('service_code', $admin->service_code);
            });
        }
        $topAdmins = $topAdminsQuery
            ->join('administrators', 'reports.assignee_admin_id', '=', 'administrators.id')
            ->whereJsonContains('statuses', 'finished')
            ->select('administrators.full_name as label', DB::raw('count(reports.id) as value'))
            ->groupBy('administrators.full_name')->orderByDesc('value')->take(5)->get();
            
        $reportQuery = $baseReportQuery;

        // Use $request->input() with default value
        $reportQuery->when($request->input('search_id'), fn($q) => $q->where('id', $request->input('search_id')));
        
        $reportQuery->when($request->input('search_term'), function ($q) use ($request) {
            $term = strtolower('%' . $request->input('search_term') . '%');
            
            return $q->where(function($subQuery) use ($term) {
                $subQuery->whereRaw('LOWER(title) LIKE ?', [$term])
                         ->orWhereRaw('LOWER(description) LIKE ?', [$term]);
            });
        });

        $reportQuery->when($request->input('search_location'), function ($q) use ($request) {
            $loc = strtolower('%' . $request->input('search_location') . '%');

            return $q->where(function($subQuery) use ($loc) {
                $subQuery->whereRaw('LOWER(address) LIKE ?', [$loc])
                         ->orWhereRaw('LOWER(city) LIKE ?', [$loc])
                         ->orWhereRaw('LOWER(district) LIKE ?', [$loc])
                         ->orWhereRaw('LOWER(address) LIKE ?', [$loc]);
            });
        });
        
        $reportQuery->when($request->input('search_admin'), fn($q) => $q->where('assignee_admin_id', $request->input('search_admin')));
        $reportQuery->when($request->input('search_priority'), fn($q) => $q->where('priority', $request->input('search_priority')));

        $sort = $request->input('sort', 'updated_at_desc');
        match ($sort) {
            'created_at_desc' => $reportQuery->orderBy('created_at', 'desc'),
            'created_at_asc' => $reportQuery->orderBy('created_at', 'asc'),
            'updated_at_asc' => $reportQuery->orderBy('updated_at', 'asc'),
            default => $reportQuery->orderBy('updated_at', 'desc'),
        };
        
        $currentPage = $request->input('page', 1);
        
        LengthAwarePaginator::currentPageResolver(function () use ($currentPage) {
            return $currentPage;
        });

        $reports = $reportQuery->with(['assignee:id,full_name', 'serviceProfile:id,full_name'])
                                ->latest('updated_at')
                                ->paginate(20)
                                ->withQueryString();
        
        $adminsQuery = Administrator::where('role', RoleAdministratorEnum::BaseAdmin);
        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $adminsQuery->where('service_code', $admin->service_code);
        }
        $admins = $adminsQuery->orderBy('full_name')->get();
        $priorities = PriorityEnum::cases();

        return $this->successResponse([
            'stats' => [
                'totalReports' => $totalReports,
                'reportsToday' => $reportsToday,
                'avgResolutionTime' => $avgResolutionTime,
            ],
            'charts' => [
                'reportTrend' => $reportTrend,
                'serviceDistribution' => $serviceDistribution,
                'topAdmins' => $topAdmins,
            ],
            'reports' => $reports,
            'filters' => [
                'admins' => $admins,
                'priorities' => $priorities,
            ]
        ]);
    }
}