@extends('layouts.app')

@section('title', 'Analisis Performa')

@section('content')
<div class="space-y-8">

    {{-- POINT 1: SCOPE SELECTOR --}}
    <div class="bg-white p-6 rounded-xl shadow-lg border">
        <form action="{{ route('admin.performance.index') }}" method="GET">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Filter Performa</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {{-- Filter Utama (Scope) --}}
                <div>
                    <label for="scope_type" class="block text-sm font-medium text-gray-700">Fokus Analisis</label>
                    <select name="scope_type" id="scope_type" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="all" @selected(request('scope_type') == 'all')>Semua Laporan</option>
                        <option value="dinas" @selected(request('scope_type') == 'dinas')>Per Dinas</option>
                        <option value="admin" @selected(request('scope_type') == 'admin')>Per Admin</option>
                        <option value="district" @selected(request('scope_type') == 'district')>Per Kecamatan</option>
                    </select>
                </div>
                {{-- Filter Value (Dinamis) --}}
                <div>
                    <label for="scope_value" class="block text-sm font-medium text-gray-700">Pilihan</label>
                    <select name="scope_value" id="scope_value" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">(Pilih Fokus Dahulu)</option>
                        {{-- Opsi akan diisi oleh JS --}}
                    </select>
                </div>
                {{-- Filter Tanggal --}}
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="date_start" class="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                        <input type="date" name="date_start" id="date_start" value="{{ request('date_start', now()->subDays(30)->format('Y-m-d')) }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="date_end" class="block text-sm font-medium text-gray-700">Tanggal Akhir</label>
                        <input type="date" name="date_end" id="date_end" value="{{ request('date_end', now()->format('Y-m-d')) }}" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
            </div>
            <div class="mt-6 flex items-center justify-end gap-x-4">
                <a href="{{ route('admin.performance.index') }}" class="text-sm font-semibold text-gray-600">Reset</a>
                <button type="submit" class="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Analisis</button>
            </div>
        </form>
    </div>

    {{-- POINT 2: KPI UTAMA (CARDS) --}}
    <div class_l="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl shadow border"><p class="text-sm font-medium text-gray-500">Total Laporan</p><p class="mt-1 text-3xl font-bold text-blue-600">{{ $kpiCards->total }}</p></div>
        <div class="bg-white p-6 rounded-xl shadow border"><p class="text-sm font-medium text-gray-500">Laporan Hari Ini</p><p class="mt-1 text-3xl font-bold text-blue-500">{{ $kpiCards->today }}</p></div>
        <div class="bg-white p-6 rounded-xl shadow border"><p class="text-sm font-medium text-gray-500">Penyelesaian Tepat Waktu</p><p class="mt-1 text-3xl font-bold text-green-600">{{ number_format($kpiCards->sla_percent, 1) }}%</p></div>
        <div class="bg-white p-6 rounded-xl shadow border"><p class="text-sm font-medium text-gray-500">Rata-rata Penyelesaian</p><p class="mt-1 text-3xl font-bold text-cyan-500">{{ $kpiCards->avg_hours ? number_format($kpiCards->avg_hours, 1) . ' Jam' : 'N/A' }}</p></div>
    </div>

    {{-- POINT 3: TREND & VOLUME --}}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-xl shadow border">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Tren Laporan Masuk</h3>
            <div class="h-80"><canvas id="trendVolumeChart"></canvas></div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow border">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Tren Status Laporan</h3>
            <div class="h-80"><canvas id="trendStatusChart"></canvas></div>
        </div>
    </div>

    {{-- POINT 4 & 5: KINERJA DINAS & ADMIN --}}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {{-- Kinerja Dinas --}}
        <div class="bg-white p-6 rounded-xl shadow border">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Kinerja Dinas</h3>
            <div class="overflow-x-auto max-h-96">
                <table class="min-w-full divide-y divide-gray-200 text-sm">
                    <thead class="bg-gray-50"><tr>
                        <th class="px-4 py-2 text-left">Dinas</th>
                        <th class="px-4 py-2 text-left">Total</th>
                        <th class="px-4 py-2 text-left">Selesai</th>
                        <th class="px-4 py-2 text-left">Avg. Jam</th>
                        <th class="px-4 py-2 text-left">Lolos SLA (%)</th>
                    </tr></thead>
                    <tbody class="divide-y divide-gray-200">
                        @forelse($dinasPerformance as $dinas)
                        <tr>
                            <td class="px-4 py-2 font-medium text-gray-900">{{ $dinas->full_name }}</td>
                            <td class="px-4 py-2">{{ $dinas->total_laporan }}</td>
                            <td class="px-4 py-2">{{ $dinas->total_selesai }}</td>
                            <td class="px-4 py-2">{{ $dinas->avg_hours ? number_format($dinas->avg_hours, 1) : 'N/A' }}</td>
                            <td class="px-4 py-2 font-medium {{ $dinas->total_selesai > 0 && ($dinas->sla_breaches / $dinas->total_selesai) > 0.2 ? 'text-red-600' : 'text-green-600' }}">
                                {{ $dinas->total_selesai > 0 ? number_format(100 * (1 - ($dinas->sla_breaches / $dinas->total_selesai)), 1) : '100.0' }}%
                            </td>
                        </tr>
                        @empty
                        <tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Tidak ada data.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
        {{-- Kinerja Admin --}}
        <div class="bg-white p-6 rounded-xl shadow border">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Kinerja Admin</h3>
            <div class="overflow-x-auto max-h-96">
                <table class="min-w-full divide-y divide-gray-200 text-sm">
                    <thead class="bg-gray-50"><tr>
                        <th class_l="px-4 py-2 text-left">Admin</th>
                        <th class="px-4 py-2 text-left">Ditugaskan</th>
                        <th class="px-4 py-2 text-left">Selesai</th>
                        <th class="px-4 py-2 text-left">Avg. Jam</th>
                        <th class="px-4 py-2 text-left">Dibuka Lagi</th>
                    </tr></thead>
                    <tbody class="divide-y divide-gray-200">
                        @forelse($adminPerformance as $admin)
                        <tr>
                            <td class="px-4 py-2 font-medium text-gray-900">{{ $admin->full_name }}</td>
                            <td class="px-4 py-2">{{ $admin->total_ditugaskan }}</td>
                            <td class="px-4 py-2">{{ $admin->total_selesai }}</td>
                            <td class="px-4 py-2">{{ $admin->avg_hours ? number_format($admin->avg_hours, 1) : 'N/A' }}</td>
                            <td class="px-4 py-2">{{ $admin->reopened_count }}</td>
                        </tr>
                        @empty
                        <tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Tidak ada data.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- POINT 6 & 7: TOP ISSUES & SLA BREACHES --}}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {{-- Top Issues --}}
        <div class="bg-white p-6 rounded-xl shadow border">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Kategori Laporan</h3>
            <div class="overflow-x-auto max-h-96">
                <ul class="divide-y divide-gray-200">
                    @forelse($topCategories as $category)
                    <li class="flex justify-between items-center py-3">
                        <span class="text-sm font-medium text-gray-800">{{ $category->category->value ?? 'N/A' }}</span>
                        <span class="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{{ $category->total }}</span>
                    </li>
                    @empty
                    <li class="py-4 text-center text-gray-500">Tidak ada data.</li>
                    @endforelse
                </ul>
            </div>
        </div>
        {{-- Hot Alerts --}}
        <div class="bg-red-50 p-6 rounded-xl shadow border border-red-200">
            <h3 class="text-lg font-semibold text-red-800 mb-4">Laporan Mendesak (Lewat SLA & Aktif)</h3>
            <div class="overflow-x-auto max-h-96">
                <ul class="divide-y divide-red-200">
                    @forelse($slaBreaches as $report)
                    <li class="py-3">
                        <a href="{{ route('report.track.show', $report) }}" class="block hover:bg-red-100 p-2 rounded-md">
                            <div class="flex justify-between items-center">
                                <p class="text-sm font-medium text-red-900 truncate">{{ $report->title }} (#{{ $report->id }})</p>
                                <span class="text-xs font-bold text-red-700">{{ $report->priority->value }}</span>
                            </div>
                            <p class="text-xs text-red-700">Dibuat: {{ $report->created_at->diffForHumans() }} | Penanggung: {{ $report->assignee->full_name ?? 'N/A' }}</p>
                        </a>
                    </li>
                    @empty
                    <li class="py-4 text-center text-red-700">👍 Tidak ada laporan aktif yang melewati SLA.</li>
                    @endforelse
                </ul>
            </div>
        </div>
    </div>
</div>

{{-- Data JS untuk Opsi Filter Dinamis --}}
<script>
    const filterOptions = {
        dinas: @json($filterOptions['services']->map(fn($s) => ['value' => $s->code->value, 'text' => $s->full_name])),
        admin: @json($filterOptions['admins']->map(fn($a) => ['value' => $a->id, 'text' => $a->full_name])),
        district: @json($filterOptions['districts']->map(fn($d) => ['value' => $d, 'text' => $d])),
    };
    
    const scopeTypeEl = document.getElementById('scope_type');
    const scopeValueEl = document.getElementById('scope_value');
    
    function updateScopeValueOptions() {
        const type = scopeTypeEl.value;
        const options = filterOptions[type] || [];
        
        scopeValueEl.innerHTML = ''; // Kosongkan
        
        if (type === 'all' || options.length === 0) {
            scopeValueEl.disabled = true;
            scopeValueEl.innerHTML = '<option value="">(Tidak Perlu)</option>';
            return;
        }

        scopeValueEl.disabled = false;
        scopeValueEl.innerHTML = '<option value="">Semua</option>';
        
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            // Set 'selected' jika nilainya cocok dengan request
            if (opt.value == "{{ request('scope_value') }}") {
                optionEl.selected = true;
            }
            scopeValueEl.appendChild(optionEl);
        });
    }

    scopeTypeEl.addEventListener('change', updateScopeValueOptions);
    // Jalankan saat load
    document.addEventListener('DOMContentLoaded', updateScopeValueOptions);
