<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Enums\AdminStatusEnum;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    use ApiResponseTrait;

    public function login(Request $request)
    {
        $request->validate([
            'login_identifier' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginIdentifier = $request->input('login_identifier');
        $password = $request->input('password');

        $admin = Administrator::where('email', $loginIdentifier)
                                ->orWhere('phone', $loginIdentifier)
                                ->orWhere('nip', $loginIdentifier)
                                ->first();

        if (!$admin || !Hash::check($password, $admin->password_hash)) {
            // return back()->withErrors([
            //     'login_identifier' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
            // ])->onlyInput('login_identifier');

            return $this->errorResponse('Kredensial yang diberikan tidak cocok dengan data kami.', 400);
        }

        if ($admin->status === AdminStatusEnum::Pending) {
            // return back()->withErrors([
            //     'login_identifier' => 'Akun Anda sedang dalam proses peninjauan. Silakan coba lagi nanti.',
            // ])->onlyInput('login_identifier');

            return $this->errorResponse('Akun Anda sedang dalam proses peninjauan. Silakan coba lagi nanti.', 403);
        }

        if ($admin->status === AdminStatusEnum::Suspended) {
            // return back()->withErrors([
            //     'login_identifier' => 'Akun Anda telah ditangguhkan. Silakan hubungi System Administrator.',
            // ])->onlyInput('login_identifier');
            
            return $this->errorResponse('Akun Anda telah ditangguhkan. Silakan hubungi System Administrator.', 403);
        }

        Auth::guard('administrators')->login($admin, $request->boolean('remember'));
        $request->session()->regenerate();

        $admin->tokens()->delete();
        $token = $admin->createToken('admin-token')->plainTextToken;

        // return redirect()->intended(route('admin.dashboard'));

        return $this->successResponse([
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $admin = $request->user('administrators');

        if ($admin) {
            $admin->currentAccessToken()->delete();
        }
        
        return $this->successResponse([], 'Logout berhasil.');
    }
}