<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule; // Benar
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Closure; // Impor Closure

class CurrentPassword implements ValidationRule // Benar
{
    private $guard;

    public function __construct($guard)
    {
        $this->guard = $guard;
    }

    /**
     * Jalankan aturan validasi.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Logika digabung di sini
        if (!Hash::check($value, Auth::guard($this->guard)->user()->password_hash)) {
            // Jika gagal, panggil $fail dengan pesan
            $fail('Password yang Anda masukkan tidak sesuai dengan password Anda saat ini.');
        }
    }
}
