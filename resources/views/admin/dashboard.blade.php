@extends('layouts.app')

@section('title', 'Dasbor Administrator')

@section('content')
<div class="space-y-12">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Dasbor Analitik</h1>
        <p class="mt-2 text-gray-600">Ringkasan, tren, dan manajemen laporan Lapor.ai.</p>
    </div>

    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl shadow border"><p class="text-sm font-medium text-gray-500">Total Laporan</p><p class="mt-1 text-3xl font-bold text-blue-600">{{ $totalReports }}</p></div>
        <div class="bg-white p-6 rounded-xl shadow border"><p class="text-sm font-medium text-gray-500">Laporan Hari Ini</p><p class="mt-1 text-3xl font-bold text-green-500">+{{ $reportsToday }}</p></div>
        <div class="bg-white p-6 rounded-xl shadow border"><p class="text-sm font-medium text-gray-500">Waktu Penyelesaian Rata-rata</p><p class="mt-1 text-3xl font-bold text-cyan-500">{{ $avgResolutionTime }}</p></div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow border"><h3 class="text-lg font-semibold text-gray-800 mb-4">Tren Laporan Masuk (30 Hari Terakhir)</h3><div class="h-80"><canvas id="reportTrendChart"></canvas></div></div>
        <div class="bg-white p-6 rounded-xl shadow border"><h3 class="text-lg font-semibold text-gray-800 mb-4">Distribusi Laporan per Dinas</h3><div class="h-80"><canvas id="serviceDistributionChart"></canvas></div></div>
    </section>
    <section class="bg-white p-6 rounded-xl shadow border"><h3 class="text-lg font-semibold text-gray-800 mb-4">Top 5 Admin Produktif (Laporan Selesai)</h3><div class="h-80"><canvas id="topAdminsChart"></canvas></div></section>

    <section class="space-y-8">
        <div>
            <h2 class="text-2xl font-bold text-gray-900">Manajemen Laporan</h2>
            <p class="mt-1 text-gray-600">Cari, filter, dan kelola semua laporan yang masuk.</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow border">
             <form action="{{ route('admin.dashboard') }}" method="GET">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div><label for="search_term" class="block text-sm font-medium text-gray-700">Judul / Deskripsi</label><input type="text" name="search_term" id="search_term" value="{{ request('search_term') }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
                    <div><label for="search_location" class="block text-sm font-medium text-gray-700">Lokasi</label><input type="text" name="search_location" id="search_location" value="{{ request('search_location') }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
                    <div><label for="search_priority" class="block text-sm font-medium text-gray-700">Prioritas</label><select name="search_priority" id="search_priority" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">Semua</option>@foreach($priorities as $priority)<option value="{{ $priority->value }}" @selected(request('search_priority') == $priority->value)>{{ ucfirst($priority->name) }}</option>@endforeach</select></div>
                    <div><label for="search_admin" class="block text-sm font-medium text-gray-700">Ditangani Oleh</label><select name="search_admin" id="search_admin" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="">Semua</option>@foreach($admins as $admin)<option value="{{ $admin->id }}" @selected(request('search_admin') == $admin->id)>{{ $admin->full_name }}</option>@endforeach</select></div>
                    <div><label for="search_id" class="block text-sm font-medium text-gray-700">ID Laporan</label><input type="number" name="search_id" id="search_id" value="{{ request('search_id') }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></div>
                    <div><label for="sort" class="block text-sm font-medium text-gray-700">Urutkan</label><select name="sort" id="sort" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><option value="updated_at_desc" @selected(request('sort', 'updated_at_desc') == 'updated_at_desc')>Diperbarui (Terbaru)</option><option value="updated_at_asc" @selected(request('sort') == 'updated_at_asc')>Diperbarui (Terlama)</option><option value="created_at_desc" @selected(request('sort') == 'created_at_desc')>Dibuat (Terbaru)</option><option value="created_at_asc" @selected(request('sort') == 'created_at_asc')>Dibuat (Terlama)</option></select></div>
                </div>
                <div class="mt-6 flex items-center justify-end gap-x-4">
                    <a href="{{ route('admin.dashboard') }}" class="text-sm font-semibold text-gray-600">Reset</a>
                    <button type="submit" class="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Cari</button>
                </div>
             </form>
        </div>

        <div class="space-y-4">
            @forelse($reports as $report)
                <div class="bg-white shadow rounded-lg transition-all hover:shadow-lg">
                    <a href="{{ route('report.track.show', $report) }}" class="block p-5">
                        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-blue-600">Laporan #{{ $report->id }}</p><p class="text-lg font-bold text-gray-900 mt-1 truncate">{{ $report->title }}</p><p class="mt-2 text-sm text-gray-500 line-clamp-2">{{ $report->description }}</p></div>
                            <div class="mt-4 sm:mt-0 sm:ml-6 text-left sm:text-right flex-shrink-0">
                                @php
                                    $statusesArray = $report->statuses;
                                    $status = !empty($statusesArray) ? end($statusesArray) : 'unknown';
                                    $statusClass = ['pending' => 'bg-yellow-100 text-yellow-800', 'process' => 'bg-cyan-100 text-cyan-800', 'finished' => 'bg-green-100 text-green-800', 'rejected' => 'bg-red-100 text-red-800',][$status] ?? 'bg-gray-100 text-gray-800';
                                @endphp
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {{ $statusClass }}">{{ ucfirst($status) }}</span>
                                <p class="mt-2 text-xs text-gray-400">Diperbarui: {{ $report->updated_at->diffForHumans() }}</p>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                           <span><strong>Lokasi:</strong> {{ $report->city }}</span>
                           <span><strong>Prioritas:</strong> {{ ucfirst($report->priority->value) }}</span>
                           <span><strong>Penanggung Jawab:</strong> {{ $report->assignee?->full_name ?? 'Belum Ditugaskan' }}</span>
                        </div>
                    </a>
                </div>
            @empty
                <div class="text-center bg-white p-12 rounded-lg shadow"><h3 class="text-lg font-medium text-gray-900">Tidak Ada Laporan Ditemukan</h3><p class="mt-1 text-sm text-gray-500">Coba ubah filter pencarian Anda.</p></div>
            @endforelse
            <div class="pt-4">{{ $reports->withQueryString()->links() }}</div>
        </div>
    </section>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function () {
    const trendCtx = document.getElementById('reportTrendChart');
    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: @json($trendLabels),
            datasets: [{
                label: 'Laporan Masuk',
                data: @json($trendData),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    const serviceCtx = document.getElementById('serviceDistributionChart');
    new Chart(serviceCtx, {
        type: 'pie',
        data: {
            labels: @json($serviceLabels),
            datasets: [{
                label: 'Jumlah Laporan',
                data: @json($serviceData),
                backgroundColor: [ // Palet warna
                    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#38BDF8', '#EC4899'
                ],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    const adminCtx = document.getElementById('topAdminsChart');
    new Chart(adminCtx, {
        type: 'bar',
        data: {
            labels: @json($adminLabels),
            datasets: [{
                label: 'Laporan Selesai',
                data: @json($adminData),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false } } }
    });
});
</script>
@endsection