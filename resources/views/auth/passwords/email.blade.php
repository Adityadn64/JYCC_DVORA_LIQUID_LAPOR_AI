@extends('layouts.app')
@section('title', 'Reset Password')
@section('content')
<div class="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
    <h1 class="text-2xl font-bold text-center">Reset Password</h1>
    @if (session('status'))
        <div class="bg-green-100 text-green-700 p-4 rounded my-4">{{ session('status') }}</div>
    @endif
    <form method="POST" action="{{ route('password.email') }}" class="space-y-6">
        @csrf
        <div>
            <label for="email">Alamat Email</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus class="block w-full mt-1 border-gray-300 rounded-md shadow-sm">
            @error('email') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
        </div>
        <div>
            <label for="nip">NIP</label>
            <input id="nip" type="text" name="nip" required class="block w-full mt-1 border-gray-300 rounded-md shadow-sm">
            @error('nip') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md">Kirim Link Reset Password</button>
    </form>
</div>
@endsection