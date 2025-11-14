<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Enums\RoleAdministratorEnum;
use App\Enums\AdminStatusEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminManagementController extends Controller
{
    use ApiResponseTrait;

    public function getIndexQuery(Request $request) {
        $query = Administrator::query()->with('serviceProfile');

        // Filter: Keyword
        $query->when($request->filled('keyword'), function ($q) use ($request) {
            $keyword = '%' . $request->keyword . '%';
            $q->where(fn($sub) => $sub->where('full_name', 'like', $keyword)
                ->orWhere('email', 'like', $keyword)
                ->orWhere('phone', 'like', $keyword)
                ->orWhere('nip', 'like', $keyword));
        });

        // Filter: Role
        $query->when($request->filled('role'), fn($q) => $q->where('role', $request->role));

        // Filter: Status
        $query->when($request->filled('status'), fn($q) => $q->where('status', $request->status));

        // Filter: Service (Dinas)
        $query->when($request->filled('service_code'), fn($q) => $q->where('service_code', $request->service_code));

        return $query;
    }

    public function index(Request $request)
    {
        $query = $this->getIndexQuery($request);

        $admins = $query->orderBy('full_name', 'asc')->paginate(15)->withQueryString();

        // Data untuk dropdown filter
        $filterOptions = [
            'roles' => RoleAdministratorEnum::cases(),
            'statuses' => AdminStatusEnum::cases(),
            'services' => ServiceProfile::orderBy('full_name')->get(),
        ];

        // return view('admin.manage', compact('admins', 'filterOptions'));
        
        return $this->successResponse([
            'admins' => $admins,
            'filterOptions' => $filterOptions,
        ]);
    }

    public function pendingPage(Request $request)
    {
        $query = $this->getIndexQuery($request);

        $admins = $query->where('status', AdminStatusEnum::Pending)
                        ->orderBy('full_name', 'asc')
                        ->paginate(15)
                        ->withQueryString();

        // Data untuk dropdown filter
        $filterOptions = [
            'roles' => RoleAdministratorEnum::cases(),
            'services' => ServiceProfile::orderBy('full_name')->get(),
        ];

        // return view('admin.manage-request', compact('admins', 'filterOptions'));
        
        return $this->successResponse([
            'admins' => $admins,
            'filterOptions' => $filterOptions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:administrators,email',
            'phone' => 'required|string|max:20|unique:administrators,phone',
            'nip' => 'required|string|max:50|unique:administrators,nip',
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', Rule::in(RoleAdministratorEnum::cases())],
            'status' => ['required', Rule::in(AdminStatusEnum::cases())],
            'service_code' => ['nullable', Rule::requiredIf($request->role == RoleAdministratorEnum::BaseAdmin->value), 'exists:service_profiles,code'],
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
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('administrators')->ignore($admin->id)],
            'phone' => ['required', 'string', 'max:20', Rule::unique('administrators')->ignore($admin->id)],
            'nip' => ['required', 'string', 'max:50', Rule::unique('administrators')->ignore($admin->id)],
            'role' => ['required', Rule::in(RoleAdministratorEnum::cases())],
            'status' => ['required', Rule::in(AdminStatusEnum::cases())],
            'service_code' => ['nullable', Rule::requiredIf($request->role == RoleAdministratorEnum::BaseAdmin->value), 'exists:service_profiles,code'],
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
    public function toggleStatus(Administrator $admin)
    {
        if ($admin->id === Auth::id()) {
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
    public function sendPasswordReset(Administrator $admin)
    {
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
    public function showActivity(Administrator $admin)
    {
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

    public function accept(Administrator $admin) {
        $admin->update(['status' => AdminStatusEnum::Active->value]);

        // return redirect()->route('admin.manage.request')->with('success', 'Admin berhasil diaktifkan.');

        return $this->successResponse([], 'Admin berhasil diaktifkan.');
    }

    public function reject(Administrator $admin) {
        $admin->delete();

        // return redirect()->route('admin.manage.request')->with('success', 'Admin berhasil dihapus.');
        
        return $this->successResponse([], 'Admin berhasil dihapus.');
    }
}
