@extends('layouts.app')

@section('title', 'Profil Saya - ' . $admin->full_name)

@section('content')
<div class="max-w-7xl mx-auto space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">

    {{-- Kolom Kiri: Form Utama --}}
    <div class="lg:col-span-2 space-y-8">

        {{-- POINT 1: HEADER --}}
        <div class="bg-white shadow-lg rounded-xl p-8 border">
            @if(session('success_header'))
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ session('success_header') }}</p>
            </div>
            @endif
            <form action="{{ route('admin.profile.updatePicture') }}" method="POST" enctype="multipart/form-data">
                @csrf
                <div class="flex items-center space-x-6">
                    <img class="h-24 w-24 rounded-full object-cover"
                        src="{{ $admin->profile_picture_path ? Storage::url($admin->profile_picture_path) : 'https://ui-avatars.com/api/?name=' . urlencode($admin->full_name) }}"
                        alt="Foto Profil" id="profilePicPreview">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">{{ $admin->full_name }}</h1>
                        <p class="text-gray-500">
                            <span class="font-medium text-blue-600">{{ $admin->role->name }}</span>
                            <span class="mx-2 text-gray-300">|</span>
                            Status: <span class="font-medium text-green-600">{{ $admin->status->name }}</span>
                        </p>
                    </div>
                </div>
                <div class="mt-6">
                    <label for="profile_picture" class="block text-sm font-medium text-gray-700 mb-1">Ubah Foto
                        Profil</label>
                    <input type="file" id="profile_picture" name="profile_picture"
                        accept="image/jpeg,image/png,image/jpg"
                        class="block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onchange="document.getElementById('profilePicPreview').src = window.URL.createObjectURL(this.files[0])">
                    <button type="submit"
                        class="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan
                        Foto</button>
                </div>
            </form>
        </div>

        {{-- POINT 2 & 3: KONTAK, AKUN, DOKUMEN --}}
        <div class="bg-white shadow-lg rounded-xl p-8 border">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Informasi Akun & Identitas</h2>

            @if(session('success_info'))
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ session('success_info') }}</p>
            </div>
            @endif
            @if(session('success_docs'))
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ session('success_docs') }}</p>
            </div>
            @endif
            @if(session('success_otp_sent'))
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ session('success_otp_sent') }}</p>
            </div>
            @endif
            @if(session('success_otp_sent_phone'))
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ session('success_otp_sent_phone') }}</p>
            </div>
            @endif

            {{-- Form Info Dasar --}}
            <form action="{{ route('admin.profile.updateInfo') }}" method="POST" class="space-y-6 border-b pb-6 mb-6">
                @csrf
                @method('PUT')
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="full_name" class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" id="full_name" name="full_name"
                            value="{{ old('full_name', $admin->full_name) }}" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="nip" class="block text-sm font-medium text-gray-700">NIP</label>
                        <input type="text" id="nip" name="nip" value="{{ old('nip', $admin->nip) }}" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div class="text-right">
                    <button type="submit"
                        class="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan
                        Info</button>
                </div>
            </form>

            {{-- Info Readonly & Aksi Keamanan --}}
            <div class="space-y-4 border-b pb-6 mb-6">
                <dl class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2 flex justify-between items-center">
                        <span>{{ Str::mask($admin->email, '*', 3, 10) }}</span>
                        <button onclick="openModal('emailChangeModal')"
                            class="font-medium text-blue-600 hover:text-blue-500">Ubah</button>
                    </dd>
                </dl>
                <dl class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt class="text-sm font-medium text-gray-500">No. Telepon</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2 flex justify-between items-center">
                        <span>{{ Str::mask($admin->phone, '*', 3, 4) }}</span>
                        <button onclick="openModal('phoneChangeModal')"
                            class="font-medium text-blue-600 hover:text-blue-500">Ubah</button>
                    </dd>
                </dl>
                <dl class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt class="text-sm font-medium text-gray-500">Dinas / Instansi</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2 font-medium">{{ $admin->serviceProfile->full_name ??
                        'N/A' }}</dd>
                </dl>
            </div>

            {{-- Form Upload KTA --}}
            <form action="{{ route('admin.profile.updateKta') }}" method="POST" enctype="multipart/form-data">
                @csrf
                <label for="kta_scan" class="block text-sm font-medium text-gray-700 mb-1">Scan KTA/Kartu
                    Pegawai</label>
                @if($admin->kta_scan_path)
                <div class="mb-2 text-sm">
                    File saat ini: <a href="{{ Storage::url($admin->kta_scan_path) }}" target="_blank"
                        class="text-blue-600 hover:underline">Lihat KTA</a>
                </div>
                @endif
                <input type="file" id="kta_scan" name="kta_scan" accept=".pdf,.jpg,.png" required
                    class="block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                <button type="submit"
                    class="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Unggah
                    KTA</button>
            </form>
        </div>

        {{-- POINT 2 & 6: KEAMANAN --}}
        <div class="bg-white shadow-lg rounded-xl p-8 border">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Keamanan Akun</h2>
            @if(session('success_password'))
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ session('success_password') }}</p>
            </div>
            @endif

            <button onclick="openModal('passwordChangeModal')"
                class="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                Ganti Password
            </button>
            <button
                class="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                disabled>
                Aktifkan Autentikasi 2 Langkah (TBD)
            </button>
            <button
                class="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                disabled>
                Download Data Pribadi (TBD)
            </button>

            @if(Auth::user()->role !== \App\Enums\RoleAdministratorEnum::SystemAdmin)
                <form action="{{ route('admin.profile.deactivateSelf') }}" method="POST"
                    onsubmit="return confirm('Anda yakin ingin menonaktifkan akun Anda? Tindakan ini tidak dapat dibatalkan tanpa bantuan System Admin.');">
                    @csrf
                    <button type="submit"
                        class="w-full sm:w-auto rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100">
                        Nonaktifkan Akun Saya
                    </button>
                </form>
            @endif
        </div>

    </div>

    <div class="lg:col-span-1 space-y-8">
        @if(Auth::user()->role === \App\Enums\RoleAdministratorEnum::BaseAdmin)
            <div class="bg-white shadow-lg rounded-xl p-6 border">
                <h3 class="text-xl font-semibold text-gray-900 mb-4">Aktivitas Saya</h3>
                <div class="flex justify-between p-2 bg-gray-50 rounded-md">
                    <span class="text-sm font-medium text-gray-600">Total Laporan Ditugaskan</span>
                    <span class="text-lg font-bold text-gray-900">{{ $activity->total_assigned }}</span>
                </div>
                <div class="flex justify-between p-2 bg-gray-50 rounded-md">
                    <span class="text-sm font-medium text-gray-600">Total Laporan Selesai</span>
                    <span class="text-lg font-bold text-green-600">{{ $activity->total_finished }}</span>
                </div>
                <div class="flex justify-between p-2 bg-gray-50 rounded-md">
                    <span class="text-sm font-medium text-gray-600">Waktu Penyelesaian Rata-rata</span>
                    <span class="text-lg font-bold text-blue-600">{{ $activity->avg_resolution_time }}</span>
                </div>

                <h4 class="text-md font-semibold text-gray-800 mt-8 mb-3">5 Laporan Terakhir Ditangani</h4>
                <ul class="divide-y divide-gray-200">
                    @forelse($activity->recent_reports as $report)
                        <li class="py-3">
                            <a href="{{ route('report.track.show', $report) }}" class="block hover:bg-gray-50 p-2 rounded-md">
                                <p class="text-sm font-medium text-gray-900 truncate">{{ $report->title }}</p>
                                <p class="text-xs text-gray-500">ID: #{{$report->id}} - Diperbarui: {{
                                    $report->updated_at->diffForHumans() }}</p>
                            </a>
                        </li>
                        @empty
                        <li class="py-3 text-sm text-gray-500 text-center">Belum ada laporan yang ditangani.</li>
                    @endforelse
                </ul>
            </div>
        @endif

        <div class="bg-white shadow-lg rounded-xl p-6 border">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Metadata Akun</h3>
            <dl class="space-y-3">
                <div class="flex justify-between">
                    <dt class="text-sm text-gray-500">Dibuat Pada</dt>
                    <dd class="text-sm font-medium text-gray-700">{{ $admin->created_at->format('d M Y, H:i') }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt class="text-sm text-gray-500">Terakhir Diperbarui</dt>
                    <dd class="text-sm font-medium text-gray-700">{{ $admin->updated_at->format('d M Y, H:i') }}</dd>
                </div>
                @if($admin->deleted_at)
                <div class="flex justify-between">
                    <dt class="text-sm text-red-500">Dihapus Pada</dt>
                    <dd class="text-sm font-medium text-red-700">{{ $admin->deleted_at->format('d M Y, H:i') }}</dd>
                </div>
                @endif
            </dl>
        </div>

    </div>
</div>

<div id="passwordChangeModal" class="fixed inset-0 z-50 hidden" style="background-color: rgba(0,0,0,0.5);">
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">Ganti Password</h3>
                <button onclick="closeModal('passwordChangeModal')"
                    class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            @if ($errors->any() && ($errors->has('current_password') || $errors->has('password')))
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                    <ul class="list-disc list-inside">
                        @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
            <form action="{{ route('admin.profile.updatePassword') }}" method="POST">
                @csrf
                <div class="space-y-4">
                    <div>
                        <label for="current_password" class="block text-sm font-medium text-gray-700">Password Saat
                            Ini</label>
                        <input type="password" id="current_password" name="current_password" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700">Password Baru</label>
                        <input type="password" id="password" name="password" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="password_confirmation" class="block text-sm font-medium text-gray-700">Konfirmasi
                            Password Baru</label>
                        <input type="password" id="password_confirmation" name="password_confirmation" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div class="flex items-center">
                        <input id="logout_other_devices" name="logout_other_devices" type="checkbox" value="1"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                        <label for="logout_other_devices" class="ml-2 block text-sm text-gray-900">Keluarkan dari semua
                            sesi lain</label>
                    </div>
                    <div class="pt-2 text-right">
                        <button type="button" onclick="closeModal('passwordChangeModal')"
                            class="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                        <button type="submit"
                            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan
                            Password</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<div id="emailChangeModal" class="fixed inset-0 z-50 hidden" style="background-color: rgba(0,0,0,0.5);">
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">Ubah Alamat Email</h3>
                <button onclick="closeModal('emailChangeModal')"
                    class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            {{-- Step 1: Minta Email & Password --}}
            <form id="formStep1" action="{{ route('admin.profile.requestEmailChange') }}" method="POST"
                class="{{ (session('success_otp_sent') || $errors->has('otp_email')) ? 'hidden' : '' }}">
                @csrf
                <p class="text-sm text-gray-600 mb-4">Kami akan mengirimkan kode OTP 6 digit ke alamat email **baru**
                    Anda untuk verifikasi.</p>
                @if ($errors->has('new_email') || ($errors->has('password') && $errors->has('new_email')))
                <div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                    {{ $errors->first('new_email') ?: $errors->first('password') }}
                </div>
                @endif
                <div class="space-y-4">
                    <div>
                        <label for="new_email" class="block text-sm font-medium text-gray-700">Alamat Email Baru</label>
                        <input type="email" id="new_email" name="new_email" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="password_for_email" class="block text-sm font-medium text-gray-700">Konfirmasi
                            Password Anda</label>
                        <input type="password" id="password_for_email" name="password" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div class="pt-2 text-right">
                        <button type="button" onclick="closeModal('emailChangeModal')"
                            class="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                        <button type="submit"
                            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Kirim
                            Kode OTP</button>
                    </div>
                </div>
            </form>

            {{-- Step 2: Verifikasi OTP --}}
            <form id="formStep2" action="{{ route('admin.profile.verifyEmailChange') }}" method="POST"
                class="{{ (session('success_otp_sent') || $errors->has('otp_email')) ? '' : 'hidden' }}">
                @csrf
                <p class="text-sm text-gray-600 mb-4">Masukkan kode 6 digit yang kami kirim ke **{{
                    session('profile_change_new_email') }}**.</p>
                @if ($errors->has('otp_email'))
                <div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                    {{ $errors->first('otp_email') }}
                </div>
                @endif
                <div class="space-y-4">
                    <div>
                        <label for="otp_email" class="block text-sm font-medium text-gray-700">Kode OTP</label>
                        <input type="text" id="otp_email" name="otp_email" required pattern="\d{6}" maxlength="6"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-[.5em]">
                    </div>
                    <div class="pt-2 text-right">
                        <button type="button" onclick="closeModal('emailChangeModal')"
                            class="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                        <button type="submit"
                            class="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700">Verifikasi
                            & Ganti Email</button>
                    </div>
                </div>
            </form>

        </div>
    </div>
</div>

<div id="phoneChangeModal" class="fixed inset-0 z-50 hidden" style="background-color: rgba(0,0,0,0.5);">
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">Ubah Nomor Telepon</h3>
                <button onclick="closeModal('phoneChangeModal')"
                    class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            {{-- Step 1: Minta Telepon & Password --}}
            <form id="formStep1_phone" action="{{ route('admin.profile.requestPhoneChange') }}" method="POST"
                class="{{ (session('success_otp_sent_phone') || $errors->has('otp_phone')) ? 'hidden' : '' }}">
                @csrf
                <p class="text-sm text-gray-600 mb-4">Kami akan mengirimkan kode OTP 6 digit ke nomor telepon **baru**
                    Anda untuk verifikasi.</p>
                @if ($errors->has('new_phone') || ($errors->has('password') && $errors->has('new_phone')))
                <div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                    {{ $errors->first('new_phone') ?: $errors->first('password') }}
                </div>
                @endif
                <div class="space-y-4">
                    <div>
                        <label for="new_phone" class="block text-sm font-medium text-gray-700">Nomor Telepon
                            Baru</label>
                        <input type="tel" id="new_phone" name="new_phone" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="password_for_phone" class="block text-sm font-medium text-gray-700">Konfirmasi
                            Password Anda</label>
                        <input type="password" id="password_for_phone" name="password" required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div class="pt-2 text-right">
                        <button type="button" onclick="closeModal('phoneChangeModal')"
                            class="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                        <button type="submit"
                            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Kirim
                            Kode OTP</button>
                    </div>
                </div>
            </form>

            {{-- Step 2: Verifikasi OTP --}}
            <form id="formStep2_phone" action="{{ route('admin.profile.verifyPhoneChange') }}" method="POST"
                class="{{ (session('success_otp_sent_phone') || $errors->has('otp_phone')) ? '' : 'hidden' }}">
                @csrf
                <p class="text-sm text-gray-600 mb-4">Masukkan kode 6 digit yang kami kirim ke **{{
                    session('profile_change_new_phone') }}**.</p>
                @if ($errors->has('otp_phone'))
                <div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                    {{ $errors->first('otp_phone') }}
                </div>
                @endif
                <div class="space-y-4">
                    <div>
                        <label for="otp_phone" class="block text-sm font-medium text-gray-700">Kode OTP</label>
                        <input type="text" id="otp_phone" name="otp_phone" required pattern="\d{6}" maxlength="6"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-[.5em]">
                    </div>
                    <div class="pt-2 text-right">
                        <button type="button" onclick="closeModal('phoneChangeModal')"
                            class="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                        <button type="submit"
                            class="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700">Verifikasi
                            & Ganti Telepon</button>
                    </div>
                </div>
            </form>

        </div>
    </div>
</div>

<script>
    function openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }
    function closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    // Cek jika ada error validasi di modal, buka modal itu
    @if ($errors->any() && ($errors->has('current_password') || ($errors->has('password') && !$errors->has('new_email') && !$errors->has('new_phone'))))
        openModal('passwordChangeModal');
    @endif
    
    // --- Logika untuk stepper modal EMAIL ---
    @if (session('success_otp_sent'))
        openModal('emailChangeModal');
        document.getElementById('formStep1').classList.add('hidden');
        document.getElementById('formStep2').classList.remove('hidden');
    @elseif ($errors->has('new_email') || ($errors->has('password') && $errors->has('new_email')))
        openModal('emailChangeModal');
        document.getElementById('formStep1').classList.remove('hidden');
        document.getElementById('formStep2').classList.add('hidden');
    @elseif ($errors->has('otp_email'))
        openModal('emailChangeModal');
        document.getElementById('formStep1').classList.add('hidden');
        document.getElementById('formStep2').classList.remove('hidden');
    @endif

    // --- Logika untuk stepper modal TELEPON (BARU) ---
    @if (session('success_otp_sent_phone'))
        openModal('phoneChangeModal');
        document.getElementById('formStep1_phone').classList.add('hidden');
        document.getElementById('formStep2_phone').classList.remove('hidden');
    @elseif ($errors->has('new_phone') || ($errors->has('password') && $errors->has('new_phone')))
        openModal('phoneChangeModal');
        document.getElementById('formStep1_phone').classList.remove('hidden');
        document.getElementById('formStep2_phone').classList.add('hidden');
    @elseif ($errors->has('otp_phone'))
        openModal('phoneChangeModal');
        document.getElementById('formStep1_phone').classList.add('hidden');
        document.getElementById('formStep2_phone').classList.remove('hidden');
    @endif
</script>
@endsection