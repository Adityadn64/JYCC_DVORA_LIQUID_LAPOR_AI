<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Models\EmailRegistration;
use App\Models\PhoneRegistration;
use App\Enums\RoleAdministratorEnum;
use App\Enums\AdminStatusEnum;
use App\Mail\OtpMail;
use App\Traits\Controller\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RegisterController extends Controller
{
    use ApiResponseTrait;

    public function showRegistrationForm(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $serviceProfiles = ServiceProfile::orderBy('full_name')->get();
        $roles = RoleAdministratorEnum::cases();

        return $this->successResponse([
            'serviceProfiles' => $serviceProfiles,
            'roles' => $roles,
        ]);
    }

    public function startRegistration(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $this->validateRequest($request, [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:administrators',
            'phone' => 'required|string|max:255|unique:administrators',
            'password' => 'required|string|min:8',
            'nip' => 'required|string|unique:administrators',
            'role' => ['required', new Enum(RoleAdministratorEnum::class)],
            'service_code' => 'required_if:role,' . RoleAdministratorEnum::BaseAdmin->value,
            'kta_scan' => 'required|image|mimes:jpeg,png,jpg|max:32768',
        ], [
            'full_name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar.',
            'phone.required' => 'Nomor telepon wajib diisi.',
            'phone.unique' => 'Nomor telepon ini sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal harus 8 karakter.',
            'nip.required' => 'NIP wajib diisi.',
            'nip.unique' => 'NIP ini sudah terdaftar.',
            'role.required' => 'Peran (role) wajib dipilih.',
            'service_code.required_if' => 'Kode layanan wajib diisi untuk peran Base Admin.',
            'kta_scan.required' => 'File scan KTA wajib diunggah.',
            'kta_scan.image' => 'File KTA harus berupa gambar.',
            'kta_scan.mimes' => 'Format KTA harus jpeg, png, atau jpg.',
            'kta_scan.max' => 'Ukuran KTA tidak boleh lebih dari 2MB.',
        ]);

        $ktaPath = $request->file('kta_scan')->store('kta_scans');

        $token = [
            'email' => Str::random(10),
            'phone' => random_int(100000, 999999),
        ];

        if ($request->has('email') && $request->email && $request->has('phone') && $request->phone) {
            $availableAdmin = Administrator::where(function ($query) use ($request) {
                    $query->where('nip', $request->nip)
                        ->orWhere('email', $request->email)
                        ->orWhere('phone', $request->phone);
                })->first();

            if ($availableAdmin) {
                return $this->errorResponse('Data Administrator (NIP/Email/Phone) sudah terdaftar.', 409);
            }
            
            EmailRegistration::updateOrCreate(
                ['email' => $request->email],
                [
                    'token'      => $token['email'],
                    'created_at' => Carbon::now(),
                    'expires_at' => Carbon::now()->addMinutes(15),
                ]
            );

            // try {
                Mail::to($request->email)->send(new OtpMail($token['email'], true));
            // } catch (\Exception $e) {
            //     return $this->errorResponse('Gagal mengirim email reset password. Silakan coba lagi.', 500);
            // }

            PhoneRegistration::updateOrCreate(
                ['phone' => $request->phone],
                [
                    'token'   => $token['phone'],
                    'created_at' => Carbon::now(),
                    'expires_at' => Carbon::now()->addMinutes(15),
                ]
            );

            // try {
                Mail::to($request->email)->send(new OtpMail($token['phone'], false));
            // } catch (\Exception $e) {
            //     return $this->errorResponse('Gagal mengirim email reset password. Silakan coba lagi.', 500);
            // }

            return $this->successResponse(['kta_scan_path' => $ktaPath], 'Token telah dikirim ke email Anda.');
        }

        return $this->errorResponse('Tidak dapat memproses permintaan.', 422);
    }

    public function completeRegistration(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $this->validateRequest($request, [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:administrators',
            'phone' => 'required|string|max:255|unique:administrators',
            'password' => 'required|string|min:8',
            'nip' => 'required|string|unique:administrators',
            'role' => ['required', new Enum(RoleAdministratorEnum::class)],
            'service_code' => 'required_if:role,' . RoleAdministratorEnum::BaseAdmin->value,
            'email_token' => 'required',
            'phone_otp' => 'required|numeric',
            'kta_scan_path' => 'required|string',
        ], [
            'full_name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email ini sudah terdaftar.',
            'phone.required' => 'Nomor telepon wajib diisi.',
            'phone.unique' => 'Nomor telepon ini sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'nip.required' => 'NIP wajib diisi.',
            'nip.unique' => 'NIP ini sudah terdaftar.',
            'role.required' => 'Peran (role) wajib dipilih.',
            'service_code.required_if' => 'Kode layanan wajib diisi untuk peran Base Admin.',
            'email_token.required' => 'Token Email wajib diisi.',
            'phone_otp.required' => 'OTP Telepon wajib diisi.',
            'phone_otp.numeric' => 'OTP Telepon harus berupa angka.',
            'kta_scan_path.required' => 'Jalur file KTA tidak ditemukan. Silakan ulangi proses unggah.',
        ]);

        $emailVerification = EmailRegistration::where('email', $request->email)
                    ->where('token', $request->email_token)
                    ->first();

        $phoneVerification = PhoneRegistration::where('phone', $request->phone)
                    ->where('token', $request->phone_otp)
                    ->first();

        if (!$emailVerification || !$phoneVerification) {
            return $this->errorResponse('Token atau OTP tidak valid.', 404);
        }

        if (Carbon::now()->isAfter($emailVerification->expires_at)) {
            $emailVerification->delete();
            return $this->errorResponse('Token atau OTP sudah kedaluwarsa.', 410);
        }

        if (Carbon::now()->isAfter($phoneVerification->expires_at)) {
            $phoneVerification->delete();
            return $this->errorResponse('Token atau OTP sudah kedaluwarsa.', 410);
        }

        Administrator::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password_hash' => $request->password,
            'nip' => $request->nip,
            'role' => $request->role,
            'service_code' => $request->service_code ?? "DISKOMINFO",
            'kta_scan_path' => $request->kta_scan_path,
            'status' => AdminStatusEnum::Pending,
        ]);

        $emailVerification->delete();
        $phoneVerification->delete();

        return $this->successResponse([], 'Verifikasi berhasil! Akun Anda akan segera ditinjau oleh System Admin.');
    }
}