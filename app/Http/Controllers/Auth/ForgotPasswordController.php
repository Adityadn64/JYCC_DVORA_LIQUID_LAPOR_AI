<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use App\Models\Administrator;

class ForgotPasswordController extends Controller
{
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

        return response()->json([
            'success' => Password::RESET_LINK_SENT,
            'data' => [
                'status' => __($status),
            ]
        ]);
    }

    public function showResetForm(Request $request, $token = null)
    {
        // return view('auth.passwords.reset')->with(
        //     ['token' => $token, 'email' => $request->email]
        // );

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'email' => $request->email,
            ],
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

        return response()->json([
            'success' => Password::PASSWORD_RESET,
            'data' => [
                'status' => __($status),
            ],
        ]);
    }
}