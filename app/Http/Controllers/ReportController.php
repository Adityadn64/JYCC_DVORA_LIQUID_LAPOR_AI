<?php

namespace App\Http\Controllers;

use App\Models\District;
use App\Models\Regency;
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
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    use ApiResponseTrait;

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:4',
            'phone' => 'required|string|min:4',
            'description' => 'required|string|min:20',
            'city' => 'required|string',
            'district' => 'required|string',
            'location' => 'required|string',
            'images.*' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            'videos.*' => 'nullable|mimes:mp4|max:10240',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors()->toArray());
        }

        // Gunakan $request->input() atau property magic
        $regency = Regency::where('code', $request->input('city'))->first();

        if (!$regency) {
            return $this->errorResponse('Validation failed', 422, [
                'city' => ['Kota/Kabupaten yang dipilih tidak valid atau tidak ditemukan.']
            ]);
        }

        $district = District::where('code', $request->input('district'))
                            ->where('regency_id', $regency->id)
                            ->first();

        if (!$district) {
            return $this->errorResponse('Validation failed', 422, [
                'district' => ['Kecamatan yang dipilih tidak valid untuk kota/kabupaten yang bersangkutan.']
            ]);
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
            'description' => $request->input('description'),
            'address' => $request->input('location'),
            'city' => $regency->code,
            'district' => $district->code,

            'reporter_name' => $request->input('name'),
            'reporter_contact' => $request->input('phone'),
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

        // Gunakan hasFile() dan file() method
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = Storage::disk(env("FILESYSTEM_DISK"))->put('reports', $image);
                $allPaths[] = $path;
                $allTypes[] = $image->getMimeType();
            }
        }
        
        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $video) {
                $path = Storage::disk(env("FILESYSTEM_DISK"))->put('reports', $video);
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
    
        return $this->successResponse([
            'id' => $report->id,
        ], 'Laporan Anda berhasil dikirim! Berikut adalah detailnya.');
    }

    public function trackIndex(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);
        
        $query = Report::query();

        // Gunakan input() method atau property magic
        $query->when($request->input('search_id'), function ($q) use ($request) {
            return $q->where('id', $request->input('search_id'));
        });

        $query->when($request->input('search_term'), function ($q) use ($request) {
            $term = strtolower('%' . $request->input('search_term') . '%');
            
            return $q->where(function($subQuery) use ($term) {
                $subQuery->whereRaw('LOWER(title) LIKE ?', [$term])
                         ->orWhereRaw('LOWER(description) LIKE ?', [$term]);
            });
        });

        $query->when($request->input('search_location'), function ($q) use ($request) {
            $loc = strtolower('%' . $request->input('search_location') . '%');

            return $q->where(function($subQuery) use ($loc) {
                $subQuery->whereRaw('LOWER(address) LIKE ?', [$loc])
                         ->orWhereRaw('LOWER(city) LIKE ?', [$loc])
                         ->orWhereRaw('LOWER(district) LIKE ?', [$loc])
                         ->orWhereRaw('LOWER(address) LIKE ?', [$loc]);
            });
        });

        $query->when($request->input('search_admin'), function ($q) use ($request) {
            return $q->where('assignee_admin_id', $request->input('search_admin'));
        });

        $query->when($request->input('search_priority'), function ($q) use ($request) {
            return $q->where('priority', $request->input('search_priority'));
        });

        $sort = $request->input('sort', 'updated_at_desc');
        
        match ($sort) {
            'created_at_desc' => $query->orderBy('created_at', 'desc'),
            'updated_at_desc' => $query->orderBy('updated_at', 'desc'),
            'created_at_asc' => $query->orderBy('created_at', 'asc'),
            'updated_at_asc' => $query->orderBy('updated_at', 'asc'),
            default => $query->orderBy('updated_at', 'desc'),
        };

        $currentPage = $request->input('page', 1);
        
        LengthAwarePaginator::currentPageResolver(function () use ($currentPage) {
            return $currentPage;
        });

        $reports = $query->with(['assignee', 'serviceProfile'])->paginate(20);
        
        $admins = Administrator::where('role', RoleAdministratorEnum::BaseAdmin)->orderBy('full_name')->get();
        $priorities = PriorityEnum::cases();

        return $this->successResponse([
            'reports' => $reports,
            'admins' => $admins,
            'priorities' => $priorities,
        ]);
    }

    public function trackShow(Report $report)
    {
        $report->load('media', 'serviceProfile');

        return $this->successResponse([
            'report' => $report,
        ]);
    }
}