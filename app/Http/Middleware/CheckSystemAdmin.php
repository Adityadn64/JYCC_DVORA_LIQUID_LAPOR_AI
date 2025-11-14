<?php

namespace App\Http\Middleware;

use App\Enums\RoleAdministratorEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class CheckSystemAdmin
{
    use ApiResponseTrait;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return $this->errorResponse('Token tidak ditemukan', 401);
        }

        // Gunakan guard 'administrators' yang benar
        if (
            Auth::guard('administrators')->guest() ||
            Auth::guard('administrators')->user()->role !== RoleAdministratorEnum::SystemAdmin // <--- PASTIKAN LOGIKA INI BENAR
        ) {
            abort(403, 'Hanya System Admin yang dapat mengakses halaman ini.');
        }

        return $next($request);
    }
}
