<?php

namespace App\Http\Controllers;

use App\Mail\NotifyAssigneeAdmin;
use App\Mail\NotifyHasGenerateNewReport;
use App\Models\District;
use App\Models\Regency;
use App\Models\Report;
use App\Models\ServiceProfile;
use App\Models\Administrator;
use App\Enums\RoleAdministratorEnum;
use Illuminate\Support\Facades\Request as RequestFacade;
use App\Enums\PriorityEnum;
use App\Enums\ReportStatusEnum;
use App\Models\ReportMediaUser;
use App\Time\Time;
use App\Http\Controllers\AIController;
use App\Traits\Controller\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    use ApiResponseTrait;

    public function store(Request $request)
    {
        $this->validateRequest($request, [
            'name' => 'required|string|min:4',
            'phone' => 'required|string|min:4',
            'description' => 'required|string|min:20',
            'city' => 'required|string',
            'district' => 'required|string',
            'location' => 'required|string',
            'images.*' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'videos.*' => 'nullable|mimes:mp4|max:51200',
        ], [
            'name.required' => 'Nama pelapor wajib diisi.',
            'name.min' => 'Nama pelapor minimal harus 4 karakter.',
            'phone.required' => 'Nomor telepon pelapor wajib diisi.',
            'phone.min' => 'Nomor telepon minimal harus 4 karakter.',
            'description.required' => 'Deskripsi laporan wajib diisi.',
            'description.min' => 'Deskripsi laporan minimal harus 20 karakter.',
            'city.required' => 'Kota/Kabupaten wajib dipilih.',
            'district.required' => 'Kecamatan wajib dipilih.',
            'location.required' => 'Detail lokasi wajib diisi.',
            'images.*.required' => 'Setidaknya satu gambar wajib diunggah.',
            'images.*.image' => 'File yang diunggah harus berupa gambar.',
            'images.*.mimes' => 'Format gambar harus jpeg, png, atau jpg.',
            'images.*.max' => 'Ukuran setiap gambar tidak boleh lebih dari 2MB.',
            'videos.*.mimes' => 'Format video harus mp4.',
            'videos.*.max' => 'Ukuran setiap video tidak boleh lebih dari 10MB.',
            'videos.*.uploaded' => 'Gagal mengunggah video. Ukuran file melebihi batas server (PHP Configuration).',
        ]);

        $real_regency = $request->input('city');
        $regency = Regency::where('code', $real_regency)->first();

        if (!$regency) {
            return $this->errorResponse('Validation failed', 422, [
                'city' => ['Kota/Kabupaten yang dipilih tidak valid atau tidak ditemukan.']
            ]);
        }

        $real_district = $request->input('district');
        $district = District::where('code', $real_district)
                            ->where('regency_id', $regency->id)
                            ->first();

        if (!$district) {
            return $this->errorResponse('Validation failed', 422, [
                'district' => ['Kecamatan yang dipilih tidak valid untuk kota/kabupaten yang bersangkutan.']
            ]);
        }

        $allPaths = [];
        $allTypes = [];

        $disk = config('filesystems.default');
        $is_local = in_array($disk, ['local', 'public']);
        $storage = $is_local ? Storage::disk("public") : Storage::disk($disk);
        $folderPath = ($is_local ? '' : 'public/') . 'real/reports/user';

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $storage->put($folderPath, $image, 'public');
                $allPaths[] = $path;
                $allTypes[] = $image->getMimeType();
            }
        }
        
        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $video) {
                $path = $storage->put($folderPath, $video, 'public');
                $allPaths[] = $path;
                $allTypes[] = $video->getMimeType();
            }
        }

        $reporter_phone = $request->input('phone');
        $description = $request->input('description');
        $address = $request->input('location');

        $laporanTeks = "=====DESKRIPSI=====\n$description\n\n=====LOKASI=====\n$address\n$real_regency\n$real_district";
        
        $aiInternalRequest = RequestFacade::create(
            '/api/analyze', 
            'POST', 
            ['laporan' => $laporanTeks],
            [],
            ['images' => $request->file('images')]
        );

        $aiController = new AIController();
        $aiResponse = $aiController->analyze($aiInternalRequest);

        if ($aiResponse->status() !== 200) {
            return $this->errorResponse('AI Error: ' . $aiResponse->getData()->message, 500);
        }
        
        \Log::info("AI Response: " . json_encode($aiResponse));

        $aiResult = $aiResponse->getData(true);
        $aiData = $aiResult['data'];

        $aiTitle = $aiData['title'];
        $aiCategory = $aiData['category'];
        $aiPriority = $aiData['priority'];
        $aiServiceCode = $aiData['service_code'];

        $serviceProfile = ServiceProfile::where('code', $aiServiceCode)->firstOrFail();

        $assigneeAdmin = Administrator::where('service_code', $aiServiceCode)
            ->whereDoesntHave('assignedReports', function ($query) {
                $query->whereRaw("statuses->>-1 IN (?, ?)", [
                    ReportStatusEnum::Pending->value,
                    ReportStatusEnum::Process->value
                ]);
            })
            ->inRandomOrder()
            ->first();

        if (!$assigneeAdmin) {
            $assigneeAdmin = Administrator::where('service_code', $aiServiceCode)
                ->withCount(['assignedReports as active_workload' => function ($query) {
                    $query->whereRaw("statuses->>-1 IN (?, ?)", [
                        ReportStatusEnum::Pending->value,
                        ReportStatusEnum::Process->value
                    ]);
                }])
                ->orderBy('active_workload', 'asc')
                ->inRandomOrder()
                ->first();
        }

        $assigneeId = $assigneeAdmin?->id;

        $report = Report::create([
            'description' => $description,
            'address' => $address,
            'city' => $regency->code,
            'district' => $district->code,

            'reporter_name' => $request->input('name'),
            'reporter_contact' => $reporter_phone,
            'title' => $aiTitle,
            'category' => $aiCategory,
            'priority' => $aiPriority,
            'service_id' => $serviceProfile->id,
            'service_code' => $aiServiceCode,
            'assignee_admin_id' => $assigneeId,

            'statuses' => [ReportStatusEnum::Pending],
            'review_timestamps' => [Time::getNow()],
            'reviewing_admin_ids' => [-1],
            'review_notes' => ['Laporan dibuat oleh sistem.'],
            'status_change_history' => [true],
        ]);

        if (!empty($allPaths)) {
            ReportMediaUser::create([
                'report_id' => $report->id,
                'files_path' => $allPaths,
                'files_type' => $allTypes,
            ]);
        }
    
        if ($assigneeAdmin?->email) {
            Mail::to($assigneeAdmin->email)->send(new NotifyAssigneeAdmin($report));
        }

        try {
            $fakeEmail = Str::replace('+', '', trim($reporter_phone)) . "@phone.id";
            Mail::to($fakeEmail)->send(new NotifyHasGenerateNewReport($report));
        } catch (\Exception $e) {
            \Log::error("Gagal kirim email pelapor: " . $e->getMessage());
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
        $report->load(['serviceProfile', 'assignee']);
        $report->append(['contributors', 'media']);

        return $this->successResponse([
            'report' => $report,
        ]);
    }

    public function update(Request $request, Report $report)
    {
        $this->validateRequest($request, [

        ], [

        ]);

        $report->load(['serviceProfile']);
    }
}