<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Administrator;
use Illuminate\Support\Facades\Hash;
use App\Enums\AdminStatusEnum;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

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
            return back()->withErrors([
                'login_identifier' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
            ])->onlyInput('login_identifier');
        }

        if ($admin->status === AdminStatusEnum::Pending) {
            return back()->withErrors([
                'login_identifier' => 'Akun Anda sedang dalam proses peninjauan. Silakan coba lagi nanti.',
            ])->onlyInput('login_identifier');
        }

        if ($admin->status === AdminStatusEnum::Suspended) {
            return back()->withErrors([
                'login_identifier' => 'Akun Anda telah ditangguhkan. Silakan hubungi System Administrator.',
            ])->onlyInput('login_identifier');
        }

        Auth::guard('administrators')->login($admin, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::guard('administrators')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}