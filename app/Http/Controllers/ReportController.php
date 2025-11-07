<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportMedia;
use App\Models\ServiceProfile;
use App\Models\Administrator;
use App\Enums\RoleAdministratorEnum;
use App\Enums\ServiceCodeEnum;
use App\Enums\ReportCategoryEnum;
use App\Enums\PriorityEnum;
use App\Enums\ReportStatusEnum;
use App\Time\Time;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function create()
    {
        return view('report.create');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'required|string|min:20',
            'location' => 'required|string',
            'images.*' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            'videos.*' => 'nullable|mimes:mp4|max:10240',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $aiDeterminedServiceCode = ServiceCodeEnum::DINKES;
        $aiDeterminedCategory = ReportCategoryEnum::DINKES;
        $serviceProfile = ServiceProfile::where('code', $aiDeterminedServiceCode)->firstOrFail();
        
        $aiResult = [
            'title' => 'Judul Laporan Dihasilkan AI',
            'category' => $aiDeterminedCategory,
            'priority' => PriorityEnum::Medium,
            'service_id' => $serviceProfile->id,
            'service_code' => $serviceProfile->code,
        ];

        $report = Report::create([
            'description' => $request->description,
            'address' => $request->location,
            'city' => 'Kota Contoh',
            'district' => 'Kecamatan Contoh',
            
            'title' => $aiResult['title'],
            'category' => $aiResult['category'],
            'priority' => $aiResult['priority'],
            'service_id' => $aiResult['service_id'],
            'service_code' => $aiResult['service_code'],

            'statuses' => [ReportStatusEnum::Pending],
            'review_timestamps' => [Time::getNow()],
            'reviewing_admin_ids' => [],
            'review_notes' => ['Laporan dibuat oleh sistem.'],
            'agreements_history' => [],
            'disagreements_history' => [],
        ]);

        $allPaths = [];
        $allTypes = [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = Storage::disk(env("FILESYSTEM_DISK"))->put('reports', $image); // $image->store('reports');
                $allPaths[] = $path;
                $allTypes[] = $image->getMimeType();
            }
        }
        
        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $video) {
                $path = Storage::disk(env("FILESYSTEM_DISK"))->put('reports', $video); // $video->store('reports');
                $allPaths[] = $path;
                $allTypes[] = $video->getMimeType();
            }
        }
        
        if (!empty($allPaths)) {
            ReportMedia::create([
                'report_id' => $report->id,
                'files_path' => $allPaths,
                'files_type' => $allTypes,
            ]);
        }
        
        return redirect()->route('report.track.show', $report->id)
                         ->with('success', 'Laporan Anda berhasil dikirim! Berikut adalah detailnya.');
    }

    public function trackIndex(Request $request)
    {
        $query = Report::query();

        $query->when($request->filled('search_id'), function ($q) use ($request) {
            return $q->where('id', $request->search_id);
        });

        $query->when($request->filled('search_term'), function ($q) use ($request) {
            $term = '%' . $request->search_term . '%';
            return $q->where(function($subQuery) use ($term) {
                $subQuery->where('title', 'like', $term)
                         ->orWhere('description', 'like', $term);
            });
        });

        $query->when($request->filled('search_location'), function ($q) use ($request) {
            $location = '%' . $request->search_location . '%';
            return $q->where(function($subQuery) use ($location) {
                $subQuery->where('address', 'like', $location)
                         ->orWhere('city', 'like', $location)
                         ->orWhere('district', 'like', $location);
            });
        });
        
        $query->when($request->filled('search_admin'), function ($q) use ($request) {
            return $q->where('assignee_admin_id', $request->search_admin);
        });

        $query->when($request->filled('search_priority'), function ($q) use ($request) {
            return $q->where('priority', $request->search_priority);
        });

        $sort = $request->input('sort', 'updated_at_desc'); 
        
        match ($sort) {
            'created_at_desc' => $query->orderBy('created_at', 'desc'),
            'updated_at_desc' => $query->orderBy('updated_at', 'desc'),
            
            'created_at_asc' => $query->orderBy('created_at', 'asc'),
            'updated_at_asc' => $query->orderBy('updated_at', 'asc'),
            
            default => $query->orderBy('updated_at', 'desc'),
        };

        $reports = $query->with(['assignee', 'serviceProfile'])->paginate(10);
        
        $admins = Administrator::where('role', RoleAdministratorEnum::BaseAdmin)->orderBy('full_name')->get();
        $priorities = PriorityEnum::cases();

        return view('report.track_index', [
            'reports' => $reports,
            'admins' => $admins,
            'priorities' => $priorities,
        ]);
    }

    public function trackShow(Report $report)
    {
        $report->load('media', 'serviceProfile');

        return view('report.track_show', [
            'report' => $report,
        ]);
    }
}