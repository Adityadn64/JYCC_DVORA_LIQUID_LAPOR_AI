<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminStatusEnum;
use App\Http\Controllers\Controller;
use App\Enums\ReportStatusEnum;
use App\Enums\RoleAdministratorEnum;
use App\Mail\NotifyChangeEmailPhone;
use App\Models\EmailRegistration;
use App\Models\PhoneRegistration;
use App\Traits\Controller\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    use ApiResponseTrait;

    public function verify(Request $request)
    {
        /** @var Request $request */
        // Decode request
        $request = $this->decodeRequest($request);
        return $this->successResponse(['user' => Auth::user()]);
    }

    public function getAdminAndActivity() {
        $admin = Auth::user();
        $admin->load('serviceProfile');

        $activity = $this->getAdminActivity($admin);

        return [$admin, $activity];
    }

    public function show(Request $request)
    {
        $request = $this->decodeRequest($request);

        [$admin, $activity] = $this->getAdminAndActivity();

        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $admin->activity = $activity;
        }

        return $this->successResponse([
            'admin' => $admin,
        ]);
    }

    private function getAdminActivity($admin)
    {
        $statusFinished = ReportStatusEnum::Finished->value;

        $assignedReports = $admin->assignedReports();
        $finishedReportsQuery = $admin->assignedReports()
            ->whereRaw("statuses->>(jsonb_array_length(statuses) - 1) = ?", [$statusFinished]);

        $avgHours = (clone $finishedReportsQuery)
            ->select(DB::raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 as avg_hours'))
            ->value('avg_hours');

        return (object) [
            'total_assigned' => $assignedReports->count(),
            'total_finished' => $finishedReportsQuery->count(),
            'avg_resolution_time' => $avgHours ? number_format($avgHours, 1) . ' Jam' : 'N/A',
            'recent_reports' => $assignedReports->orderBy('updated_at', 'desc')->take(5)->get(),
        ];
    }

    public function updateFullName(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'full_name' => 'required|string|max:255',
        ], [
            'full_name.required' => 'Nama lengkap wajib diisi.',
            'full_name.string' => 'Nama lengkap harus berupa teks.',
            'full_name.max' => 'Nama lengkap tidak boleh lebih dari 255 karakter.',
        ]);

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        $admin->update(['full_name' => $request->full_name]);

        return $this->successResponse([], 'Nama lengkap berhasil diperbarui.');
    }

    public function updateNip(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'nip' => 'required|string|min:10|max:100|unique:administrators,nip,' . $admin->id,
        ], [
            'nip.required' => 'NIP wajib diisi.',
            'nip.string' => 'NIP harus berupa teks.',
            'nip.min' => 'NIP minimal harus 10 karakter.',
            'nip.max' => 'NIP tidak boleh lebih dari 100 karakter.',
            'nip.unique' => 'NIP ini sudah digunakan oleh akun lain.',
        ]);

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        $admin->update(['nip' => $request->nip]);

        return $this->successResponse([], 'NIP berhasil diperbarui.');
    }

    public function updateProfilePicture(Request $request)
    {
        $this->validateRequest($request, [
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg|max:32768',
            'password' => 'required|string|min:8',
        ], [
            'profile_picture.required' => 'File foto profil wajib diunggah.',
            'profile_picture.image' => 'File yang diunggah harus berupa gambar.',
            'profile_picture.mimes' => 'Format foto profil harus jpeg, png, atau jpg.',
            'profile_picture.max' => 'Ukuran foto profil tidak boleh lebih dari 2MB.',
            'password.required' => 'Password baru wajib diisi.',
            'password.string' => 'Password harus berupa teks.',
            'password.min' => 'Password minimal harus 8 karakter.',
        ]);

        $admin = Auth::user();

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        $disk = config('filesystems.default');
        $is_local = in_array($disk, ['local', 'public']);
        $storage = $is_local ? Storage::disk("local") : Storage::disk($disk);
        $folderPath = ($is_local ? '' : 'public/') . 'real/profile_picture';

        $storage->delete(substr($admin->profile_picture_path, 3));

        $ktaScan = $request->profile_picture;

        $path = $storage->put($folderPath, $ktaScan, 'public');
        /** @disregard P1013 */
        $path = 'pi/' . ($is_local ? $path : base64_encode(($path)));
        
        $admin->update(['profile_picture_path' => $path]);

        return $this->successResponse([], 'Foto profil berhasil diperbarui.');
    }
    
    public function updateKtaScan(Request $request)
    {
        $this->validateRequest($request, [
            'kta_scan' => 'required|file|mimetypes:application/pdf,image/jpeg,image/png|max:5120',
            'password' => 'required|string|min:8',
        ], [
            'kta_scan.required' => 'File scan KTA wajib diunggah.',
            'kta_scan.file' => 'Scan KTA harus berupa file.',
            'kta_scan.mimes' => 'Format file harus pdf, jpg, atau png.',
            'kta_scan.max' => 'Ukuran file tidak boleh lebih dari 5MB.',
            'password.required' => 'Password baru wajib diisi.',
            'password.string' => 'Password harus berupa teks.',
            'password.min' => 'Password minimal harus 8 karakter.',
        ]);

        $admin = Auth::user();

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        $disk = config('filesystems.default');
        $is_local = in_array($disk, ['local', 'public']);
        $storage = $is_local ? Storage::disk("local") : Storage::disk($disk);
        $folderPath = ($is_local ? '' : 'public/') . 'real/kta_scan';

        $storage->delete(substr($admin->kta_scan_path, 3));

        $ktaScan = $request->kta_scan;

        $path = $storage->put($folderPath, $ktaScan, 'public');
        /** @disregard P1013 */
        $path = 'pi/' . ($is_local ? $path : base64_encode(($path)));
        
        $admin->update(['kta_scan_path' => $path]);

        return $this->successResponse([], 'Scan KTA berhasil diunggah.');
    }

    public function updatePassword(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'password' => 'required|string|min:8',
            'logout_other_devices' => 'nullable|boolean',
        ], [
            'password.required' => 'Password baru wajib diisi.',
            'password.string' => 'Password harus berupa teks.',
            'password.min' => 'Password minimal harus 8 karakter.',
        ]);

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        // Update password
        $admin->update([
            'password_hash' => Hash::make($request->password),
        ]);

        if ($request->logout_other_devices ?? false) {
            // Auth::logoutOtherDevices($request->password);
        }

        return $this->successResponse([], 'Password berhasil diubah.');
    }

    public function checkPassword(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'password' => 'required|string|min:8',
        ], [
            'password.required' => 'Password baru wajib diisi.',
            'password.string' => 'Password harus berupa teks.',
            'password.min' => 'Password minimal harus 8 karakter.',
        ]);

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        return $this->successResponse([]);
    }

    public function requestEmailChange(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'new_email' => 'required|email|max:255|unique:administrators,email',
        ], [
            'new_email.required' => 'Alamat email baru wajib diisi.',
            'new_email.email' => 'Format alamat email tidak valid.',
            'new_email.max' => 'Alamat email tidak boleh lebih dari 255 karakter.',
            'new_email.unique' => 'Alamat email ini sudah terdaftar.',
        ]);

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        $newEmail = $request->new_email;
        $token = Str::random(10);

        EmailRegistration::updateOrCreate(
            ['email' => $newEmail],
            [
                'token'      => $token,
                'created_at' => Carbon::now(),
                'expires_at' => Carbon::now()->addMinutes(15),
            ]
        );

        Mail::to($newEmail)->send(new NotifyChangeEmailPhone($token, true));

        return $this->successResponse([], 'OTP telah dikirim ke alamat email baru Anda.');
    }

    public function verifyEmailChange(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();
        
        $this->validateRequest($request, [
            'new_email' => 'required|email|max:255|unique:administrators,email',
            'token' => 'required',
        ], [
            'new_email.required' => 'Alamat email baru wajib diisi.',
            'new_email.email' => 'Format alamat email tidak valid.',
            'new_email.max' => 'Alamat email tidak boleh lebih dari 255 karakter.',
            'new_email.unique' => 'Alamat email ini sudah terdaftar.',
            'token.required' => 'Token wajib diisi.',
        ]);

        $newEmail = $request->new_email;

        $emailVerification = EmailRegistration::where('email', $newEmail)
                    ->where('token', $request->token)
                    ->first();

        if (!$emailVerification) {
            return $this->errorResponse('Token atau OTP tidak valid.', 404);
        }

        if (Carbon::now()->isAfter($emailVerification->expires_at)) {
            $emailVerification->delete();
            return $this->errorResponse('Token atau OTP sudah kedaluwarsa.', 410);
        }

        $admin->update(['email' => $newEmail]);

        $emailVerification->delete();

        return $this->successResponse([], 'Alamat email Anda berhasil diperbarui.');
    }

    public function requestPhoneChange(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'new_phone' => 'required|string|max:20|unique:administrators,phone',
        ], [
            'new_phone.required' => 'Nomor telepon baru wajib diisi.',
            'new_phone.string' => 'Nomor telepon harus berupa teks.',
            'new_phone.max' => 'Nomor telepon tidak boleh lebih dari 20 karakter.',
            'new_phone.unique' => 'Nomor telepon ini sudah terdaftar.',
        ]);

        if (!Hash::check($request->password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        $newPhone = $request->new_phone;
        $otp = random_int(100000, 999999);

        PhoneRegistration::updateOrCreate(
            ['phone' => $newPhone],
            [
                'token'      => $otp,
                'created_at' => Carbon::now(),
                'expires_at' => Carbon::now()->addMinutes(15),
            ]
        );

        $fakeEmail = (Str::replace('+', '', trim($newPhone)) ?? "number0123456789") . "@phone.id";
        Mail::to($fakeEmail)->send(new NotifyChangeEmailPhone($otp, true));

        return $this->successResponse([], 'OTP telah dikirim ke nomor telepon baru Anda.');
    }

    public function verifyPhoneChange(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'new_phone' => 'required|string|max:20|unique:administrators,phone',
            'otp' => 'required|numeric',
        ], [
            'new_phone.required' => 'Nomor telepon baru wajib diisi.',
            'new_phone.string' => 'Nomor telepon harus berupa teks.',
            'new_phone.max' => 'Nomor telepon tidak boleh lebih dari 20 karakter.',
            'new_phone.unique' => 'Nomor telepon ini sudah terdaftar.',
            'otp.required' => 'Kode OTP wajib diisi.',
            'otp.numeric' => 'Kode OTP harus berupa angka.',
        ]);

        $newPhone = $request->new_phone;

        $phoneVerification = PhoneRegistration::where('phone', $newPhone)
                    ->where('token', $request->otp)
                    ->first();

        if (!$phoneVerification) {
            return $this->errorResponse('Token atau OTP tidak valid.', 404);
        }

        if (Carbon::now()->isAfter($phoneVerification->expires_at)) {
            $phoneVerification->delete();
            return $this->errorResponse('Token atau OTP sudah kedaluwarsa.', 410);
        }

        $admin->update(['phone' => $newPhone]);

        $phoneVerification->delete();

        return $this->successResponse([], 'Nomor telepon Anda berhasil diperbarui.');
    }

    public function deactivateSelf(Request $request)
    {
        $request = $this->decodeRequest($request);
        
        $admin = Auth::user();

        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $admin->update(['status'=> AdminStatusEnum::Suspended]);
            return $this->successResponse([],'Akun Anda telah berhasil dinonaktifkan.');
        }

        return $this->errorResponse('System Admin tidak dapat menonaktifkan akunnya sendiri.', 400);
    }
}
