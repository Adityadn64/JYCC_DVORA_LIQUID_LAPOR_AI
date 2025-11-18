<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Data\RegionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\AdminManagementController;
use App\Http\Controllers\Admin\PerformanceController;

// Route::prefix('api')->name('api.')->group(function () {
Route::post('/home', [HomeController::class, 'index'])->name('home');
Route::post('/report/create', [ReportController::class, 'store'])->name('report.store');
Route::post('/reports/track', [ReportController::class, 'trackIndex'])->name('report.track.index');
Route::post('/report/{report}/track', [ReportController::class, 'trackShow'])->name('report.track.show');

Route::prefix('auth')->name('auth.')->group(function () {
    Route::middleware('guest:administrators')->group(function () {
        Route::post('/login', [LoginController::class, 'login'])->name('login.attempt');
    
        Route::post('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
        Route::post('/register/send', [RegisterController::class, 'startRegistration'])->name('register.send');
        Route::post('/register/verify', [RegisterController::class, 'showVerificationForm'])->name('register.verify.form');
        Route::post('/register/verify/send', [RegisterController::class, 'completeRegistration'])->name('register.complete');
    
        Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail'])->name('password.email');
        Route::post('/reset-password/{token}', [ForgotPasswordController::class, 'showResetForm'])->name('password.reset');
        Route::post('/reset-password', [ForgotPasswordController::class, 'reset'])->name('password.update');
    });
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
    });
});

Route::middleware(['auth:sanctum', 'admin.status'])->prefix('admin')->name('admin.')->group(function () {
    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::post('/', [DashboardController::class, 'index'])->name('dashboard');
    });

    Route::prefix('analytics')->name('analytics.')->group(function () {
        Route::post('/', [AnalyticsController::class, 'index'])->name('analytics');
        Route::post('/export-reports', [AnalyticsController::class, 'exportReports'])->name('analytics.export-reports');
    });

    Route::prefix('profile')->name('profile.')->group(function () {
        Route::post('/', [ProfileController::class, 'show'])->name('show');
        Route::post('/export-profile', [ProfileController::class, 'exportProfile'])->name('profile.export-profile');

        Route::post('/update-info', [ProfileController::class, 'updateInfo'])->name('updateInfo');
        Route::post('/update-full-name', [ProfileController::class, 'updateFullName'])->name('updateFullName');
        Route::post('/update-nip', [ProfileController::class, 'updateNip'])->name('updateNip');
        Route::post('/update-picture', [ProfileController::class, 'updateProfilePicture'])->name('updatePicture');
        Route::post('/update-kta', [ProfileController::class, 'updateKtaScan'])->name('updateKta');

        Route::post('/update-password', [ProfileController::class, 'updatePassword'])->name('updatePassword');
        Route::post('/deactivate-self', [ProfileController::class, 'deactivateSelf'])->name('deactivateSelf');

        Route::post('/request-email-change', [ProfileController::class, 'requestEmailChange'])->name('requestEmailChange');
        Route::post('/verify-email-change', [ProfileController::class, 'verifyEmailChange'])->name('verifyEmailChange');

        Route::post('/request-phone-change', [ProfileController::class, 'requestPhoneChange'])->name('requestPhoneChange');
        Route::post('/verify-phone-change', [ProfileController::class, 'verifyPhoneChange'])->name('verifyPhoneChange');
    });
    
    Route::middleware('systemadmin')->group(function () {
        Route::prefix('manage')->name('manage.')->group(function () {
            Route::post('/', [AdminManagementController::class, 'index'])->name('index');
            Route::post('/{admin}/accept', [AdminManagementController::class, 'accept'])->name('accept');
            Route::post('/{admin}/reject', [AdminManagementController::class, 'reject'])->name('reject');
    
            Route::post('/{admin}/toggle-status', [AdminManagementController::class, 'toggleStatus'])->name('toggleStatus');
            Route::post('/{admin}/send-reset', [AdminManagementController::class, 'sendPasswordReset'])->name('sendReset');
            
            Route::post('/{admin}/activity', [AdminManagementController::class, 'showActivity'])->name('activity');
        });
        Route::prefix('performance')->name('performance.')->middleware('systemadmin')->group(function () {
            Route::post('/', [PerformanceController::class, 'index'])->name('index');
        });
    });
});

Route::post('/regencies', [RegionController::class, 'getFormattedRegions'])->name('regions.formatted');
// });