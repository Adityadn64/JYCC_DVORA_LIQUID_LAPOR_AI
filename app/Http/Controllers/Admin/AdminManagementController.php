<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Enums\RoleAdministratorEnum;
use App\Enums\AdminStatusEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminManagementController extends Controller
{
    use ApiResponseTrait;

    private function getIndexQuery(Request $request) {
        $query = Administrator::query()->with('serviceProfile');

        // Filter: Keyword
        $query->when($request->keyword ?? null, function ($q) use ($request) {
            $keyword = '%' . $request->keyword . '%';
            $q->where(fn($sub) => $sub->where('full_name', 'like', $keyword)
                ->orWhere('email', 'like', $keyword)
                ->orWhere('phone', 'like', $keyword)
                ->orWhere('nip', 'like', $keyword));
        });

        // Filter: Role
        $query->when($request->role ?? null, fn($q) => $q->where('role', $request->role));

        // Filter: Status
        $query->when($request->status ?? null, fn($q) => $q->where('status', $request->status));

        // Filter: Service (Dinas)
        $query->when($request->service_code ?? null, fn($q) => $q->where('service_code', $request->service_code));

        return $query;
    }

    public function index(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $query = $this->getIndexQuery($request);

        $currentPage = $request->input('page', 1);
        
        LengthAwarePaginator::currentPageResolver(function () use ($currentPage) {
            return $currentPage;
        });

        $isPending = $request->pending === true;

        $admins = $isPending
            ? $query->where('status', AdminStatusEnum::Pending)
                        ->orderBy('full_name', 'asc')
                        ->paginate(20)
                        ->withQueryString()
            : $query->orderBy('full_name', 'asc')->paginate(20)->withQueryString();

        // Data untuk dropdown filter
        $filterOptions = [
            'roles' => array_map(function($enumCase) {
                return [
                    'name' => $enumCase->name,
                    'value' => $enumCase->value,
                ];
            }, RoleAdministratorEnum::cases()),
            
            'statuses' => array_map(function($enumCase) {
                return [
                    'name' => $enumCase->name,
                    'value' => $enumCase->value,
                ];
            }, AdminStatusEnum::cases()),

            'services' => ServiceProfile::orderBy('full_name')->get(),
        ];

        // return view('admin.manage', compact('admins', 'filterOptions'));

        return $this->successResponse([
            'admins' => $admins,
            'filterOptions' => $filterOptions,
        ]);
    }

    public function store(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $validated = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:administrators,email',
            'phone' => 'required|string|max:20|unique:administrators,phone',
            'nip' => 'required|string|max:50|unique:administrators,nip',
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', Rule::in(RoleAdministratorEnum::cases())],
            'status' => ['required', Rule::in(AdminStatusEnum::cases())],
            'service_code' => ['nullable', Rule::requiredIf($request->role == RoleAdministratorEnum::BaseAdmin->value), 'exists:service_profiles,code'],
        ])->validate();

        $request->validate([
            'profile_picture' => 'nullable|image|max:2048',
            'kta_scan' => 'nullable|file|mimes:pdf,jpg,png|max:5120',
        ]);

        $validated['password_hash'] = Hash::make($validated['password']);

        if ($request->hasFile('profile_picture')) {
            $validated['profile_picture_path'] = $request->file('profile_picture')->store('profile_pictures', 'public');
        }
        if ($request->hasFile('kta_scan')) {
            $validated['kta_scan_path'] = $request->file('kta_scan')->store('kta_scans', 'public');
        }

        // Pastikan System Admin tidak punya service code
        if ($validated['role'] == RoleAdministratorEnum::SystemAdmin->value) {
            $validated['service_code'] = null;
        }

        Administrator::create($validated);

        // return redirect()->route('admin.manage.index')->with('success', 'Admin baru berhasil dibuat.');

        return $this->successResponse([], 'Admin baru berhasil dibuat.');
    }

    /**
     * POINT 4: Memperbarui admin.
     */
    public function update(Request $request, Administrator $admin)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $validated = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('administrators')->ignore($admin->id)],
            'phone' => ['required', 'string', 'max:20', Rule::unique('administrators')->ignore($admin->id)],
            'nip' => ['required', 'string', 'max:50', Rule::unique('administrators')->ignore($admin->id)],
            'role' => ['required', Rule::in(RoleAdministratorEnum::cases())],
            'status' => ['required', Rule::in(AdminStatusEnum::cases())],
            'service_code' => ['nullable', Rule::requiredIf($request->role == RoleAdministratorEnum::BaseAdmin->value), 'exists:service_profiles,code'],
        ])->validate();

        $request->validate([
            'profile_picture' => 'nullable|image|max:2048',
            'kta_scan' => 'nullable|file|mimes:pdf,jpg,png|max:5120',
        ]);

        if ($request->hasFile('profile_picture')) {
            if ($admin->profile_picture_path) Storage::disk('public')->delete($admin->profile_picture_path);
            $validated['profile_picture_path'] = $request->file('profile_picture')->store('profile_pictures', 'public');
        }
        if ($request->hasFile('kta_scan')) {
            if ($admin->kta_scan_path) Storage::disk('public')->delete($admin->kta_scan_path);
            $validated['kta_scan_path'] = $request->file('kta_scan')->store('kta_scans', 'public');
        }

        // Pastikan System Admin tidak punya service code
        if ($validated['role'] == RoleAdministratorEnum::SystemAdmin->value) {
            $validated['service_code'] = null;
        }

        $admin->update($validated);

        // return redirect()->route('admin.manage.index')->with('success', 'Data admin berhasil diperbarui.');

        return $this->successResponse([], 'Data admin berhasil diperbarui.');
    }

    /**
     * POINT 6: Mengubah status (Aktif/Nonaktif).
     */
    public function toggleStatus(Request $request, Administrator $admin)
    {
        $request = $this->decodeRequest($request);

        if ($admin->id === request()->user()->id) {
            // return back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');

            return $this->errorResponse('Anda tidak dapat menonaktifkan akun Anda sendiri.', 400);
        }

        $newStatus = ($admin->status === AdminStatusEnum::Active) ? AdminStatusEnum::Suspended : AdminStatusEnum::Active;
        $admin->update(['status' => $newStatus]);

        // return redirect()->route('admin.manage.index')->with('success', 'Status admin berhasil diubah.');

        return $this->successResponse([], 'Status admin berhasil diubah.');
    }

    /**
     * POINT 5: Mengirim reset password.
     */
    public function sendPasswordReset(Request $request, Administrator $admin)
    {
        $request = $this->decodeRequest($request);

        // Di aplikasi nyata, ini akan men-trigger Mailable dengan signed link.
        // Untuk saat ini, kita hanya log sebagai placeholder.

        // $token = app('auth.password.broker')->createToken($admin);
        // Mail::to($admin->email)->send(new AdminPasswordResetLink($token));

        Log::info("System Admin memicu reset password untuk: {$admin->email}");

        // return redirect()->route('admin.manage.index')->with('success', "Link reset password (placeholder) telah dikirim ke {$admin->email}.");

        return $this->successResponse([], 'Link reset password (placeholder) telah dikirim ke {$admin->email}.');
    }

    /**
     * POINT 8: Mengambil data untuk Activity Drawer (via Fetch).
     */
    public function showActivity(Request $request, Administrator $admin)
    {
        $request = $this->decodeRequest($request);

        $admin->load('serviceProfile');
        $recentReports = $admin->assignedReports()
            ->orderBy('updated_at', 'desc')
            ->take(10)
            ->get(['id', 'title', 'updated_at', 'statuses']);

        return $this->successResponse([
            'admin' => $admin,
            'recent_reports' => $recentReports,
        ]);
    }

    public function accept(Request $request, Administrator $admin) {
        $request = $this->decodeRequest($request);

        $admin->update(['status' => AdminStatusEnum::Active->value]);

        // return redirect()->route('admin.manage.request')->with('success', 'Admin berhasil diaktifkan.');

        return $this->successResponse([], 'Admin berhasil diaktifkan.');
    }

    public function reject(Request $request, Administrator $admin) {
        $request = $this->decodeRequest($request);

        $admin->delete();

        // return redirect()->route('admin.manage.request')->with('success', 'Admin berhasil dihapus.');

        return $this->successResponse([], 'Admin berhasil dihapus.');
    }
}
