<?php

use App\Http\Controllers\Admin\AnalyticsController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProfileController;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/lapor', [ReportController::class, 'create'])->name('report.create');
Route::post('/lapor', [ReportController::class, 'store'])->name('report.store');

Route::get('/lacak', [ReportController::class, 'trackIndex'])->name('report.track.index');
Route::get('/lacak/{report}', [ReportController::class, 'trackShow'])->name('report.track.show');

Route::middleware('guest:administrators')->group(function () {
    Route::get('login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('login', [LoginController::class, 'login'])->name('login.attempt');

    Route::get('register', [RegisterController::class, 'showRegistrationForm'])->name('register');
    Route::post('register', [RegisterController::class, 'startRegistration'])->name('register.start');
    Route::get('register/verify', [RegisterController::class, 'showVerificationForm'])->name('register.verify.form');
    Route::post('register/verify', [RegisterController::class, 'completeRegistration'])->name('register.complete');

    Route::get('forgot-password', [ForgotPasswordController::class, 'showLinkRequestForm'])->name('password.request');
    Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail'])->name('password.email');
    Route::get('reset-password/{token}', [ForgotPasswordController::class, 'showResetForm'])->name('password.reset');
    Route::post('reset-password', [ForgotPasswordController::class, 'reset'])->name('password.update');
});

Route::middleware('auth:administrators')->group(function () {
    Route::post('logout', [LoginController::class, 'logout'])->name('logout');
});

Route::middleware('auth:administrators')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics');

    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show'])->name('show');

        // Aksi Update Info Dasar
        Route::put('/update-info', [ProfileController::class, 'updateInfo'])->name('updateInfo');
        Route::post('/update-picture', [ProfileController::class, 'updateProfilePicture'])->name('updatePicture');
        Route::post('/update-kta', [ProfileController::class, 'updateKtaScan'])->name('updateKta');

        // Aksi Keamanan
        Route::post('/update-password', [ProfileController::class, 'updatePassword'])->name('updatePassword');
        Route::post('/deactivate-self', [ProfileController::class, 'deactivateSelf'])->name('deactivateSelf');

        // Aksi Ganti Email (Stepper)
        Route::post('/request-email-change', [ProfileController::class, 'requestEmailChange'])->name('requestEmailChange');
        Route::post('/verify-email-change', [ProfileController::class, 'verifyEmailChange'])->name('verifyEmailChange');

        // TODO: Tambahkan rute untuk ganti telepon
        // Route::post('/request-phone-change', [ProfileController::class, 'requestPhoneChange'])->name('requestPhoneChange');
        // Route::post('/verify-phone-change', [ProfileController::class, 'verifyPhoneChange'])->name('verifyPhoneChange');

        // --- TAMBAHKAN DUA BARIS INI ---
        Route::post('/request-phone-change', [ProfileController::class, 'requestPhoneChange'])->name('requestPhoneChange');
        Route::post('/verify-phone-change', [ProfileController::class, 'verifyPhoneChange'])->name('verifyPhoneChange');
    });
});
