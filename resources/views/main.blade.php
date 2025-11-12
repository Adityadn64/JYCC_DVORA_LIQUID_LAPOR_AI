@extends('layouts.app')

@section('content')
    <div class="space-y-20">
        <section class="text-center">
            <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Layanan Pelaporan Publik Cerdas
            </h1>
            <p class="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                Punya keluhan atau melihat masalah di sekitar Anda? Laporkan dengan mudah dan pantau perkembangannya secara transparan. Didukung oleh AI untuk penanganan yang lebih cepat dan tepat.
            </p>
            <div class="mt-10 flex justify-center items-center space-x-4">
                <a href="{{ route('report.create') }}" class="inline-block bg-blue-600 text-white rounded-lg px-8 py-3 text-base font-medium hover:bg-blue-700 transition-all shadow-lg">
                    Buat Laporan Sekarang
                </a>
                <a href="{{ route('report.track.index') }}" class="inline-block bg-white text-gray-700 rounded-lg px-8 py-3 text-base font-medium hover:bg-gray-100 transition-all shadow-lg border">
                    Lacak Laporan
                </a>
            </div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div class="text-left">
                <h2 class="text-3xl font-bold text-gray-900">Apa itu Lapor.ai?</h2>
                <p class="mt-4 text-gray-600 leading-relaxed">
                    Lapor.ai adalah platform terintegrasi yang merevolusi cara masyarakat berinteraksi dengan pemerintah. Dengan memanfaatkan kecerdasan buatan (AI), setiap laporan yang masuk akan dianalisis dan diteruskan secara otomatis ke dinas yang berwenang, memastikan setiap masalah ditangani oleh ahlinya tanpa penundaan.
                </p>
                <p class="mt-4 text-gray-600 leading-relaxed">
                    Visi kami adalah menciptakan ekosistem pelayanan publik yang responsif, transparan, dan berbasis data untuk Jawa Timur yang lebih baik.
                </p>
            </div>
            <div>
                <div class="bg-white p-6 rounded-xl shadow-lg border">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Riwayat Laporan Bulanan</h3>
                    <div class="h-64">
                        <canvas id="reportHistoryChart"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <section class="text-center">
            <h2 class="text-3xl font-bold text-gray-900">Manfaat Utama</h2>
            <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white p-8 rounded-xl shadow-lg border text-left">
                    <h3 class="text-xl font-semibold text-gray-900">Cepat & Tepat Sasaran</h3>
                    <p class="mt-2 text-gray-600">AI kami secara otomatis merutekan laporan Anda ke dinas yang benar, memotong birokrasi dan mempercepat waktu respons awal.</p>
                </div>
                <div class="bg-white p-8 rounded-xl shadow-lg border text-left">
                    <h3 class="text-xl font-semibold text-gray-900">Transparan & Akuntabel</h3>
                    <p class="mt-2 text-gray-600">Lacak setiap progres penanganan laporan Anda secara real-time. Tidak ada lagi ketidakpastian.</p>
                </div>
                <div class="bg-white p-8 rounded-xl shadow-lg border text-left">
                    <h3 class="text-xl font-semibold text-gray-900">Berbasis Data</h3>
                    <p class="mt-2 text-gray-600">Semua laporan menjadi data berharga bagi pemerintah untuk menganalisis masalah dan membuat kebijakan yang lebih baik.</p>
                </div>
            </div>
        </section>

        <section class="text-center">
            <h2 class="text-3xl font-bold text-gray-900">Analisis Laporan Terkini</h2>
            <p class="mt-2 max-w-2xl mx-auto text-md text-gray-600">
                Statistik semua laporan yang telah masuk ke dalam sistem kami secara transparan.
            </p>
            <div class="mt-8 bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
                <p class="text-4xl font-bold text-indigo-600">{{ $totalReports }}</p>
                <p class="mt-1 text-sm font-medium text-gray-500">Total Diterima</p>
            </div>
            <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-4xl font-bold text-yellow-500">{{ $pendingReports }}</p>
                    <p class="mt-1 text-sm font-medium text-gray-500">Pending</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-4xl font-bold text-blue-500">{{ $processReports }}</p>
                    <p class="mt-1 text-sm font-medium text-gray-500">Diproses</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-4xl font-bold text-green-500">{{ $finishedReports }}</p>
                    <p class="mt-1 text-sm font-medium text-gray-500">Selesai</p>
                </div>
                 <div class="bg-white p-6 rounded-lg shadow">
                    <p class="text-4xl font-bold text-red-500">{{ $rejectedReports }}</p>
                    <p class="mt-1 text-sm font-medium text-gray-500">Ditolak</p>
                </div>
            </div>
        </section>
        
        <section>
            <div class="text-center mb-10">
                <h2 class="text-3xl font-bold text-gray-900">Sebaran Laporan & Kota Teraktif</h2>
                <p class="mt-2 max-w-2xl mx-auto text-md text-gray-600">
                    Lihat sebaran laporan dan kota/kabupaten dengan jumlah laporan terbanyak di Jawa Timur.
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">   
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border text-left">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">
                        Kota/Kabupaten Teratas
                    </h3>

                    @php
                        $maxReports = $topCities->first()?->total_reports ?? 1;
                    @endphp

                    <ul class="space-y-5">
                        @forelse($topCities as $cityData)
                            <li>
                                <div class="flex justify-between items-center text-sm mb-1.5">
                                    <span class="font-medium text-gray-700">
                                        <span class="font-bold mr-2">{{ $loop->iteration }}.</span>
                                        {{ $cityData->city }}
                                    </span>
                                    <span class="font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                        {{ $cityData->total_reports }} Laporan
                                    </span>
                                </div>
                                
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    @php
                                        $percentage = ($cityData->total_reports / $maxReports) * 100;
                                    @endphp
                                    <div class="bg-blue-600 h-2 rounded-full" style="width: {{ $percentage }}%"></div>
                                </div>
                            </li>
                        @empty
                            <li class="text-center text-gray-500 py-4">
                                Belum ada data laporan yang masuk.
                            </li>
                        @endforelse
                    </ul>
                </div>

                <div class="lg:col-span-3 bg-white p-4 rounded-xl shadow-lg border">
                    <iframe
                        title="Provinsi Jawa Timur"
                        class="w-full h-96 rounded-lg"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4056129.9937991137!2d108.55671036673036!3d-6.882883454757672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2da393f79feeb5c5%3A0x1030bfbca7cb850!2sJawa%20Timur%2C%20Indonesia!5e0!3m2!1sid!2sus!4v1762349460077!5m2!1sid!2sus"
                        style="border:0;" 
                        allowfullscreen="" 
                        loading="lazy" 
                        referrerpolicy="no-referrer-when-downgrade">
                    ></iframe>
                </div>
            </div>
        </section>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const ctx = document.getElementById('reportHistoryChart');

            const labels = @json($chartLabels);
            const data = @json($chartData);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Pending',
                            data: data.pending,
                            borderColor: 'rgb(234, 179, 8)', // yellow-500
                            backgroundColor: 'rgba(234, 179, 8, 0.1)',
                            tension: 0.3,
                            fill: true,
                        },
                        {
                            label: 'Process',
                            data: data.process,
                            borderColor: 'rgb(59, 130, 246)', // blue-500
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.3,
                            fill: true,
                        },
                        {
                            label: 'Finished',
                            data: data.finished,
                            borderColor: 'rgb(34, 197, 94)', // green-500
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            tension: 0.3,
                            fill: true,
                        },
                        {
                            label: 'Rejected',
                            data: data.rejected,
                            borderColor: 'rgb(239, 68, 68)', // red-500
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.3,
                            fill: true,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                // Hanya tampilkan angka bulat di sumbu Y
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            });
        });
    </script>
@endsection