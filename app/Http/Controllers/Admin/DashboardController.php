<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Enums\PriorityEnum;
use App\Enums\RoleAdministratorEnum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $totalReports = Report::count();
        $reportsToday = Report::whereDate('created_at', Carbon::today())->count();
        $avgResolutionHours = Report::whereJsonContains('statuses', 'finished')
            ->select(DB::raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 as avg_hours'))->value('avg_hours');
        $avgResolutionTime = $avgResolutionHours ? round($avgResolutionHours, 1) . ' Jam' : 'N/A';

        $reportTrend = Report::query()->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))->where('created_at', '>=', now()->subDays(30))->groupBy('date')->orderBy('date', 'asc')->get();
        $trendLabels = $reportTrend->pluck('date')->map(fn($date) => Carbon::parse($date)->format('d M'));
        $trendData = $reportTrend->pluck('count');
        $reportsByService = Report::query()->join('service_profiles', 'reports.service_id', '=', 'service_profiles.id')->select('service_profiles.full_name', DB::raw('count(reports.id) as count'))->groupBy('service_profiles.full_name')->orderByDesc('count')->take(7)->get();
        $serviceLabels = $reportsByService->pluck('full_name');
        $serviceData = $reportsByService->pluck('count');
        $topAdmins = Report::query()->join('administrators', 'reports.assignee_admin_id', '=', 'administrators.id')->whereJsonContains('statuses', 'finished')->select('administrators.full_name', DB::raw('count(reports.id) as count'))->groupBy('administrators.full_name')->orderByDesc('count')->take(5)->get();
        $adminLabels = $topAdmins->pluck('full_name');
        $adminData = $topAdmins->pluck('count');

        $query = Report::query();

        $query->when($request->filled('search_id'), fn($q) => $q->where('id', $request->search_id));
        $query->when($request->filled('search_term'), function ($q) use ($request) {
            $term = '%' . $request->search_term . '%';
            return $q->where(fn($sub) => $sub->where('title', 'like', $term)->orWhere('description', 'like', $term));
        });
        $query->when($request->filled('search_location'), function ($q) use ($request) {
            $loc = '%' . $request->search_location . '%';
            return $q->where(fn($sub) => $sub->where('address', 'like', $loc)->orWhere('city', 'like', $loc)->orWhere('district', 'like', $loc));
        });
        $query->when($request->filled('search_admin'), fn($q) => $q->where('assignee_admin_id', $request->search_admin));
        $query->when($request->filled('search_priority'), fn($q) => $q->where('priority', $request->search_priority));

        $sort = $request->input('sort', 'updated_at_desc');
        match ($sort) {
            'created_at_desc' => $query->orderBy('created_at', 'desc'),
            'created_at_asc' => $query->orderBy('created_at', 'asc'),
            'updated_at_asc' => $query->orderBy('updated_at', 'asc'),
            default => $query->orderBy('updated_at', 'desc'),
        };

        $reports = $query->with(['assignee', 'serviceProfile'])->paginate(10);
        
        $admins = Administrator::where('role', RoleAdministratorEnum::BaseAdmin)->orderBy('full_name')->get();
        $priorities = PriorityEnum::cases();

        return view('admin.dashboard', compact(
            'totalReports', 'reportsToday', 'avgResolutionTime',
            'trendLabels', 'trendData', 'serviceLabels', 'serviceData',
            'adminLabels', 'adminData',
            'reports', 'admins', 'priorities'
        ));
    }
}