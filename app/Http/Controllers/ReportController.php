<?php

namespace App\Http\Controllers;

use App\Enums\AdminStatusEnum;
use App\Enums\RoleAdministratorEnum;
use App\Mail\NotifyAssigneeAdmin;
use App\Mail\NotifyHasGenerateNewReport;
use App\Models\District;
use App\Models\Regency;
use App\Models\Report;
use App\Models\ServiceProfile;
use App\Models\Administrator;
use Illuminate\Support\Facades\Request as RequestFacade;
use App\Enums\PriorityEnum;
use App\Enums\ReportStatusEnum;
use App\Models\ReportMediaUser;
use App\Time\Time;
use App\Http\Controllers\AIController;
use App\Mail\NotifyAdminIdHasChanged;
use App\Mail\NotifyAllAdminContribute;
use App\Mail\NotifyHasUpdateReport;
use App\Traits\Controller\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

        $reporter_phone = $request->input('phone');
        $description = $request->input('description');
        $address = $request->input('location');

        $laporanTeks = "=====DESKRIPSI=====\n$description\n\n=====LOKASI=====\n$address\n$real_regency\n$real_district";
        
        $aiInternalRequest = RequestFacade::create(
            '/api/analyze', 
            'POST', 
            ['report' => $laporanTeks],
            [],
            ['images' => $request->file('images')]
        );

        $aiController = new AIController();
        $aiResponse = $aiController->analyze($aiInternalRequest);

        if ($aiResponse->status() !== 200) {
            return $this->errorResponse('AI Error: ' . $aiResponse->getData()->message, 500);
        }
        
        Log::info("AI Response: " . json_encode($aiResponse));

        $aiResult = $aiResponse->getData(true);
        $aiData = $aiResult['data'];

        $aiTitle = $aiData['title'];
        $aiCategory = $aiData['category'];
        $aiPriority = $aiData['priority'];
        $aiServiceCode = $aiData['service_code'];

        $serviceProfile = ServiceProfile::where('code', $aiServiceCode)->firstOrFail();

        $assigneeAdmin = Administrator::where('service_code', $aiServiceCode)
            ->where('status', AdminStatusEnum::Active->value)
            ->where('role', RoleAdministratorEnum::BaseAdmin->value)
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
                ->where('status', AdminStatusEnum::Active->value)
                ->where('role', RoleAdministratorEnum::BaseAdmin->value)
                ->withCount(['assignedReports as active_workload' => function ($query) {
                    $query->whereRaw("statuses->>-1 IN (?, ?)", [
                        ReportStatusEnum::Pending->value,
                        ReportStatusEnum::Process->value
                    ]);
                }])
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

        $allPaths = [];
        $allTypes = [];

        $disk = config('filesystems.default');
        $is_local = in_array($disk, ['local', 'public']);
        $storage = $is_local ? Storage::disk("public") : Storage::disk($disk);
        $folderPath = ($is_local ? '' : 'public/') . 'real/reports/user';

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $storage->put($folderPath, $image, 'public');
                /** @disregard P1013 */
                $allPaths[] = 'pu/' . ($is_local ? $path : base64_encode(($path)));
                $allTypes[] = $image->getMimeType();
            }
        }
        
        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $video) {
                $path = $storage->put($folderPath, $video, 'public');
                /** @disregard P1013 */
                $allPaths[] = 'pu/' . ($is_local ? $path : base64_encode(($path)));
                $allTypes[] = $video->getMimeType();
            }
        }

        if (!empty($allPaths)) {
            ReportMediaUser::create([
                'report_id' => $report->id,
                'files_path' => $allPaths,
                'files_type' => $allTypes,
            ]);
        }

        $is_https = str_contains(config('app.url'), 'https://');
    
        if ($assigneeAdmin?->email) {
            Mail::to($assigneeAdmin->email)->send(new NotifyAssigneeAdmin($report, $is_https));
        }

        $otherAdminsInService = Administrator::where('service_code', $report->service_code)
            ->where('id', '!=', $report->assignee_admin_id)
            ->where('status', AdminStatusEnum::Active->value)
            ->where('role', RoleAdministratorEnum::BaseAdmin->value)
            ->get();

        $recipientEmails = $otherAdminsInService->pluck('email')->filter()->values();

        if ($recipientEmails->isNotEmpty()) {
            Mail::to($recipientEmails->first())->send(
                new NotifyAllAdminContribute($report, $is_https)
            );
        }

        try {
            $fakeEmail = (Str::replace('+', '', trim($reporter_phone)) ?? "number0123456789") . "@phone.id";
            Mail::to($fakeEmail)->send(new NotifyHasGenerateNewReport($report, $is_https));
        } catch (\Exception $e) {
            Log::error("Gagal kirim email pelapor: " . $e->getMessage());
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

        $reportStatuses = ReportStatusEnum::cases();

        $admins = Administrator::where('service_code', $report->service_code)
            ->where('status', AdminStatusEnum::Active->value)
            ->where('role', RoleAdministratorEnum::BaseAdmin->value)
            ->select('id', 'full_name')
            ->get();

        return $this->successResponse([
            'report'   => $report,
            'statuses' => $reportStatuses,
            'admins'   => $admins,
        ]);
    }

    public function addComment(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);
        
        $this->validateRequest($request, [
            'report_id' => 'required|integer|exists:reports,id',
            'status' => ['required', 'string', 'in:' . implode(',', array_column(ReportStatusEnum::cases(), 'value'))],
            'comment' => 'required|string|min:10|max:5000',
        ], [
            'report_id.required' => 'ID Laporan wajib disertakan.',
            'report_id.exists' => 'Laporan tidak ditemukan.',
            'status.required' => 'Status laporan wajib dipilih.',
            'status.in' => 'Status yang dipilih tidak valid.',
            'comment.required' => 'Komentar wajib disertakan.',
            'comment.min' => 'Komentar minimal harus 20 karakter.',
            'comment.max' => 'Komentar tidak boleh lebih dari 5000 karakter.',
        ]);

        $admin = Auth::user();

        /** @var \App\Models\Report $report */
        $report = Report::findOrFail($request->input('report_id'));

        if ($report->service_code !== $admin->service_code) {
            return $this->errorResponse('Unauthorized', 422, [
                'auth' => ['Anda tidak memiliki wewenang untuk memperbarui laporan ini.']
            ]);
        }

        $assigneAdminId = $report->assignee_admin_id;
        $isAssigneAdmin = $assigneAdminId === $admin->id;
        $assigneAdminData = Administrator::find($assigneAdminId);

        try {
            $updated_at = Time::getNow();
            $report->statuses = array_merge($report->statuses, [$request->input('status')]);
            $report->review_timestamps = array_merge($report->review_timestamps, [$updated_at]);
            $report->reviewing_admin_ids = array_merge($report->reviewing_admin_ids, [$admin->id]);
            $report->review_notes = array_merge($report->review_notes, [$request->input('comment') ?? '']);
            $report->status_change_history = array_merge($report->status_change_history, [$isAssigneAdmin]);

            $report->updated_at = $updated_at;
            $report->save();

            try {
                $is_https = str_contains(config('app.url'), 'https://');
                $fakeEmail = (Str::replace('+', '', subject: trim($report->reporter_contact)) ?? "number0123456789") . "@phone.id";
                Mail::to($fakeEmail)->send(new NotifyHasUpdateReport($report, $is_https));
                Mail::to($assigneAdminData->email)->send(new NotifyHasUpdateReport($report, $is_https));
            } catch (\Exception $e) {
                Log::error("Gagal kirim email pelapor: " . $e->getMessage());
            }
        } catch (\Throwable $e) {
            Log::error("Gagal memperbarui status laporan: " . $e->getMessage());
            return $this->errorResponse('Gagal memperbarui status laporan karena kesalahan server.', 500);
        }

        $reportStatuses = ReportStatusEnum::cases();

        return $this->successResponse([
            'report' => $report,
            'statuses' => $reportStatuses,
        ]);
    }

    public function changeStatus(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);
        
        $this->validateRequest($request, [
            'report_id' => 'required|integer|exists:reports,id',
            'statuses_idx' => 'required|integer',
            'visibility' => 'required|boolean',
        ], [
            'report_id.required' => 'ID Laporan wajib disertakan.',
            'report_id.exists' => 'Laporan tidak ditemukan.',
            'statuses_idx.required' => 'Indeks status wajib disertakan.',
            'statuses_idx.integer' => 'Indeks status harus berupa angka.',
            'visibility.required' => 'Status visibilitas wajib disertakan.',
            'visibility.boolean' => 'Status visibilitas harus berupa boolean (true/false, 1/0).',
        ]);

        $admin = Auth::user();

        /** @var \App\Models\Report $report */
        $report = Report::findOrFail($request->input('report_id'));

        if ($report->service_code !== $admin->service_code && $report->assignee_admin_id !== $admin->id) {
            return $this->errorResponse('Unauthorized', 422, [
                'auth' => ['Anda tidak memiliki wewenang untuk memperbarui laporan ini.']
            ]);
        }

        try {
            $status_change_history = $report->status_change_history ?? []; 
            $status_change_history[$request->input('statuses_idx')] = $request->input('visibility');
            $report->status_change_history = $status_change_history;
            $report->save();

            $contributeAdmins = Administrator::find($report->reviewing_admin_ids);

            if ($contributeAdmins && $contributeAdmins->first()->email) {
                $is_https = (config('app.env') === 'production' || str_contains(config('app.url'), 'https://'));
                
                Mail::to($contributeAdmins->first()->email)->send(new NotifyHasUpdateReport($report, $is_https));
            }
        } catch (\Throwable $e) {
            Log::error("Gagal memperbarui status laporan: " . $e->getMessage());
            return $this->errorResponse('Gagal memperbarui status laporan karena kesalahan server.', 500);
        }

        $reportStatuses = ReportStatusEnum::cases();

        return $this->successResponse([
            'report' => $report,
            'statuses' => $reportStatuses,
        ]);
    }

    public function changeAdmin(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);
        
        $this->validateRequest($request, [
            'report_id' => 'required|integer|exists:reports,id',
            'new_admin_id' => 'required|integer',
        ], [
            'report_id.required' => 'ID Laporan wajib disertakan.',
            'report_id.exists' => 'Laporan tidak ditemukan.',
            'new_admin_id.required' => 'ID Admin wajib disertakan.',
            'new_admin_id.integer' => 'ID Admin harus berupa angka.',
        ]);

        $admin = Auth::user();

        /** @var \App\Models\Report $report */
        $report = Report::findOrFail($request->input('report_id'));

        if ($admin->role !== RoleAdministratorEnum::SystemAdmin) {
            return $this->errorResponse('Unauthorized', 422, [
                'auth' => ['Anda tidak memiliki wewenang untuk memperbarui laporan ini.']
            ]);
        }

        $new_admin_id = $request->new_admin_id;

        $last_admin_idx = $report->assignee_admin_id;
        $last_admin = Administrator::find($last_admin_idx);
        $new_admin = Administrator::find($new_admin_id);

        if (!$new_admin) {
            return $this->errorResponse('ID Admin baru tidak valid. Admin tidak ditemukan.', 422, [
                'new_admin_id' => ['Admin baru tidak ditemukan dalam sistem.']
            ]);
        }

        try {
            $report->assignee_admin_id = $new_admin_id;
            $report->save();

            $contributeAdmins = Administrator::find($report->reviewing_admin_ids);

            if ($contributeAdmins && $contributeAdmins->first()->email) {
                $is_https = (config('app.env') === 'production' || str_contains(config('app.url'), 'https://'));
                
                Mail::to($contributeAdmins->first()->email)->send(new NotifyAdminIdHasChanged($report, $new_admin, $last_admin, $is_https));
            }
        } catch (\Throwable $e) {
            Log::error("Gagal memperbarui status laporan: " . $e->getMessage());
            return $this->errorResponse('Gagal memperbarui status laporan karena kesalahan server.', 500);
        }

        $reportStatuses = ReportStatusEnum::cases();

        return $this->successResponse([
            'report' => $report,
            'statuses' => $reportStatuses,
        ]);
    }
}