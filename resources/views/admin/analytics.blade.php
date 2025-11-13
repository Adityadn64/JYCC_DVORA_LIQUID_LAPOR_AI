@extends('../layouts.app')

@section('title', 'Dasbor Analisis BI')

@section('content')

{{-- POINT 1: FILTER & KONTROL UTAMA --}}
<div class="mb-8 bg-white p-6 rounded-xl shadow-lg border">
    <h2 class="text-xl font-semibold text-gray-900 mb-4">Filter Analisis</h2>
    <form action="{{ route('admin.analytics') }}" method="GET">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {{-- Rentang Tanggal --}}
            <div>
                <label for="date_start" class="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <input type="date" name="date_start" id="date_start" value="{{ request('date_start') }}"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
            </div>
            <div>
                <label for="date_end" class="block text-sm font-medium text-gray-700">Tanggal Akhir</label>
                <input type="date" name="date_end" id="date_end" value="{{ request('date_end') }}"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
            </div>

            {{-- Kategori & Status --}}
            <div>
                <label for="category" class="block text-sm font-medium text-gray-700">Kategori</label>
                <select name="category" id="category"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Semua Kategori</option>
                    @foreach($filterOptions['categories'] as $cat)
                    <option value="{{ $cat->value }}" @selected(request('category')==$cat->value)>{{ $cat->name }}
                    </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Semua Status</option>
                    @foreach($filterOptions['statuses'] as $stat)
                    <option value="{{ $stat->value }}" @selected(request('status')==$stat->value)>{{ $stat->name }}
                    </option>
                    @endforeach
                </select>
            </div>

            {{-- Dinas & Admin --}}
            <div>
                <label for="service_code" class="block text-sm font-medium text-gray-700">Dinas / Instansi</label>
                <select name="service_code" id="service_code"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Semua Dinas</option>
                    @foreach($filterOptions['service_profiles'] as $service)
                    <option value="{{ $service->code->value }}" @selected(request('service_code')==$service->
                        code->value)>{{ $service->full_name }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label for="assignee_admin_id" class="block text-sm font-medium text-gray-700">Admin Penanggung
                    Jawab</label>
                <select name="assignee_admin_id" id="assignee_admin_id"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Semua Admin</option>
                    @foreach($filterOptions['admins'] as $admin)
                    <option value="{{ $admin->id }}" @selected(request('assignee_admin_id')==$admin->id)>{{
                        $admin->full_name }}</option>
                    @endforeach
                </select>
            </div>

            {{-- Prioritas & Lokasi --}}
            <div>
                <label for="priority" class="block text-sm font-medium text-gray-700">Tingkat Prioritas</label>
                <select name="priority" id="priority"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Semua Prioritas</option>
                    @foreach($filterOptions['priorities'] as $prio)
                    <option value="{{ $prio->value }}" @selected(request('priority')==$prio->value)>{{ $prio->name }}
                    </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label for="location" class="block text-sm font-medium text-gray-700">Lokasi (Kota/Kec/Alamat)</label>
                <input type="text" name="location" id="location" value="{{ request('location') }}"
                    placeholder="Contoh: Surabaya"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
            </div>
        </div>
        <div class="mt-6 flex items-center justify-end gap-x-4">
            <a href="{{ route('admin.analytics') }}" class="text-sm font-semibold text-gray-600">Reset Filter</a>
            <button type="submit"
                class="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Terapkan</button>
        </div>
    </form>
</div>

{{-- POINT 12: INSIGHT OTOMATIS --}}
@if(!empty($insights))
<div class="mb-8 space-y-2">
    <h3 class="text-lg font-semibold text-gray-800">💡 Insight Otomatis</h3>
    @foreach($insights as $insight)
    <div class="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md">
        <p>{{ $insight }}</p>
    </div>
    @endforeach
</div>
@endif


{{-- POINT 2: STATISTIK UMUM (KPI) --}}
<div class="mb-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Statistik Umum</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl shadow border">
            <p class="text-sm font-medium text-gray-500">Total Laporan (Filtered)</p>
            <p class="mt-1 text-3xl font-bold text-blue-600">{{ $kpiStats['total'] }}</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow border">
            <p class="text-sm font-medium text-gray-500">Waktu Penyelesaian Rata-rata</p>
            <p class="mt-1 text-3xl font-bold text-green-500">{{ $kpiStats['avg_resolution_hours'] ?
                number_format($kpiStats['avg_resolution_hours'], 1) . ' Jam' : 'N/A' }}</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow border">
            <p class="text-sm font-medium text-gray-500">Tingkat Penyelesaian</p>
            <p class="mt-1 text-3xl font-bold text-cyan-500">{{ number_format($kpiStats['completion_rate'], 1) }}%</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow border">
            <p class="text-sm font-medium text-gray-500">Perbandingan Periode</p>
            <p class="mt-1 text-3xl font-bold text-purple-500">{{ $kpiStats['total_this_month'] }} <span
                    class="text-lg text-gray-500">vs {{ $kpiStats['total_last_month'] }}</span></p>
        </div>
    </div>
</div>

{{-- POINT 3: ANALISIS TREN & POLA WAKTU --}}
<div class="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tren Laporan Masuk</h3>
        <div class="h-80"><canvas id="mainTrendChart"></canvas></div>
    </div>
    <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tren Perbandingan Status</h3>
        <div class="h-80"><canvas id="statusTrendChart"></canvas></div>
    </div>
    {{-- Placeholder untuk Kalender Heatmap --}}
</div>

{{-- POINT 4: ANALISIS DISTRIBUSI & SEBARAN --}}
<div class="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="bg-white p-6 rounded-xl shadow border lg:col-span-2">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Peta Sebaran Laporan</h3>
        <div class="h-96 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
            [Placeholder: Peta Interaktif (memerlukan Leaflet.js / Mapbox)]
        </div>
    </div>
    <div class="space-y-8">
        <div class="bg-white p-6 rounded-xl shadow border">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Distribusi Kategori</h3>
            <div class="h-40"><canvas id="categoryDistributionChart"></canvas></div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow border">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Distribusi Dinas</h3>
            <div class="h-40"><canvas id="dinasDistributionChart"></canvas></div>
        </div>
    </div>
</div>

{{-- POINT 5, 6, 7, 8: TABEL ANALISIS --}}
<div class="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
    {{-- POINT 5: KINERJA ADMIN --}}
    <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Kinerja Admin</h3>
        <div class="overflow-x-auto max-h-96">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left">Admin</th>
                        <th class="px-4 py-2 text-left">Selesai</th>
                        <th class="px-4 py-2 text-left">Rata2 Waktu (Jam)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($adminPerformance as $admin)
                    <tr>
                        <td class="px-4 py-2 font-medium">{{ $admin->full_name }}</td>
                        <td class="px-4 py-2">{{ $admin->total_selesai }}</td>
                        <td class="px-4 py-2">{{ $admin->avg_hours ? number_format($admin->avg_hours, 1) : 'N/A' }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="3" class="px-4 py-4 text-center text-gray-500">Tidak ada data.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    {{-- POINT 6: KINERJA DINAS --}}
    <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Kinerja Dinas</h3>
        <div class="overflow-x-auto max-h-96">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left">Dinas</th>
                        <th class="px-4 py-2 text-left">Total</th>
                        <th class="px-4 py-2 text-left">Selesai</th>
                        <th class="px-4 py-2 text-left">Rata2 Waktu (Jam)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($dinasPerformance as $dinas)
                    <tr>
                        <td class="px-4 py-2 font-medium">{{ $dinas->full_name }}</td>
                        <td class="px-4 py-2">{{ $dinas->total_laporan }}</td>
                        <td class="px-4 py-2">{{ $dinas->total_selesai }}</td>
                        <td class="px-4 py-2">{{ $dinas->avg_hours ? number_format($dinas->avg_hours, 1) : 'N/A' }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="4" class="px-4 py-4 text-center text-gray-500">Tidak ada data.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    {{-- POINT 7: KATEGORI --}}
    <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Waktu Penyelesaian per Kategori (Terlama)</h3>
        <div class="overflow-x-auto max-h-96">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left">Kategori</th>
                        <th class="px-4 py-2 text-left">Rata2 Waktu (Jam)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($categoryAnalysis as $cat)
                    <tr>
                        <td class="px-4 py-2 font-medium">{{ $cat->category->value ?? 'N/A' }}</td>
                        <td class="px-4 py-2">{{ number_format($cat->avg_hours, 1) }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="2" class="px-4 py-4 text-center text-gray-500">Tidak ada data.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    {{-- POINT 8: LOKASI --}}
    <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">"Hot Zone" Kecamatan</h3>
        <div class="overflow-x-auto max-h-96">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left">Kecamatan</th>
                        <th class="px-4 py-2 text-left">Total Laporan</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($locationAnalysis as $loc)
                    <tr>
                        <td class="px-4 py-2 font-medium">{{ $loc->district }}</td>
                        <td class="px-4 py-2">{{ $loc->total }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="2" class="px-4 py-4 text-center text-gray-500">Tidak ada data.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="bg-white p-6 rounded-xl shadow-lg border">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Data Grid Laporan</h2>
        <div>
            <button type="button"
                id="downloadCSVButton"
                class="border border-gray-300 rounded-md px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Export CSV
            </button>
            <button type="button"
                id="downloadExcelButton"
                class="border border-gray-300 rounded-md px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Export Excel
            </button>

            <script>
                async function exportFile(exportType) {
                    try {
                        if (!["CSV", "Excel"].includes(exportType)) throw Error("No valid export type!");

                        const response = await fetch('/admin/analytics/export-reports', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({ exportType })
                        });

                        if (!response.ok) {
                            throw new Error(`Network response was not ok: ${response.statusText}`);
                        }

                        const disposition = response.headers.get('Content-Disposition');
                        let filename = `reports.${
                            exportType === "CSV"
                                ? 'csv'
                                : (
                                    exportType === "Excel"
                                        ? 'xlsx'
                                        : 'data'
                                )}`;

                        if (disposition && disposition.indexOf('attachment') !== -1) {
                            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                            const matches = filenameRegex.exec(disposition);
                            if (matches != null && matches[1]) {
                                filename = matches[1].replace(/['"]/g, '');
                            }
                        }

                        const blob = await response.blob();

                        const url = window.URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = filename;

                        document.body.appendChild(a);
                        a.click();

                        window.URL.revokeObjectURL(url);
                        a.remove();

                    } catch (error) {
                        console.error('Download failed:', error);
                    }
                }

                document.getElementById("downloadCSVButton").addEventListener("click", async () => { return await exportFile("CSV") });
                document.getElementById("downloadExcelButton").addEventListener("click", async () => { return await exportFile("Excel") });
            </script>
        </div>
    </div>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dinas</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diperbarui</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($reports as $report)
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">#{{ $report->id }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">{{ $report->title }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        @php
                            $statusesArray = $report->statuses;
                            $status = !empty($statusesArray) ? end($statusesArray) : 'unknown';
                            $statusClass = [
                                'pending' => 'bg-yellow-100 text-yellow-800',
                                'process' => 'bg-cyan-100 text-cyan-800',
                                'finished' => 'bg-green-100 text-green-800',
                                'rejected' => 'bg-red-100 text-red-800',
                            ][$status] ?? 'bg-gray-100 text-gray-800';
                        @endphp
                        <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {{ $statusClass }}">
                            {{ ucfirst($status) }}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ $report->serviceProfile->full_name ?? 'N/A' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ $report->assignee->full_name ?? 'Belum Ditugaskan' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ $report->updated_at->diffForHumans() }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href="{{ route('report.track.show', $report) }}" target="_blank" class="text-blue-600 hover:text-blue-900">Lihat Detail</a>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-sm text-gray-500">
                        Tidak ada laporan yang ditemukan dengan filter ini.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="pt-4">
        {{ $reports->links() }}
    </div>
</div>

{{-- POINT 11: PANEL DETAIL (STRUKTUR HTML) --}}
{{-- Ini bisa jadi modal atau drawer. Untuk saat ini, kita link ke halaman detail --}}

@endsection

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
    const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#38BDF8', '#EC4899'];

    // POINT 3: Main Trend Chart
    const mainTrendCtx = document.getElementById('mainTrendChart');
    if (mainTrendCtx) {
        new Chart(mainTrendCtx, {
            type: 'line',
            data: {
                labels: @json($trendData['main_trend_labels']),
                datasets: [{
                    label: 'Laporan Masuk',
                    data: @json($trendData['main_trend_data']),
                    borderColor: defaultColors[0],
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    // POINT 3: Status Trend Chart
    const statusTrendCtx = document.getElementById('statusTrendChart');
    if (statusTrendCtx) {
        new Chart(statusTrendCtx, {
            type: 'line', // Bisa diubah ke 'bar' dengan opsi stacked: true
            data: {
                labels: @json($trendData['status_trend_labels']),
                datasets: [
                    {
                        label: 'Pending',
                        data: @json($trendData['status_trend_pending']),
                        borderColor: defaultColors[2],
                        backgroundColor: 'rgba(245, 159, 11, 0.1)',
                        fill: true, tension: 0.3
                    },
                    {
                        label: 'Proses',
                        data: @json($trendData['status_trend_process']),
                        borderColor: defaultColors[5],
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        fill: true, tension: 0.3
                    },
                    {
                        label: 'Selesai',
                        data: @json($trendData['status_trend_finished']),
                        borderColor: defaultColors[1],
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true, tension: 0.3
                    }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { position: 'bottom' } } }
        });
    }
    
    const categoryDistCtx = document.getElementById('categoryDistributionChart');
    if (categoryDistCtx) {
        new Chart(categoryDistCtx, {
            type: 'doughnut',
            data: {
                labels: @json($distributionData['category_labels']),
                datasets: [{
                    data: @json($distributionData['category_data']),
                    backgroundColor: defaultColors,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const dinasDistCtx = document.getElementById('dinasDistributionChart');
    if (dinasDistCtx) {
        new Chart(dinasDistCtx, {
            type: 'pie',
            data: {
                labels: @json($distributionData['dinas_labels']),
                datasets: [{
                    data: @json($distributionData['dinas_data']),
                    backgroundColor: defaultColors,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
});
</script>
@endpush