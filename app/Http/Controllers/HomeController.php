<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HomeController extends Controller
{
    public function index()
    {
        $allReports = Report::select('created_at', 'statuses')->orderBy('created_at')->get();
        $totalReports = $allReports->count();
        $pendingCount = 0;
        $processCount = 0;
        $finishedCount = 0;
        $rejectedCount = 0;

        foreach ($allReports->pluck('statuses') as $statuses) {
            if (empty($statuses)) continue;
            $lastStatus = end($statuses);
            match ($lastStatus) {
                'pending' => $pendingCount++,
                'process' => $processCount++,
                'finished' => $finishedCount++,
                'rejected' => $rejectedCount++,
                default => 0,
            };
        }

        $topCities = Report::query()
            ->select('city', DB::raw('count(*) as total_reports'))
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
                    $dailyCounts[$date] = ['pending' => 0, 'process' => 0, 'finished' => 0, 'rejected' => 0];
                }
                if (isset($dailyCounts[$date][$lastStatus])) {
                    $dailyCounts[$date][$lastStatus]++;
                }
            }
        }

        $chartLabels = array_keys($dailyCounts);
        $chartData = [
            'pending' => [],
            'process' => [],
            'finished' => [],
            'rejected' => [],
        ];

        foreach ($chartLabels as $label) {
            $chartData['pending'][] = $dailyCounts[$label]['pending'];
            $chartData['process'][] = $dailyCounts[$label]['process'];
            $chartData['finished'][] = $dailyCounts[$label]['finished'];
            $chartData['rejected'][] = $dailyCounts[$label]['rejected'];
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
            
        return view('main', $viewData);
    }
}