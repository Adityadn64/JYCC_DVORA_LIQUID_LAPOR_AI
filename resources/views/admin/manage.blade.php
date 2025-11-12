@extends('layouts.app')

@section('title', 'Manajemen Administrator')

@section('content')
<div class="space-y-8">

    {{-- POINT 1: HEADER & QUICK ACTIONS --}}
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
            <h1 class="text-3xl font-bold text-gray-900">Manajemen Administrator</h1>
            <p class="mt-2 text-gray-600">Buat, edit, dan kelola semua akun administrator sistem.</p>
        </div>
        <div class="flex-shrink-0 flex gap-2">
            <button type="button" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50" disabled>
                Import CSV (TBD)
            </button>
            <button type="button" onclick="openModal('createAdminModal')" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                + Buat Admin Baru
            </button>
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
                    <label for="status" class="block text-sm font-medium text-gray-700">Status Akun</label>
                    <select name="status" id="status" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Semua Status</option>
                        @foreach($filterOptions['statuses'] as $status)
                        <option value="{{ $status->value }}" @selected(request('status') == $status->value)>{{ $status->name }}</option>
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
                        <div class="text-sm text-gray-500">{{ $admin->serviceProfile->full_name ?? ($admin->role === \App\Enums\RoleAdministratorEnum::SystemAdmin ? 'Super Admin' : 'N/A') }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        @if($admin->status === \App\Enums\AdminStatusEnum::Active)
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>
                        @elseif($admin->status === \App\Enums\AdminStatusEnum::Pending)
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        @else
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Nonaktif</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ $admin->updated_at->diffForHumans() }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onclick="openActivityDrawer({{ $admin->id }})" class="text-gray-500 hover:text-gray-900" title="Lihat Aktivitas">Aktivitas</button>
                        <button onclick="openEditModal({{ $admin->toJson() }})" class="text-blue-600 hover:text-blue-900" title="Edit">Edit</button>
                        <form action="{{ route('admin.manage.toggleStatus', $admin) }}" method="POST" class="inline" onsubmit="return confirm('Anda yakin ingin mengubah status admin ini?');">
                            @csrf
                            <button type="submit" class="text-yellow-600 hover:text-yellow-900" title="Aktif/Nonaktifkan">
                                {{ $admin->status === \App\Enums\AdminStatusEnum::Active ? 'Nonaktifkan' : 'Aktifkan' }}
                            </button>
                        </form>
                        <form action="{{ route('admin.manage.sendReset', $admin) }}" method="POST" class="inline" onsubmit="return confirm('Kirim link reset password ke admin ini?');">
                            @csrf
                            <button type="submit" class="text-red-600 hover:text-red-900" title="Reset Password">Reset Pass</button>
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


