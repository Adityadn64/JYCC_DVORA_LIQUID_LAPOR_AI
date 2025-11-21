<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\EmailVerification;
use App\Models\PhoneVerification;
use App\Mail\NotifyPasswordReset;
use App\Traits\Controller\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ForgotPasswordController extends Controller
{
    use ApiResponseTrait;

    public function sendResetLink(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $this->validateRequest($request, [
            'email' => 'nullable|required_without:phone|string|email|max:255|exists:administrators,email',
            'phone' => 'nullable|required_without:email|string|max:255|exists:administrators,phone',
            'nip'   => 'required|string|exists:administrators,nip',
        ], [
            'email.exists' => 'Email tidak terdaftar.',
            'phone.exists' => 'Nomor telepon tidak terdaftar.',
            'nip.exists' => 'NIP tidak terdaftar.',
        ]);

        $admin = Administrator::where('nip', $request->nip)
            ->when($request->email, function ($query) use ($request) {
                return $query->where('email', $request->email);
            })
            ->when($request->phone, function ($query) use ($request) {
                return $query->where('phone', $request->phone);
            })
            ->first();

        if (!$admin) {
            return $this->errorResponse("Kredensial tidak valid. Pastikan NIP cocok dengan email/telepon yang terdaftar.", 401);
        }

        // if ($admin->status !== AdminS)

        $token = $request->has('email') && $admin->email
            ? Str::random(10)
            : random_int(100000, 999999);

        if ($request->has('email') && $admin->email) {
            EmailVerification::updateOrCreate(
                ['email' => $admin->email],
                [
                    'token'      => $token,
                    'created_at' => Carbon::now(),
                    'expires_at' => Carbon::now()->addMinutes(15),
                ]
            );

            // try {
                Mail::to($admin->email)->send(new NotifyPasswordReset($token, true));
            // } catch (\Exception $e) {
            //     return $this->errorResponse('Gagal mengirim email reset password. Silakan coba lagi.', 500);
            // }

            return $this->successResponse(null, 'Token telah dikirim ke email Anda.');
        }

        if ($request->has('phone') && $admin->phone) {
            PhoneVerification::updateOrCreate(
                ['phone' => $admin->phone],
                [
                    'token'   => $token,
                    'created_at' => Carbon::now(),
                    'expires_at' => Carbon::now()->addMinutes(15),
                ]
            );

            // try {
                $fakeEmail = (Str::replace('+', '', trim($request->phone)) ?? "number0123456789") . "@phone.id";
                Mail::to($fakeEmail)->send(new NotifyPasswordReset($token, false));
            // } catch (\Exception $e) {
            //     return $this->errorResponse('Gagal mengirim email reset password. Silakan coba lagi.', 500);
            // }

            return $this->successResponse(null, 'Kode OTP telah dikirim ke nomor telepon Anda.');
        }

        return $this->errorResponse('Tidak dapat memproses permintaan.', 422);
    }

    public function verifyToken(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $this->validateRequest($request, [
            'email' => 'nullable|required_without:phone|string|email|max:255|exists:administrators,email',
            'phone' => 'nullable|required_without:email|string|max:255|exists:administrators,phone',
            'token' => 'required|string',
        ], [
            'email.required_without' => 'Email atau nomor telepon wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.exists' => 'Email yang Anda masukkan tidak terdaftar.',
            'phone.required_without' => 'Email atau nomor telepon wajib diisi.',
            'phone.exists' => 'Nomor telepon yang Anda masukkan tidak terdaftar.',
            'token.required' => 'Token verifikasi wajib diisi.',
        ]);

        $verification = null;

        if ($request->has('email') && $request->email) {
            $verification = EmailVerification::where('email', $request->email)
                ->where('token', $request->token)
                ->first();
        } 
        // Cek verifikasi telepon
        elseif ($request->has('phone') && $request->phone) {
            $verification = PhoneVerification::where('phone', $request->phone)
                ->where('token', $request->token)
                ->first();
        }

        if (!$verification) {
            return $this->errorResponse('Token atau OTP tidak valid.', 404);
        }

        if (Carbon::now()->isAfter($verification->expires_at)) {
            $verification->delete();
            return $this->errorResponse('Token atau OTP sudah kedaluwarsa.', 410);
        }

        // Jika valid, kirim respons sukses
        return $this->successResponse(null, 'Verifikasi berhasil. Silakan atur password baru Anda.');
    }

    public function resetPassword(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $this->validateRequest($request, [
            'email' => 'nullable|required_without:phone|string|email|max:255|exists:administrators,email',
            'phone' => 'nullable|required_without:email|string|max:255|exists:administrators,phone',
            'password' => 'required|min:8',
            'token' => 'required|string',
        ], [
            'email.exists' => 'Email yang Anda masukkan tidak terdaftar.',
            'phone.exists' => 'Nomor telepon yang Anda masukkan tidak terdaftar.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password minimal harus 8 karakter.',
            'token.required' => 'Token verifikasi wajib diisi.',
        ]);

        $verification = null;
        if ($request->has('email') && $request->email) {
            $verification = EmailVerification::where('email', $request->email)->where('token', $request->token)->first();
        } elseif ($request->has('phone') && $request->phone) {
            $verification = PhoneVerification::where('phone', $request->phone)->where('token', $request->token)->first();
        }

        if (!$verification || Carbon::now()->isAfter($verification->expires_at)) {
            return $this->errorResponse('Token tidak valid atau sudah kedaluwarsa.', 401);
        }

        $identifier = $request->email ?? $request->phone;
        $field = $request->email ? 'email' : 'phone';
        $admin = Administrator::where($field, $identifier)->first();

        if (!$admin) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        $admin->update([
            'password_hash' => Hash::make($request->password),
        ]);

        $verification->delete();

        return $this->successResponse(null, 'Password Anda telah berhasil direset.');
    }
}