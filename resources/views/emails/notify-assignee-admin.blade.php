<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifikasi Penugasan Lapor.ai</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
    </style>
</head>
<body class="bg-gray-100 p-4 sm:p-6">
    <div class="max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="text-center p-6 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-blue-600">
                Lapor<span class="text-gray-900">.ai</span> Penugasan
            </h1>
        </div>

        <div class="p-6 sm:p-8">
            <p class="text-gray-600 mb-6">Halo Admin, sistem telah menugaskan Anda untuk menangani laporan baru berikut:</p>
            
            <div class="mb-6">
                <div class="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6">
                    <div class="text-center mb-4">
                        <span class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                            {{ $report->priority }} Priority
                        </span>
                    </div>
                    
                    <h2 class="text-xl font-bold text-gray-800 text-center mb-2">
                        {{ $report->title }}
                    </h2>
                    
                    <div class="text-sm text-gray-600 text-center space-y-1">
                        <p><strong>ID Laporan:</strong> #{{ $report->id }}</p>
                        <p><strong>Kategori:</strong> {{ $report->category }}</p>
                        <p><strong>Lokasi:</strong> {{ $report->district }}, {{ $report->city }}</p>
                    </div>
                </div>
            </div>

            <p class="text-gray-600 mb-4"><strong>Deskripsi Singkat:</strong></p>
            <div class="bg-gray-50 p-4 rounded text-sm text-gray-700 italic mb-6 border border-gray-100">
                "{{ Str::limit($report->description, 150) }}"
            </div>
            
            <div class="text-center">
                <a href="{{ url('/admin/reports/' . $report->id) }}" class="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md">
                    Proses Laporan Sekarang
                </a>
            </div>
        </div>

        <div class="bg-yellow-50 border-t border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-yellow-800">Target Respon (SLA)</h3>
            <p class="mt-1 text-xs text-yellow-700">
                Mohon segera melakukan verifikasi awal atau update status laporan ini dalam waktu <strong>24 jam</strong> sesuai standar operasional prosedur (SOP).
            </p>
        </div>
    </div>

    <div class="text-center mt-8 text-xs text-gray-500">
        <p>&copy; {{ date('Y') }} Lapor.ai. Sistem Pengaduan Cerdas.</p>
    </div>
</body>
</html>