{{-- POINT 4: CREATE ADMIN MODAL --}}
<div id="createAdminModal" class="fixed inset-0 z-50 hidden" style="background-color: rgba(0,0,0,0.5);">
    <div class="flex items-center justify-center min-h-screen">
        <form action="{{ route('admin.manage.store') }}" method="POST" enctype="multipart/form-data" class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full m-4 max-h-screen overflow-y-auto">
            @csrf
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">Buat Admin Baru</h3>
                <button type="button" onclick="closeModal('createAdminModal')" class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="create_full_name" class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" id="create_full_name" name="full_name" value="{{ old('full_name') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="create_nip" class="block text-sm font-medium text-gray-700">NIP</label>
                        <input type="text" id="create_nip" name="nip" value="{{ old('nip') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="create_email" class="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="create_email" name="email" value="{{ old('email') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="create_phone" class="block text-sm font-medium text-gray-700">No. Telepon</label>
                        <input type="tel" id="create_phone" name="phone" value="{{ old('phone') }}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="create_password" class="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" id="create_password" name="password" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="create_password_confirmation" class="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
                        <input type="password" id="create_password_confirmation" name="password_confirmation" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="create_role" class="block text-sm font-medium text-gray-700">Peran</label>
                        <select name="role" id="create_role" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                            @foreach($filterOptions['roles'] as $role)
                            <option value="{{ $role->value }}" @selected(old('role') == $role->value)>{{ $role->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="create_status" class="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="create_status" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                            @foreach($filterOptions['statuses'] as $status)
                            <option value="{{ $status->value }}" @selected(old('status') == $status->value)>{{ $status->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="create_service_code" class="block text-sm font-medium text-gray-700">Dinas</label>
                        <select name="service_code" id="create_service_code" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">(Hanya untuk Base Admin)</option>
                            @foreach($filterOptions['services'] as $service)
                            <option value="{{ $service->code->value }}" @selected(old('service_code') == $service->code->value)>{{ $service->full_name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="create_profile_picture" class="block text-sm font-medium text-gray-700">Foto Profil (Opsional)</label>
                        <input type="file" id="create_profile_picture" name="profile_picture" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                    </div>
                    <div>
                        <label for="create_kta_scan" class="block text-sm font-medium text-gray-700">Scan KTA (Opsional)</label>
                        <input type="file" id="create_kta_scan" name="kta_scan" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                    </div>
                </div>
                <div class="pt-6 text-right">
                    <button type="button" onclick="closeModal('createAdminModal')" class="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan Admin</button>
                </div>
            </div>
        </form>
    </div>
</div>

{{-- POINT 4: EDIT ADMIN MODAL --}}
<div id="editAdminModal" class="fixed inset-0 z-50 hidden" style="background-color: rgba(0,0,0,0.5);">
    <div class="flex items-center justify-center min-h-screen">
        <form id="editAdminForm" method="POST" enctype="multipart/form-data" class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full m-4 max-h-screen overflow-y-auto">
            @csrf
            @method('PUT')
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold">Edit Admin</h3>
                <button type="button" onclick="closeModal('editAdminModal')" class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div class="space-y-4">
                {{-- Fields sama dengan create, tapi tanpa password --}}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="edit_full_name" class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" id="edit_full_name" name="full_name" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="edit_nip" class="block text-sm font-medium text-gray-700">NIP</label>
                        <input type="text" id="edit_nip" name="nip" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="edit_email" class="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="edit_email" name="email" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="edit_phone" class="block text-sm font-medium text-gray-700">No. Telepon</label>
                        <input type="tel" id="edit_phone" name="phone" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="edit_role" class="block text-sm font-medium text-gray-700">Peran</label>
                        <select name="role" id="edit_role" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                            @foreach($filterOptions['roles'] as $role)
                            <option value="{{ $role->value }}">{{ $role->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="edit_status" class="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="edit_status" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                            @foreach($filterOptions['statuses'] as $status)
                            <option value="{{ $status->value }}">{{ $status->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label for="edit_service_code" class="block text-sm font-medium text-gray-700">Dinas</label>
                        <select name="service_code" id="edit_service_code" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">(Hanya untuk Base Admin)</option>
                            @foreach($filterOptions['services'] as $service)
                            <option value="{{ $service->code->value }}">{{ $service->full_name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="edit_profile_picture" class="block text-sm font-medium text-gray-700">Foto Profil (Opsional)</label>
                        <input type="file" id="edit_profile_picture" name="profile_picture" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                        <small id="edit_profile_picture_info" class="text-xs text-gray-500"></small>
                    </div>
                    <div>
                        <label for="edit_kta_scan" class="block text-sm font-medium text-gray-700">Scan KTA (Opsional)</label>
                        <input type="file" id="edit_kta_scan" name="kta_scan" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                        <small id="edit_kta_scan_info" class="text-xs text-gray-500"></small>
                    </div>
                </div>
                <div class="pt-6 text-right">
                    <button type="button" onclick="closeModal('editAdminModal')" class="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                    <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Perbarui Admin</button>
                </div>
            </div>
        </form>
    </div>
</div>

{{-- POINT 8: ACTIVITY DRAWER --}}
<div id="activityDrawer" class="fixed inset-y-0 right-0 z-50 w-full max-w-lg transform translate-x-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
    <div class="flex justify-between items-center p-6 border-b">
        <h3 class_="text-xl font-semibold">Aktivitas Admin</h3>
        <button type="button" onclick="closeDrawer()" class="text-gray-400 hover:text-gray-600">&times;</button>
    </div>
    <div id="activityDrawerContent" class="p-6 overflow-y-auto h-full">
        <div id="activityLoader" class="text-center py-10">
            <p>Memuat data aktivitas...</p>
        </div>
        <div id="activityData" class="hidden space-y-6">
            <div class="flex items-center space-x-4">
                <img id="activity_avatar" class="h-16 w-16 rounded-full object-cover" src="" alt="">
                <div>
                    <h4 id="activity_name" class="text-lg font-bold"></h4>
                    <p id="activity_dinas" class="text-sm text-gray-600"></p>
                </div>
            </div>
            <dl class="space-y-2">
                <div class="flex justify-between"><dt class="text-sm text-gray-500">Email</dt><dd id="activity_email" class="text-sm font-medium"></dd></div>
                <div class="flex justify-between"><dt class="text-sm text-gray-500">Telepon</dt><dd id="activity_phone" class="text-sm font-medium"></dd></div>
                <div class="flex justify-between"><dt class="text-sm text-gray-500">Bergabung</dt><dd id="activity_created" class="text-sm font-medium"></dd></div>
            </dl>
            <div>
                <h5 class="text-md font-semibold text-gray-800 mb-3">10 Laporan Terakhir Ditangani</h5>
                <ul id="activity_reports_list" class="divide-y divide-gray-200 border rounded-md">
                    {{-- Diisi oleh JS --}}
                </ul>
            </div>
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
    
    function closeDrawer() {
        document.getElementById('activityDrawer').classList.add('translate-x-full');
    }

    // Jika ada error validasi, buka modal yang sesuai
    @if ($errors->any())
        @if (old('form_type') === 'create')
            openModal('createAdminModal');
        @elseif (old('form_type') === 'edit')
            openModal('editAdminModal');
        @endif
    @endif
    
    // Kirim 'hidden input' untuk menandai form mana yang disubmit
    // Ini membantu saat validasi gagal agar modal yang benar terbuka
    document.querySelector('#createAdminModal form').addEventListener('submit', function() {
        this.insertAdjacentHTML('beforeend', '<input type="hidden" name="form_type" value="create">');
    });
    document.querySelector('#editAdminModal form').addEventListener('submit', function() {
        this.insertAdjacentHTML('beforeend', '<input type="hidden" name="form_type" value="edit">');
    });

    // POINT 4: Populate Edit Modal
    function openEditModal(admin) {
        const form = document.getElementById('editAdminForm');
        form.action = `{{ url('admin/manage') }}/${admin.id}`;
        
        document.getElementById('edit_full_name').value = admin.full_name;
        document.getElementById('edit_nip').value = admin.nip;
        document.getElementById('edit_email').value = admin.email;
        document.getElementById('edit_phone').value = admin.phone;
        document.getElementById('edit_role').value = admin.role;
        document.getElementById('edit_status').value = admin.status;
        document.getElementById('edit_service_code').value = admin.service_code;

        const picInfo = document.getElementById('edit_profile_picture_info');
        picInfo.textContent = admin.profile_picture_path ? 'File saat ini: ' + admin.profile_picture_path.split('/').pop() : 'Belum ada foto.';
        
        const ktaInfo = document.getElementById('edit_kta_scan_info');
        ktaInfo.textContent = admin.kta_scan_path ? 'File saat ini: ' + admin.kta_scan_path.split('/').pop() : 'Belum ada KTA.';

        openModal('editAdminModal');
    }

    // POINT 8: Populate Activity Drawer
    async function openActivityDrawer(adminId) {
        const drawer = document.getElementById('activityDrawer');
        const loader = document.getElementById('activityLoader');
        const dataView = document.getElementById('activityData');
        const reportList = document.getElementById('activity_reports_list');

        drawer.classList.remove('translate-x-full');
        loader.classList.remove('hidden');
        dataView.classList.add('hidden');
        reportList.innerHTML = ''; // Kosongkan list

        try {
            const response = await fetch(`{{ url('admin/manage') }}/${adminId}/activity`);
            if (!response.ok) throw new Error('Gagal mengambil data');
            
            const data = await response.json();
            const admin = data.admin;
            
            document.getElementById('activity_avatar').src = admin.profile_picture_path 
                ? `{{ Storage::url('/') }}${admin.profile_picture_path}` 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.full_name)}`;
            
            document.getElementById('activity_name').textContent = admin.full_name;
            document.getElementById('activity_dinas').textContent = admin.service_profile ? admin.service_profile.full_name : (admin.role === 'system_admin' ? 'System Admin' : 'N/A');
            document.getElementById('activity_email').textContent = admin.email;
            document.getElementById('activity_phone').textContent = admin.phone;
            document.getElementById('activity_created').textContent = new Date(admin.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

            if (data.recent_reports.length > 0) {
                data.recent_reports.forEach(report => {
                    const status = report.statuses[report.statuses.length - 1] || 'unknown';
                    const updated = new Date(report.updated_at).toLocaleString('id-ID', { timeStyle: 'short', dateStyle: 'short' });
                    
                    reportList.innerHTML += `
                        <li class_="px-4 py-3">
                            <a href_="{{ url('report/track') }}/${report.id}" target="_blank" class="block hover:bg-gray-50">
                                <p class="text-sm font-medium text-gray-900 truncate">${report.title}</p>
                                <p class="text-xs text-gray-500">#${report.id} - Status: ${status} - ${updated}</p>
                            </a>
                        </li>`;
                });
            } else {
                reportList.innerHTML = '<li class="px-4 py-3 text-sm text-gray-500 text-center">Belum ada laporan.</li>';
            }

            loader.classList.add('hidden');
            dataView.classList.remove('hidden');

        } catch (error) {
            loader.textContent = 'Gagal memuat data. ' + error.message;
        }
    }
</script>
@endsection