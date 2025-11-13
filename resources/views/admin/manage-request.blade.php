@extends('layouts.app')

@section('title', 'Manajemen Administrator')

@section('content')
<div class="space-y-8">
    @php
        $totalPendingAdmin = 0;
        foreach($admins as $admin) {
            $totalPendingAdmin += 1;
        }
    @endphp

    {{-- POINT 1: HEADER & QUICK ACTIONS --}}
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
            <h1 class="text-3xl font-bold text-gray-900">Manajemen Administrator</h1>
            <p class="mt-2 text-gray-600">Total Admin Tertunda: {{ $totalPendingAdmin }}</p>
        </div>
        <div class="flex-shrink-0 flex gap-2">
            <a href="{{ route('admin.manage.index') }}" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer">
                Kembali
            </a>
        </div>
    </div>
    
    @if(session('success'))
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
            <p>{{ session('success') }}</p>
        </div>
    @endif
    @if(session('error'))
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p>{{ session('error') }}</p>
        </div>
    @endif
    @if ($errors->any())
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p class="font-bold">Terjadi Kesalahan Validasi:</p>
            <ul class="mt-2 list-disc list-inside">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- POINT 2: SEARCH / FILTER BAR --}}
    <div class="bg-white p-6 rounded-xl shadow-lg border">
        <form action="{{ route('admin.manage.index') }}" method="GET">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                    <label for="keyword" class="block text-sm font-medium text-gray-700">Nama / Email / NIP</label>
                    <input type="text" name="keyword" id="keyword" value="{{ request('keyword') }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500" placeholder="Cari admin...">
                </div>
                <div>
                    <label for="role" class="block text-sm font-medium text-gray-700">Peran</label>
                    <select name="role" id="role" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Peran</option>
                        @foreach($filterOptions['roles'] as $role)
                        <option value="{{ $role->value }}" @selected(request('role') == $role->value)>{{ $role->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label for="service_code" class="block text-sm font-medium text-gray-700">Dinas / Instansi</label>
                    <select name="service_code" id="service_code" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Dinas</option>
                        @foreach($filterOptions['services'] as $service)
                        <option value="{{ $service->code->value }}" @selected(request('service_code') == $service->code->value)>{{ $service->full_name }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="mt-6 flex items-center justify-end gap-x-4">
                <a href="{{ route('admin.manage.index') }}" class="text-sm font-semibold text-gray-600">Reset</a>
                <button type="submit" class="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Filter</button>
            </div>
        </form>
    </div>

    {{-- POINT 3: ADMIN LIST TABLE --}}
    <div class="bg-white shadow-lg rounded-xl border overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class_="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peran & Dinas</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diperbarui</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($admins as $admin)
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                    <img class="h-10 w-10 rounded-full object-cover" src="{{ $admin->profile_picture_path ? Storage::url($admin->profile_picture_path) : 'https://ui-avatars.com/api/?name=' . urlencode($admin->full_name) }}" alt="">
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">{{ $admin->full_name }}</div>
                                    <div class="text-sm text-gray-500">NIP: {{ $admin->nip }}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ $admin->email }}</div>
                            <div class="text-sm text-gray-500">{{ $admin->phone }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">{{ $admin->role->name }}</div>
                            <div class="text-sm text-gray-500">{{ $admin->serviceProfile->full_name ?? ($admin->role === \App\Enums\RoleAdministratorEnum::SystemAdmin ? 'System Admin' : 'N/A') }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ $admin->updated_at->diffForHumans() }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <form action="{{ route('admin.manage.accept', $admin) }}" method="POST" class="inline">
                                @csrf
                                <button type="button" 
                                        onclick="openConfirmationModal(
                                            'Konfirmasi Penerimaan', 
                                            'Anda yakin ingin mengubah status administrator \'{{ addslashes($admin->full_name) }}\' menjadi Aktif?', 
                                            this.closest('form')
                                        )" 
                                        class="text-green-600 hover:text-green-900" title="Terima">
                                    Terima
                                </button>
                            </form>

                            <form action="{{ route('admin.manage.reject', $admin) }}" method="POST" class="inline">
                                @csrf
                                <button type="button" 
                                        onclick="openConfirmationModal(
                                            'Konfirmasi Penolakan', 
                                            'Anda yakin ingin menolak dan menghapus administrator \'{{ addslashes($admin->full_name) }}\'?', 
                                            this.closest('form')
                                        )" 
                                        class="text-red-600 hover:text-red-900" title="Tolak">
                                    Tolak
                                </button>
                            </form>
                        </td>
                    </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-sm text-gray-500">
                        Tidak ada administrator yang ditemukan.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="pt-4">
        {{ $admins->links() }}
    </div>
</div>

<div id="confirmationModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 hidden">
    <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mt-2" id="modalTitle">Konfirmasi Aksi</h3>
            <div class="mt-2 px-7 py-3">
                <p class="text-sm text-gray-500" id="modalMessage">
                    Apakah Anda yakin ingin melanjutkan aksi ini?
                </p>
            </div>
            <div class="items-center px-4 py-3">
                <button id="modalConfirmButton" class="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Ya, Lanjutkan
                </button>
                <button id="modalCancelButton" class="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 ml-2">
                    Batal
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    // Ambil elemen-elemen modal
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmButton = document.getElementById('modalConfirmButton');
    const cancelButton = document.getElementById('modalCancelButton');

    // Variabel untuk menyimpan form yang akan di-submit
    let formToSubmit = null;

    /**
     * Fungsi untuk membuka modal dengan konten dinamis.
     * @param {string} title - Judul untuk modal.
     * @param {string} message - Pesan konfirmasi.
     * @param {HTMLFormElement} form - Elemen form yang akan di-submit.
     */
    function openConfirmationModal(title, message, form) {
        // Simpan referensi form
        formToSubmit = form;

        // Atur konten modal
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // Tampilkan modal
        modal.classList.remove('hidden');
    }

    // Fungsi untuk menutup modal
    function closeModal() {
        // Kosongkan referensi form
        formToSubmit = null;
        // Sembunyikan modal
        modal.classList.add('hidden');
    }

    // Tambahkan event listener untuk tombol konfirmasi
    confirmButton.addEventListener('click', () => {
        // Jika ada form yang disimpan, submit form tersebut
        if (formToSubmit) {
            formToSubmit.submit();
        }
    });

    // Tambahkan event listener untuk tombol batal
    cancelButton.addEventListener('click', () => {
        closeModal();
    });

    // Opsional: Tutup modal jika pengguna mengklik di luar area konten modal
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
</script>
@endsection