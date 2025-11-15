<?php

namespace App\Http\Middleware;

use App\Enums\AdminStatusEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Closure;
use Laravel\Sanctum\PersonalAccessToken;

class CheckAdminStatus
{
    use ApiResponseTrait;

    public function handle(Request $request, Closure $next)
    {
        $authorizationHeader = $request->header('Authorization');

        if (!$authorizationHeader || !str_starts_with(strtolower($authorizationHeader), 'bearer ')) {
            // Jika header tidak ada atau formatnya salah
            return $this->errorResponse('Unauthenticated. Token format is invalid.', 401);
        }

        $token = substr($authorizationHeader, 7);

        $accessToken = PersonalAccessToken::findToken($token);

        if (
            !$accessToken ||
            $accessToken->expires_at && $accessToken->expires_at->isPast()
        ) {
            return $this->errorResponse('Unauthenticated. Token is invalid or expired.', 401);
        }

        $admin = $accessToken->tokenable;

        // Cek status user
        if ($admin->status !== AdminStatusEnum::Active) {
            $accessToken->delete();

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