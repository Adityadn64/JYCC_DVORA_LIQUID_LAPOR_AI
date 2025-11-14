<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Enums\AdminStatusEnum;

class CheckAdminStatus
{
    public function handle(Request $request, Closure $next)
    {
        // Dapatkan user yang sudah diotentikasi oleh Sanctum
        $admin = $request->user('administrators'); // Atau Auth::guard('administrators')->user();

        // Jika middleware auth:sanctum gagal, $admin akan null
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.' // Token tidak valid atau tidak ada
            ], 401);
        }

        // Cek status user
        if ($admin->status !== AdminStatusEnum::Active) {
            // HAPUS TOKEN YANG SEDANG DIGUNAKAN DARI DATABASE
            // Ini adalah cara yang benar untuk "logout" API token
            $admin->currentAccessToken()->delete();

            $errorMessage = 'Sesi Anda telah berakhir karena status akun berubah.';
            if ($admin->status === AdminStatusEnum::Pending) {
                $errorMessage = 'Akun Anda telah dikembalikan ke status peninjauan.';
            } elseif ($admin->status === AdminStatusEnum::Suspended) {
                $errorMessage = 'Akun Anda telah ditangguhkan. Silakan hubungi System Administrator.';
            }

            return response()->json([
                'success' => false,
                'message' => $errorMessage
            ], 403); // 403 Forbidden adalah status yang lebih tepat di sini
        }

        return $next($request);
    }
}