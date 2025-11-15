<?php

namespace App\Http\Middleware;

use App\Enums\RoleAdministratorEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
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
        $authorizationHeader = $request->header('Authorization');

        if (!$authorizationHeader || !str_starts_with(strtolower($authorizationHeader), 'bearer ')) {
            // Jika header tidak ada atau formatnya salah
            return $this->errorResponse('Unauthenticated. Token format is invalid.', 401);
        }

        $token = substr($authorizationHeader, 7);

        $accessToken = PersonalAccessToken::findToken($token);

        if (
            !$accessToken ||
            !$accessToken->tokenable instanceof Administrator ||
            $accessToken->expires_at && $accessToken->expires_at->isPast()
        ) {
            return $this->errorResponse('Unauthenticated. Token is invalid or expired.', 401);
        }

        $admin = $accessToken->tokenable;

        if ($admin->role !== RoleAdministratorEnum::SystemAdmin) {
            return $this->errorResponse(
                'Access Denied. Hanya System Admin yang dapat mengakses sumber daya ini.',
                403
            );
        }

        return $next($request);
    }
}
