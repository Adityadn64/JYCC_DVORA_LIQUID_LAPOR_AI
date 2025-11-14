<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Enums\RoleAdministratorEnum; // <--- PASTIKAN 'USE' INI BENAR
use Symfony\Component\HttpFoundation\Response;

class CheckSystemAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak ditemukan'
            ], 401);
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
