<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log; // Untuk placeholder OTP
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use App\Models\Report;
use App\Enums\ReportStatusEnum;
use App\Enums\AdminStatusEnum;
use App\Enums\RoleAdministratorEnum;
use App\Rules\CurrentPassword; // Kita perlu membuat Rule kustom ini

class ProfileController extends Controller
{
    /**
     * POINT 1-5: Menampilkan halaman profil utama dengan data aktivitas.
     */
    public function show()
    {
        $admin = Auth::user();
        $admin->load('serviceProfile');

        // POINT 5: Aktivitas Admin
        $activity = $this->getAdminActivity($admin);

        return view('admin.profile', [
            'admin' => $admin,
            'activity' => $activity,
        ]);
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
        $admin = Auth::user();

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'nip' => 'required|string|max:50|unique:administrators,nip,' . $admin->id,
        ]);

        $admin->update($validated);

        return back()->with('success_info', 'Informasi akun berhasil diperbarui.');
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

        return back()->with('success_header', 'Foto profil berhasil diperbarui.');
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

        return back()->with('success_docs', 'Scan KTA berhasil diunggah.');
    }

    /**
     * POINT 2: Mengganti Password & Logout Sesi Lain.
     */
    public function updatePassword(Request $request)
    {
        $admin = Auth::user();

        $validated = $request->validate([
            'current_password' => ['required', 'string', new CurrentPassword('administrators')],
            'password' => ['required', 'confirmed', Password::min(8)],
            'logout_other_devices' => 'nullable|boolean',
        ]);

        // Update password
        $admin->forceFill([
            'password_hash' => Hash::make($validated['password']),
        ])->save();

        // Logout dari sesi lain jika dicentang
        if ($request->logout_other_devices) {
            Auth::guard('administrators')->logoutOtherDevices($validated['current_password']);
        }

        return back()->with('success_password', 'Password berhasil diubah.');
    }

    /**
     * POINT 2 & 6: Memulai proses ganti email (Kirim OTP).
     */
    public function requestEmailChange(Request $request)
    {
        $admin = Auth::user();
        $validated = $request->validate([
            'new_email' => 'required|email|max:255|unique:administrators,email',
            'password' => ['required', new CurrentPassword('administrators')],
        ]);

        $newEmail = $validated['new_email'];
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

        return back()->with('success_otp_sent', 'OTP telah dikirim ke alamat email baru Anda.');
    }

    /**
     * POINT 2 & 6: Memverifikasi OTP dan menyelesaikan ganti email.
     */
    public function verifyEmailChange(Request $request)
    {
        $admin = Auth::user();
        $validated = $request->validate([
            'otp' => 'required|numeric|digits:6',
        ]);

        // Cek data session
        $sessionOtp = Session::get('profile_change_otp');
        $sessionEmail = Session::get('profile_change_new_email');
        $sessionTime = Session::get('profile_change_timestamp');

        if (!$sessionOtp || !$sessionEmail || !$sessionTime) {
            return back()->withErrors(['otp' => 'Sesi permintaan telah habis. Silakan ulangi.']);
        }

        // Cek kedaluwarsa OTP (10 menit)
        if ($sessionTime->diffInMinutes(now()) > 10) {
            Session::forget(['profile_change_otp', 'profile_change_new_email', 'profile_change_timestamp']);
            return back()->withErrors(['otp' => 'OTP telah kedaluwarsa. Silakan minta lagi.']);
        }

        // Cek OTP
        if ($validated['otp'] != $sessionOtp) {
            return back()->withErrors(['otp' => 'Kode OTP tidak valid.']);
        }

        // --- Sukses! Ganti Email ---
        $admin->update(['email' => $sessionEmail]);

        // Bersihkan session
        Session::forget(['profile_change_otp', 'profile_change_new_email', 'profile_change_timestamp']);

        return redirect()->route('admin.profile.show')->with('success_info', 'Alamat email Anda berhasil diperbarui.');
    }

    /**
     * POINT 2 & 6: Memulai proses ganti telepon (Kirim OTP).
     */
    public function requestPhoneChange(Request $request)
    {
        $admin = Auth::user();
        $validated = $request->validate([
            'new_phone' => 'required|string|max:20|unique:administrators,phone',
            'password' => ['required', new CurrentPassword('administrators')],
        ]);

        $newPhone = $validated['new_phone'];
        $otp = rand(100000, 999999);

        // Gunakan key session yang BERBEDA untuk telepon
        Session::put('profile_change_phone_otp', $otp);
        Session::put('profile_change_new_phone', $newPhone);
        Session::put('profile_change_phone_timestamp', now());

        // --- Placeholder Pengiriman OTP SMS ---
        // Di produksi, ganti ini dengan API SMS Gateway (Twilio, Vonage, dll.)
        Log::info("OTP untuk ganti telepon {$admin->phone} ke {$newPhone}: {$otp}");
        // ---

        return back()->with('success_otp_sent_phone', 'OTP telah dikirim ke nomor telepon baru Anda.');
    }

    /**
     * POINT 2 & 6: Memverifikasi OTP dan menyelesaikan ganti telepon.
     */
    public function verifyPhoneChange(Request $request)
    {
        $admin = Auth::user();
        $validated = $request->validate([
            'otp_phone' => 'required|numeric|digits:6',
        ]);

        // Ambil dari key session telepon
        $sessionOtp = Session::get('profile_change_phone_otp');
        $sessionPhone = Session::get('profile_change_new_phone');
        $sessionTime = Session::get('profile_change_phone_timestamp');

        if (!$sessionOtp || !$sessionPhone || !$sessionTime) {
            return back()->withErrors(['otp_phone' => 'Sesi permintaan telah habis. Silakan ulangi.']);
        }

        if ($sessionTime->diffInMinutes(now()) > 10) {
            Session::forget(['profile_change_phone_otp', 'profile_change_new_phone', 'profile_change_phone_timestamp']);
            return back()->withErrors(['otp_phone' => 'OTP telah kedaluwarsa. Silakan minta lagi.']);
        }

        if ($validated['otp_phone'] != $sessionOtp) {
            return back()->withErrors(['otp_phone' => 'Kode OTP tidak valid.']);
        }

        // --- Sukses! Ganti Telepon ---
        $admin->update(['phone' => $sessionPhone]);

        // Bersihkan session telepon
        Session::forget(['profile_change_phone_otp', 'profile_change_new_phone', 'profile_change_phone_timestamp']);

        return redirect()->route('admin.profile.show')->with('success_info', 'Nomor telepon Anda berhasil diperbarui.');
    }

    public function deactivateSelf(Request $request)
    {
        $admin = Auth::user();

        // SuperAdmin tidak boleh menonaktifkan dirinya sendiri
        if ($admin->role === RoleAdministratorEnum::SystemAdmin) {
            return back()->with('error_self_deactivate', 'System Admin tidak dapat menonaktifkan akunnya sendiri.');
        }

        $admin->update(['status' => AdminStatusEnum::Suspended]); // Asumsi ada status 'Suspended'
        Auth::guard('administrators')->logout();

        return redirect('/')->with('success', 'Akun Anda telah dinonaktifkan.');
    }
}
