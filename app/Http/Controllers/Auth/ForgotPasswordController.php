<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class ForgotPasswordController extends Controller
{
    use ApiResponseTrait;

    public function sendResetLinkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'nip' => 'required|string',
        ]);

        $admin = Administrator::where('email', $request->email)
                               ->where('nip', $request->nip)
                               ->first();
        
        if (!$admin) {
            return back()->withErrors(['email' => 'Email atau NIP tidak cocok.']);
        }

        $status = Password::broker('administrators')->sendResetLink(
            $request->only('email')
        );

        // return $status == Password::RESET_LINK_SENT
        //             ? back()->with('status', __($status))
        //             : back()->withErrors(['email' => __($status)]);

        return $this->successResponse([
            'status' => __($status),
        ]);
    }

    public function showResetForm(Request $request, $token = null)
    {
        // return view('auth.passwords.reset')->with(
        //     ['token' => $token, 'email' => $request->email]
        // );

        return $this->successResponse([
            'token' => $token,
            'email' => $request->email,
        ]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        $status = Password::broker('administrators')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password_hash' => \Illuminate\Support\Facades\Hash::make($password)
                ])->save();
            }
        );

        // return $status == Password::PASSWORD_RESET
        //             ? redirect()->route('login')->with('status', __($status))
        //             : back()->withInput($request->only('email'))
        //                    ->withErrors(['email' => __($status)]);

        return $this->successResponse([
            'status' => __($status),
        ]);
    }
}