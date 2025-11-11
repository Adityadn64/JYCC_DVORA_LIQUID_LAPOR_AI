@extends('layouts.app')
@section('title', 'Registrasi Administrator')
@section('content')
<div class="max-w-lg mx-auto bg-white shadow-lg rounded-xl p-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">Registrasi Akun Admin</h1>
    <p class="text-gray-600 mb-8 text-center">Lengkapi semua data di bawah ini untuk memulai proses verifikasi.</p>

    @if ($errors->any())
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
            <p class="font-bold">Terjadi Kesalahan</p>
            <ul class="mt-2 list-disc list-inside">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form action="{{ route('register.start') }}" method="POST" enctype="multipart/form-data" class="space-y-6">
        @csrf
        
        <div><label for="full_name" class="block text-sm font-medium text-gray-700">Nama Lengkap</label><input type="text" id="full_name" name="full_name" value="{{ old('full_name') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
        <div><label for="email" class="block text-sm font-medium text-gray-700">Alamat Email</label><input type="email" id="email" name="email" value="{{ old('email') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
        <div><label for="phone" class="block text-sm font-medium text-gray-700">Nomor Telepon</label><input type="tel" id="phone" name="phone" value="{{ old('phone') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
        <div><label for="nip" class="block text-sm font-medium text-gray-700">NIP</label><input type="text" id="nip" name="nip" value="{{ old('nip') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
        <div><label for="password" class="block text-sm font-medium text-gray-700">Password</label><input type="password" id="password" name="password" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
        <div><label for="password_confirmation" class="block text-sm font-medium text-gray-700">Konfirmasi Password</label><input type="password" id="password_confirmation" name="password_confirmation" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
        <div><label for="role" class="block text-sm font-medium text-gray-700">Peran (Role)</label><select name="role" id="role" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">Pilih Peran</option>
            @foreach($roles as $role)
                <option value="{{ $role->value }}" @selected(old('role') == $role->value)>{{ $role->name }}</option>
            @endforeach
        </select></div>
        <div id="service_code_wrapper"><label for="service_code" class="block text-sm font-medium text-gray-700">Asal Dinas</label><select name="service_code" id="service_code" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">Pilih Asal Dinas</option>
            @foreach($serviceProfiles as $profile)
                <option value="{{ $profile->code->value }}" @selected(old('service_code') == $profile->code->value)>{{ $profile->full_name }}</option>
            @endforeach
        </select></div>
        <div><label for="kta_scan" class="block text-sm font-medium text-gray-700">Scan KTA/Kartu Pegawai</label><input type="file" id="kta_scan" name="kta_scan" required class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"></div>
        
        <div class="pt-4"><button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Daftar & Kirim Kode Verifikasi</button></div>
    </form>
</div>
<script>
    const roleSelect = document.getElementById('role');
    const serviceCodeWrapper = document.getElementById('service_code_wrapper');
    function toggleServiceCode() {
        if (roleSelect.value === 'base_admin') { serviceCodeWrapper.style.display = 'block'; } else { serviceCodeWrapper.style.display = 'none'; }
    }
    roleSelect.addEventListener('change', toggleServiceCode);
    document.addEventListener('DOMContentLoaded', toggleServiceCode);
</script>
@endsection