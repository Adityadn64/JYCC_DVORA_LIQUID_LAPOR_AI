<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HomeController extends Controller
{
    public function index()
    {
        $reports = Report::pluck('statuses');
        $totalReports = $reports->count();
        $pendingCount = 0;
        $processCount = 0;
        $finishedCount = 0;
        $rejectedCount = 0;

        foreach ($reports as $statuses) {
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
            ->take(10)
            ->get();
            
        // Kirim semua data ke view
        return view('main', [
            'totalReports' => $totalReports,
            'pendingReports' => $pendingCount,
            'processReports' => $processCount,
            'finishedReports' => $finishedCount,
            'rejectedReports' => $rejectedCount,
            'topCities' => $topCities,
        ]);
    }
}