</script>

{{-- Script untuk Chart.js --}}
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function () {
    const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#38BDF8'];

    // POINT 3: Tren Volume Chart
    const trendVolumeCtx = document.getElementById('trendVolumeChart');
    if (trendVolumeCtx) {
        new Chart(trendVolumeCtx, {
            type: 'line',
            data: {
                labels: @json($trendData['line_labels']),
                datasets: [{
                    label: 'Laporan Masuk',
                    data: @json($trendData['line_data']),
                    borderColor: defaultColors[0],
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }

    // POINT 3: Tren Status Chart
    const trendStatusCtx = document.getElementById('trendStatusChart');
    if (trendStatusCtx) {
        new Chart(trendStatusCtx, {
            type: 'bar', // Diubah jadi bar agar lebih jelas
            data: {
                labels: @json($trendData['stacked_labels']),
                datasets: [
                    {
                        label: 'Pending',
                        data: @json($trendData['stacked_pending']),
                        backgroundColor: defaultColors[2], // Kuning
                    },
                    {
                        label: 'Proses',
                        data: @json($trendData['stacked_process']),
                        backgroundColor: defaultColors[5], // Biru muda
                    },
                    {
                        label: 'Selesai',
                        data: @json($trendData['stacked_finished']),
                        backgroundColor: defaultColors[1], // Hijau
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
                    x: { stacked: true }
                },
                plugins: { legend: { position: 'bottom' } } 
            }
        });
    }
});
</script>
@endsection