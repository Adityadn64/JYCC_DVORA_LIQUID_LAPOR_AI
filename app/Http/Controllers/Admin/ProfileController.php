<?php

namespace App\Http\Controllers\Admin;

use App\Export\ExportFile;
use App\Http\Controllers\Controller;
use App\Enums\ReportStatusEnum;
use App\Enums\RoleAdministratorEnum;
use App\Rules\CurrentPassword;
use App\Traits\ApiResponseTrait;
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

        return $this->successResponse([
            'admin' => $admin,
            'activity' => $activity,
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

    /**
     * POINT 2: Memperbarui info dasar (NIP).
     * Nama lengkap dipisah karena mungkin perlu validasi berbeda.
     */
    public function updateInfo(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'nip' => 'required|string|max:50|unique:administrators,nip,' . $admin->id,
        ])->validate();

        $admin->update($request->all());

        // return back()->with('success_info', 'Informasi akun berhasil diperbarui.');

        return $this->successResponse([], 'Informasi akun berhasil diperbarui.');
    }

    /**
     * POINT 2: Memperbarui nama lengkap dengan password.
     */
    public function updateFullName(Request $request)
    {
        /** @var Request $request */
        $request = $this->decodeRequest($request);

        $admin = Auth::user();

        Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'password' => ['required', new CurrentPassword('administrators')],
        ])->validate();

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

        Validator::make($request->all(), [
            'nip' => 'required|string|max:50|unique:administrators,nip,' . $admin->id,
            'password' => ['required', new CurrentPassword('administrators')],
        ])->validate();

        $admin->update(['nip' => $request->nip]);

        return $this->successResponse([], 'NIP berhasil diperbarui.');
    }

    /**
     * POINT 1: Memperbarui Foto Profil.
     */
    public function updateProfilePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg|max:2048',
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
        $request->validate([
            'kta_scan' => 'required|file|mimes:pdf,jpg,png|max:5120', // 5MB
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

        Validator::make($request->all(), [
            'current_password' => ['required', 'string', new CurrentPassword('administrators')],
            'password' => ['required', 'confirmed', Password::min(8)],
            'logout_other_devices' => 'nullable|boolean',
        ])->validate();

        // Update password
        $admin->forceFill([
            'password_hash' => Hash::make($request->password),
        ])->save();

        // Logout dari sesi lain jika dicentang
        if ($request->logout_other_devices ?? false) {
            Auth::guard('administrators')->logoutOtherDevices($request->current_password);
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
        Validator::make($request->all(), [
            'new_email' => 'required|email|max:255|unique:administrators,email',
            'password' => ['required', new CurrentPassword('administrators')],
        ])->validate();

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
        Validator::make($request->all(), [
            'otp' => 'required|numeric|digits:6',
        ])->validate();

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
        Validator::make($request->all(), [
            'new_phone' => 'required|string|max:20|unique:administrators,phone',
            'password' => ['required', new CurrentPassword('administrators')],
        ])->validate();

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
        Validator::make($request->all(), [
            'otp_phone' => 'required|numeric|digits:6',
        ])->validate();

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

        // return back()->with('error_self_deactivate', 'System Admin tidak dapat menonaktifkan akunnya sendiri.');

        return $this->successResponse([], 'System Admin tidak dapat menonaktifkan akunnya sendiri.');
    }
}
