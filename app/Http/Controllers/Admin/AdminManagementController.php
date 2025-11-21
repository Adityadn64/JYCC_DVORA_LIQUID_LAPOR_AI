<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Enums\RoleAdministratorEnum;
use App\Enums\AdminStatusEnum;
use App\Traits\Controller\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

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

        $totalPending = $query->where('status', AdminStatusEnum::Pending)
                        ->orderBy('full_name', 'asc')
                        ->count();

        // return view('admin.manage', compact('admins', 'filterOptions'));

        return $this->successResponse([
            'admins' => $admins,
            'filterOptions' => $filterOptions,
            'pendingCount' => $totalPending,
        ]);
    }
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

        // Mail::to($admin->email)->send(new AdminPasswordResetLink($token));

        return $this->successResponse([], 'Link reset password (placeholder) telah dikirim ke {$admin->email}.');
    }

    /**
     * POINT 8: Mengambil data untuk Activity Drawer (via Fetch).
     */
    public function showActivity(string $id) // Ubah parameter di sini
    {
        $admin = Administrator::find($id);

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
