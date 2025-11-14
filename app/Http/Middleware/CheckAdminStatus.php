<?php

namespace App\Http\Middleware;

use App\Enums\AdminStatusEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Closure;

class CheckAdminStatus
{
    use ApiResponseTrait;

    public function handle(Request $request, Closure $next)
    {
        // Dapatkan user yang sudah diotentikasi oleh Sanctum
        $admin = $request->user('administrators'); // Atau Auth::guard('administrators')->user();

        // Jika middleware auth:sanctum gagal, $admin akan null
        if (!$admin) {
            return $this->errorResponse('Unauthenticated.', 401);
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

            return $this->errorResponse($errorMessage, 403); // 403 Forbidden adalah status yang lebih tepat di sini
        }

        return $next($request);
    }
}