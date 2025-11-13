@extends('../../layouts.app')
@section('title', 'Atur Ulang Password')
@section('content')
<div class="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
    <h1 class="text-2xl font-bold text-center">Atur Ulang Password</h1>
    <form method="POST" action="{{ route('password.update') }}" class="space-y-6">
        @csrf
        <input type="hidden" name="token" value="{{ $token }}">
        <div>
            <label for="email">Alamat Email</label>
            <input id="email" type="email" name="email" value="{{ $email ?? old('email') }}" required class="block w-full mt-1 border-gray-300 rounded-md shadow-sm">
        </div>
        <div>
            <label for="password">Password Baru</label>
            <input id="password" type="password" name="password" required class="block w-full mt-1 border-gray-300 rounded-md shadow-sm">
        </div>
        <div>
            <label for="password-confirm">Konfirmasi Password</label>
            <input id="password-confirm" type="password" name="password_confirmation" required class="block w-full mt-1 border-gray-300 rounded-md shadow-sm">
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md">Reset Password</button>
    </form>
</div>
@endsection