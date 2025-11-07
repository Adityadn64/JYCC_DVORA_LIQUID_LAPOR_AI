<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Admin\DashboardController;

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
});