<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | 'guard' menunjuk ke 'administrators' sebagai sistem login utama kita.
    | 'passwords' menunjuk ke 'administrators' untuk fitur lupa password.
    |
    */

    'defaults' => [
        'guard' => 'administrators', // DIGANTI
        'passwords' => 'administrators', // DIGANTI
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Kita membuat guard baru 'administrators' yang menggunakan
    | provider 'administrators'.
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        // PERBARUI GUARD INI
        'administrators' => [
            'driver' => 'session',
            'provider' => 'administrators',
        ],

        'sanctum' => [
            'driver' => 'sanctum',
            'provider' => null,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | Kita membuat provider baru 'administrators' yang memberitahu Laravel
    | untuk menggunakan model App\Models\Administrator untuk login.
    |
    */

    'providers' => [
        'administrators' => [
            'driver' => 'eloquent',
            'model' => App\Models\Administrator::class,
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | Kita membuat 'broker' password reset baru untuk 'administrators'
    | yang menggunakan tabel 'password_resets' yang telah kita buat.
    |
    */

    'passwords' => [
        'administrators' => [ // DITAMBAHKAN
            'provider' => 'administrators',
            'table' => 'password_resets',
            'expire' => 60,
            'throttle' => 60,
        ],

        // 'users' bawaan bisa dihapus atau dibiarkan saja
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];