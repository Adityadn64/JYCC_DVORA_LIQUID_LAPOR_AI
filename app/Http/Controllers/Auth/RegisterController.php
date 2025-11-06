<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Models\EmailRegistration;
use App\Models\PhoneRegistration; 
use App\Enums\RoleAdministratorEnum;
use App\Enums\AdminStatusEnum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\Rules\Enum;
use App\Mail\OtpMail;
use App\Time\Time;
use Twilio\Rest\Client;
use Illuminate\Support\Facades\Mail;

class RegisterController extends Controller
{
    public function showRegistrationForm()
    {
        $serviceProfiles = ServiceProfile::orderBy('full_name')->get();
        $roles = RoleAdministratorEnum::cases();
        return view('auth.register', compact('serviceProfiles', 'roles'));
    }

    public function startRegistration(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:administrators',
            'phone' => 'required|string|max:255|unique:administrators',
            'password' => 'required|string|min:8|confirmed',
            'nip' => 'required|string|unique:administrators',
            'role' => ['required', new Enum(RoleAdministratorEnum::class)],
            'service_code' => 'required_if:role,' . RoleAdministratorEnum::BaseAdmin->value, 
            'kta_scan' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);
        
        $ktaPath = $request->file('kta_scan')->store('kta_scans', 'public');

        $request->session()->put('registration_data', [
            'full_name' => $request->full_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'nip' => $request->nip,
            'role' => $request->role,
            'service_code' => $request->role == RoleAdministratorEnum::BaseAdmin->value ? $request->service_code : null,
            'kta_scan_path' => $ktaPath,
        ]);

        EmailRegistration::where('email', $request->email)->delete();
        PhoneRegistration::where('phone', $request->phone)->delete();

        $emailOtp = rand(100000, 999999);
        $phoneOtp = rand(100000, 999999);

        EmailRegistration::create([
            'email' => $request->email,
            'token' => Hash::make($emailOtp),
            'expires_at' => Time::getNow()->addMinutes(10),
        ]);

        PhoneRegistration::create([
            'phone' => $request->phone,
            'otp_code' => Hash::make($phoneOtp),
            'expires_at' => Time::getNow()->addMinutes(10),
        ]);
        
        Mail::to($request->email)->send(new OtpMail($emailOtp));
        // SMSService::send($request->phone, "Kode OTP Anda: $phoneOtp");

        $sid = env("TWILIO_ACCOUNT_SID");
        $token = env("TWILIO_AUTH_TOKEN");

        $message = `
Lapor.ai Registrasi
Konfirmasi Akun Anda
Gunakan kode di bawah ini untuk menyelesaikan proses registrasi Anda. Kode ini hanya valid untuk waktu yang terbatas.

$phoneOtp

Kode ini akan kedaluwarsa dalam 10 menit.

Peringatan Keamanan
Jika Anda tidak merasa meminta kode ini, harap abaikan email ini. Jangan pernah membagikan kode verifikasi Anda kepada siapa pun.
`;

        $client = new Client($sid, $token);
        $client->messages->create($request->phone, [
            'body' => $message,
        ]);
        
        return redirect()->route('register.verify.form');
    }

    public function showVerificationForm()
    {
        if (!Session::has('registration_data')) {
            return redirect()->route('register');
        }

        $email = Session::get('registration_data')['email'];
        $phone = Session::get('registration_data')['phone'];

        return view('auth.verify', compact('email', 'phone'));
    }

    public function completeRegistration(Request $request)
    {
        $registrationData = $request->session()->get('registration_data');
        if (!$registrationData) {
            return redirect()->route('register')->withErrors('Sesi registrasi Anda telah berakhir, silakan ulangi.');
        }

        $request->validate([
            'email_otp' => 'required|numeric',
            'phone_otp' => 'required|numeric',
        ]);

        $emailTokenRecord = EmailRegistration::where('email', $registrationData['email'])->first();
        $phoneOtpRecord = PhoneRegistration::where('phone', $registrationData['phone'])->first();

        if (
            !$emailTokenRecord || !$phoneOtpRecord ||
            $emailTokenRecord->expires_at < Time::getNow() ||
            $phoneOtpRecord->expires_at < Time::getNow() ||
            !Hash::check($request->email_otp, $emailTokenRecord->token) ||
            !Hash::check($request->phone_otp, $phoneOtpRecord->otp_code)
        ) {
            return back()->withErrors(['otp' => 'Salah satu atau kedua kode OTP tidak valid atau telah kedaluwarsa.']);
        }

        Administrator::create([
            'full_name' => $registrationData['full_name'],
            'email' => $registrationData['email'],
            'phone' => $registrationData['phone'],
            'password_hash' => $registrationData['password'],
            'nip' => $registrationData['nip'],
            'role' => $registrationData['role'],
            'service_code' => $registrationData['service_code'],
            'kta_scan_path' => $registrationData['kta_scan_path'],
            'status' => AdminStatusEnum::Pending,
        ]);

        $emailTokenRecord->delete();
        $phoneOtpRecord->delete();

        $request->session()->forget('registration_data');

        return redirect()->route('login')->with('success', 'Verifikasi berhasil! Akun Anda akan segera ditinjau oleh System Admin.');
    }
}