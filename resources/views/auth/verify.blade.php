@extends('layouts.app')
@section('title', 'Verifikasi Akun')
@section('content')
<div class="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
    <h1 class="text-2xl font-bold text-center">Verifikasi Akun Anda</h1>
    <p class="text-gray-600 my-4 text-center">
        Kami telah mengirimkan kode verifikasi ke email <strong>{{ Str::mask($email, '*', 3, 10) }}</strong> dan telepon <strong>{{ Str::mask($phone, '*', 3, 4) }}</strong>.
    </p>

    @if ($errors->any())
        <div class="bg-red-100 text-red-700 p-4 rounded mb-4">
            {{ $errors->first() }}
        </div>
    @endif

    <form action="{{ route('register.complete') }}" method="POST" class="space-y-4">
        @csrf
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label for="email_token">Kode Token Email</label>
                <input type="text" name="email_token" id="email_token" required class="mt-1 block w-full text-center tracking-[.5em]">
            </div>
            <div>
                <label for="phone_otp">Kode OTP Telepon</label>
                <input type="text" name="phone_otp" id="phone_otp" required class="mt-1 block w-full text-center tracking-[.5em]">
            </div>
        </div>
        <div class="pt-2">
            <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md">Konfirmasi & Selesaikan Registrasi</button>
        </div>
    </form>
</div>
@endsection