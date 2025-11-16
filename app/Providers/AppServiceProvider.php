<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    public function configureRateLimiting(): void 
    {
        RateLimiter::for('api', function (Request $request) {
            // Aturan yang sama seperti sebelumnya: 50 request per menit
            return Limit::perMinute(50)->by($request->ip());
        });
    }
}
