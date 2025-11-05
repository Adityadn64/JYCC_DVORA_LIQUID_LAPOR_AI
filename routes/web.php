<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\HomeController;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/lapor', [ReportController::class, 'create'])->name('report.create'); // Menampilkan form
Route::post('/lapor', [ReportController::class, 'store'])->name('report.store'); // Menyimpan laporan

Route::get('/lacak', [ReportController::class, 'trackIndex'])->name('report.track.index'); // Halaman input ID
Route::get('/lacak/{report}', [ReportController::class, 'trackShow'])->name('report.track.show'); // Menampilkan detail laporan

Route::get('/login', function () { 
    return 'Halaman Login Admin'; 
})->name('login');

Route::middleware('auth:administrators')->group(function () {
    Route::get('/admin/dashboard', function () {
        return 'Selamat datang di Dasbor Admin!'; 
    })->name('admin.dashboard');

    Route::post('/logout', function () {
        auth('administrators')->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
        return redirect('/');
    })->name('logout');
});