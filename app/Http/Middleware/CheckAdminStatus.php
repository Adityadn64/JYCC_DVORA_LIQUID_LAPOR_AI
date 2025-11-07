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
        $admin = Auth::guard('administrators')->user();

        if ($admin && $admin->status !== AdminStatusEnum::Active) {
            Auth::guard('administrators')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            $errorMessage = 'Sesi Anda telah berakhir.';
            if ($admin->status === AdminStatusEnum::Pending) {
                $errorMessage = 'Akun Anda telah dikembalikan ke status peninjauan.';
            } elseif ($admin->status === AdminStatusEnum::Suspended) {
                $errorMessage = 'Akun Anda telah ditangguhkan. Silakan hubungi System Administrator.';
            }

            return redirect()->route('login')->withErrors(['login_identifier' => $errorMessage]);
        }

        return $next($request);
    }
}