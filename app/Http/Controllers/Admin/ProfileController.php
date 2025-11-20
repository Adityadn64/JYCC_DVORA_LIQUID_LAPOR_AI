<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminStatusEnum;
use App\Export\ExportFile;
use App\Http\Controllers\Controller;
use App\Enums\ReportStatusEnum;
use App\Enums\RoleAdministratorEnum;
use App\Http\Controllers\Auth\LoginController;
use App\Rules\CurrentPassword;
use App\Traits\Controller\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    use ApiResponseTrait;

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

        // return view('admin.profile', [
        //     'admin' => $admin,
        //     'activity' => $activity,
        // ]);

        if ($admin->role === RoleAdministratorEnum::BaseAdmin) {
            $admin->activity = $activity;
        }

        return $this->successResponse([
            'admin' => $admin,
        ]);
    }

    public function exportProfile() {
        [$admin, $activity] = $this->getAdminAndActivity();

        $admin_columns = [
            'ID' => 'id',
            'KODE LAYANAN' => 'service_code',
            'NIP' => 'nip',
            'NAMA LENGKAP' => 'full_name',
            'ALAMAT EMAIL' => 'email',
            'NOMOR TELEPON' => 'phone',
            'PERAN' => 'role',
            'STATUS AKUN' => 'status',
            'TANGGAL DIBUAT' => 'created_at',
            'TERAKHIR DIMODIFIKASI' => 'updated_at',
        ];

        $activity_columns = [
            'ID' => 'id',
            'KODE LAYANAN' => 'service_code',
            'NIP' => 'nip',
            'NAMA LENGKAP' => 'full_name',
            'ALAMAT EMAIL' => 'email',
            'NOMOR TELEPON' => 'phone',
            'PERAN' => 'role',
            'STATUS AKUN' => 'status',
            'TANGGAL DIBUAT' => 'created_at',
            'TERAKHIR DIMODIFIKASI' => 'updated_at',
            'TOTAL LAPORAN DITUGASKAN' => 'total_assigned',
            'TOTAL LAPORAN SELESAI' => 'total_finished',
            'WAKTU PENYELESAIAN RATA RATA' => 'avg_resolution_time',
            '5 LAPORAN TERAKHIR DITANGANI' => function($report) {
                $url = 'URL: ' . route('report.track.show', $report); 
                $title = `JUDUL: $report->title`;
                $id = `ID: $report->id`;

                return $url . '\n' . $title . '\n' . $id;
            },
        ];

        $data = $admin + (
            $admin->role === RoleAdministratorEnum::BaseAdmin
                ? $activity
                : []
        );

        $column = $admin_columns + (
            $admin->role === RoleAdministratorEnum::BaseAdmin
                ? $activity_columns
                : []
        );

        return ExportFile::exportCSV($data + $activity, $column, 'reports.csv');
    }

    /**
     * Helper untuk POINT 5: Mengambil data aktivitas.
     */
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

    /**
     * POINT 2: Memperbarui NIP dengan password.
     */
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

    /**
     * POINT 1: Memperbarui Foto Profil.
     */
    public function updateProfilePicture(Request $request)
    {
        $this->validateRequest($request, [
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg|max:32768',
        ], [
            'profile_picture.required' => 'File foto profil wajib diunggah.',
            'profile_picture.image' => 'File yang diunggah harus berupa gambar.',
            'profile_picture.mimes' => 'Format foto profil harus jpeg, png, atau jpg.',
            'profile_picture.max' => 'Ukuran foto profil tidak boleh lebih dari 2MB.',
        ]);

        $admin = Auth::user();

        // Hapus foto lama jika ada
        if ($admin->profile_picture_path) {
            Storage::disk('public')->delete($admin->profile_picture_path);
        }

        $path = $request->file('profile_picture')->store('profile_pictures', 'public');
        $admin->update(['profile_picture_path' => $path]);

        // return back()->with('success_header', 'Foto profil berhasil diperbarui.');

        return $this->successResponse([], 'Foto profil berhasil diperbarui.');
    }

    /**
     * POINT 3: Memperbarui/Mengunggah KTA Scan.
     */
    public function updateKtaScan(Request $request)
    {
        $this->validateRequest($request, [
            'kta_scan' => 'required|file|mimes:pdf,jpg,png|max:5120', // 5MB
        ], [
            'kta_scan.required' => 'File scan KTA wajib diunggah.',
            'kta_scan.file' => 'Scan KTA harus berupa file.',
            'kta_scan.mimes' => 'Format file harus pdf, jpg, atau png.',
            'kta_scan.max' => 'Ukuran file tidak boleh lebih dari 5MB.',
        ]);

        $admin = Auth::user();

        // Hapus KTA lama jika ada
        if ($admin->kta_scan_path) {
            Storage::disk('public')->delete($admin->kta_scan_path);
        }

        $path = $request->file('kta_scan')->store('kta_scans', 'public');
        $admin->update(['kta_scan_path' => $path]);

        // return back()->with('success_docs', 'Scan KTA berhasil diunggah.');

        return $this->successResponse([], 'Scan KTA berhasil diunggah.');
    }

    /**
     * POINT 2: Mengganti Password & Logout Sesi Lain.
     */
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

        if (!Hash::check($request->current_password, $admin->password_hash)) {
            return $this->errorResponse("Invalid credentials.", 422, [
                "password" => "Password yang anda masukkan salah"
            ]);
        }

        // Update password
        $admin->update([
            'password_hash' => Hash::make($request->password),
        ]);

        // Logout dari sesi lain jika dicentang
        if ($request->logout_other_devices ?? false) {
            // Auth::logoutOtherDevices($request->password);
        }

        // return back()->with('success_password', 'Password berhasil diubah.');

        return $this->successResponse([], 'Password berhasil diubah.');
    }

    /**
     * POINT 2 & 6: Memulai proses ganti email (Kirim OTP).
     */
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
        $otp = rand(100000, 999999);

        // Simpan OTP dan email baru di session untuk diverifikasi
        Session::put('profile_change_otp', $otp);
        Session::put('profile_change_new_email', $newEmail);
        Session::put('profile_change_timestamp', now());

        // --- Placeholder Pengiriman OTP ---
        // Di produksi, ganti ini dengan Mailable
        Log::info("OTP untuk ganti email {$admin->email} ke {$newEmail}: {$otp}");
        // Mail::to($newEmail)->send(new ChangeEmailOtp($otp));
        // ---

        // Beri tahu email lama bahwa ada permintaan perubahan
        // Mail::to($admin->email)->send(new ChangeEmailRequested());

        // return back()->with('success_otp_sent', 'OTP telah dikirim ke alamat email baru Anda.');

        return $this->successResponse([], 'OTP telah dikirim ke alamat email baru Anda.');
    }

    /**
     * POINT 2 & 6: Memverifikasi OTP dan menyelesaikan ganti email.
     */
    public function verifyEmailChange(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();
        
        $this->validateRequest($request, [
            'otp' => 'required|numeric|digits:6',
        ], [
            'otp.required' => 'Kode OTP wajib diisi.',
            'otp.numeric' => 'Kode OTP harus berupa angka.',
            'otp.digits' => 'Kode OTP harus terdiri dari 6 digit.',
        ]);

        // Cek data session
        $sessionOtp = Session::get('profile_change_otp');
        $sessionEmail = Session::get('profile_change_new_email');
        $sessionTime = Session::get('profile_change_timestamp');

        if (!$sessionOtp || !$sessionEmail || !$sessionTime) {
            // return back()->withErrors(['otp' => 'Sesi permintaan telah habis. Silakan ulangi.']);

            return $this->errorResponse('Sesi permintaan telah habis. Silakan ulangi.', 400);
        }

        // Cek kedaluwarsa OTP (10 menit)
        if ($sessionTime->diffInMinutes(now()) > 10) {
            Session::forget(['profile_change_otp', 'profile_change_new_email', 'profile_change_timestamp']);

            // return back()->withErrors(['otp' => 'OTP telah kedaluwarsa. Silakan minta lagi.']);

            return $this->errorResponse('OTP telah kedaluwarsa. Silakan minta lagi.', 400);
        }

        // Cek OTP
        if ($request->otp != $sessionOtp) {
            // return back()->withErrors(['otp' => 'Kode OTP tidak valid.']);

            return $this->errorResponse('Kode OTP tidak valid.', 400);
        }

        // --- Sukses! Ganti Email ---
        $admin->update(['email' => $sessionEmail]);

        // Bersihkan session
        Session::forget(['profile_change_otp', 'profile_change_new_email', 'profile_change_timestamp']);

        // return redirect()->route('admin.profile.show')->with('success_info', 'Alamat email Anda berhasil diperbarui.');

        return $this->successResponse([], 'Alamat email Anda berhasil diperbarui.');
    }

    /**
     * POINT 2 & 6: Memulai proses ganti telepon (Kirim OTP).
     */
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
        $otp = rand(100000, 999999);

        // Gunakan key session yang BERBEDA untuk telepon
        Session::put('profile_change_phone_otp', $otp);
        Session::put('profile_change_new_phone', $newPhone);
        Session::put('profile_change_phone_timestamp', now());

        // --- Placeholder Pengiriman OTP SMS ---
        // Di produksi, ganti ini dengan API SMS Gateway (Twilio, Vonage, dll.)
        Log::info("OTP untuk ganti telepon {$admin->phone} ke {$newPhone}: {$otp}");
        // ---

        return $this->successResponse([], 'OTP telah dikirim ke nomor telepon baru Anda.');
    }

    /**
     * POINT 2 & 6: Memverifikasi OTP dan menyelesaikan ganti telepon.
     */
    public function verifyPhoneChange(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        $this->validateRequest($request, [
            'otp_phone' => 'required|numeric|digits:6',
        ], [
            'otp_phone.required' => 'Kode OTP wajib diisi.',
            'otp_phone.numeric' => 'Kode OTP harus berupa angka.',
            'otp_phone.digits' => 'Kode OTP harus terdiri dari 6 digit.',
        ]);

        // Ambil dari key session telepon
        $sessionOtp = Session::get('profile_change_phone_otp');
        $sessionPhone = Session::get('profile_change_new_phone');
        $sessionTime = Session::get('profile_change_phone_timestamp');

        if (!$sessionOtp || !$sessionPhone || !$sessionTime) {
            // return back()->withErrors(['otp_phone' => 'Sesi permintaan telah habis. Silakan ulangi.']);

            return $this->errorResponse('Sesi permintaan telah habis. Silakan ulangi.', 400);
        }

        if ($sessionTime->diffInMinutes(now()) > 10) {
            Session::forget(['profile_change_phone_otp', 'profile_change_new_phone', 'profile_change_phone_timestamp']);

            // return back()->withErrors(['otp_phone' => 'OTP telah kedaluwarsa. Silakan minta lagi.']);

            return $this->errorResponse('OTP telah kedaluwarsa. Silakan minta lagi.', 400);
        }

        if ($request->otp_phone != $sessionOtp) {
            // return back()->withErrors(['otp_phone' => 'Kode OTP tidak valid.']);

            return $this->errorResponse('Kode OTP tidak valid.', 400);
        }

        // --- Sukses! Ganti Telepon ---
        $admin->update(['phone' => $sessionPhone]);

        // Bersihkan session telepon
        Session::forget(['profile_change_phone_otp', 'profile_change_new_phone', 'profile_change_phone_timestamp']);

        // return redirect()->route('admin.profile.show')->with('success_info', 'Nomor telepon Anda berhasil diperbarui.');

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
