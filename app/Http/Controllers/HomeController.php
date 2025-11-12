<?php

namespace App\Http\Controllers;

use App\Enums\ReportStatusEnum;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HomeController extends Controller
{
    public function index()
    {
        $allReports = Report::select('created_at', 'statuses')
                            ->where('created_at', '>=', Carbon::now()->subMonth())
                            ->orderBy('created_at')
                            ->get();
        $totalReports = $allReports->count();
        $pendingCount = 0;
        $processCount = 0;
        $finishedCount = 0;
        $rejectedCount = 0;

        foreach ($allReports->pluck('statuses') as $statuses) {
            if (empty($statuses)) continue;
            $lastStatus = end($statuses);
            match ($lastStatus) {
                ReportStatusEnum::Pending->value => $pendingCount++,
                ReportStatusEnum::Process->value => $processCount++,
                ReportStatusEnum::Finished->value => $finishedCount++,
                ReportStatusEnum::Rejected->value => $rejectedCount++,
                default => 0,
            };
        }

        $topCities = Report::query()
            ->select('city', DB::raw(value: 'count(*) as total_reports'))
            ->whereNotNull('city')
            ->groupBy('city')
            ->orderByDesc('total_reports')
            ->take(5)
            ->get();
            
        $dailyCounts = [];
        foreach ($allReports as $report) {
            $date = $report->created_at->format('d M');

            $statusesArray = $report->statuses;

            if (empty($statusesArray)) continue;
    
            $lastStatus = end($statusesArray); 

            if ($lastStatus) {
                if (!isset($dailyCounts[$date])) {
                    $dailyCounts[$date] = [
                        ReportStatusEnum::Pending->value => 0,
                        ReportStatusEnum::Process->value => 0,
                        ReportStatusEnum::Finished->value => 0,
                        ReportStatusEnum::Rejected->value => 0,
                    ];
                }
                if (isset($dailyCounts[$date][$lastStatus])) {
                    $dailyCounts[$date][$lastStatus]++;
                }
            }
        }

        $chartLabels = array_keys($dailyCounts);
        $chartData = [
            ReportStatusEnum::Pending->value => [],
            ReportStatusEnum::Process->value => [],
            ReportStatusEnum::Finished->value => [],
            ReportStatusEnum::Rejected->value => [],
        ];

        foreach ($chartLabels as $label) {
            $chartData[ReportStatusEnum::Pending->value][] = $dailyCounts[$label][ReportStatusEnum::Pending->value];
            $chartData[ReportStatusEnum::Process->value][] = $dailyCounts[$label][ReportStatusEnum::Process->value];
            $chartData[ReportStatusEnum::Finished->value][] = $dailyCounts[$label][ReportStatusEnum::Finished->value];
            $chartData[ReportStatusEnum::Rejected->value][] = $dailyCounts[$label][ReportStatusEnum::Rejected->value];
        }

        $viewData = [
            'totalReports' => $totalReports,
            'pendingReports' => $pendingCount,
            'processReports' => $processCount,
            'finishedReports' => $finishedCount,
            'rejectedReports' => $rejectedCount,
            'topCities' => $topCities,
            'chartLabels' => $chartLabels,
            'chartData' => $chartData,
        ];

        // header('Content-Type: application/json');
        // echo json_encode($viewData, JSON_PRETTY_PRINT);
            
        return view('main', $viewData);
    }
}