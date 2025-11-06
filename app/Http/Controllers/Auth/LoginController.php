<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

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

        $loginType = filter_var($request->input('login_identifier'), FILTER_VALIDATE_EMAIL) 
            ? 'email' 
            : (is_numeric($request->input('login_identifier')) ? 'phone' : 'nip');

        $credentials = [
            $loginType => $request->input('login_identifier'),
            'password' => $request->input('password'),
        ];
        
        if ($loginType == 'nip') {
            $loginType = 'nip';
            $credentials = [
                'nip' => $request->input('login_identifier'),
                'password' => $request->input('password'),
            ];
        }

        if (Auth::guard('administrators')->attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            return redirect()->intended(route('admin.dashboard'));
        }

        return back()->withErrors([
            'login_identifier' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
        ])->onlyInput('login_identifier');
    }

    public function logout(Request $request)
    {
        Auth::guard('administrators')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}