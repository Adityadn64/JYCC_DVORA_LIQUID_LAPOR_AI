<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifikasi Pembaruan Lapor.ai</title>
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
                Lapor<span class="text-gray-900">.ai</span> Pembaruan Laporan
            </h1>
        </div>

        <div class="p-6 sm:p-8">
            <p class="text-gray-600 mb-6">Halo Admin, laporan berikut baru saja diperbarui. Penanggung jawab telah berubah:</p>
            
            <div class="mb-6">
                <div class="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-6">
                    <div class="text-center mb-4">
                        <span class="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                            Penanggung Jawab Diperbarui
                        </span>
                    </div>
                    
                    <h2 class="text-xl font-bold text-gray-800 text-center mb-2">
                        {{ $report->title }}
                    </h2>
                    
                    <div class="text-sm text-gray-600 text-center space-y-1">
                        <p><strong>ID Laporan:</strong> #{{ $report->id }}</p>
                        <p><strong>Status Saat Ini:</strong> {{ $report->current_status }}</p>
                    </div>
                </div>
            </div>

            {{-- ADMIN DETAILS SECTION --}}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-100 p-4 rounded-lg">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Admin Sebelumnya</p>
                    <p class="font-medium text-gray-800">{{ $last_admin->full_name }}</p>
                    <p class="text-sm text-gray-600">{{ $last_admin->email }}</p>
                    <p class="text-sm text-gray-600">{{ $last_admin->phone }}</p>
                </div>
                <div class="bg-blue-100 p-4 rounded-lg">
                    <p class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Admin Baru (Saat Ini)</p>
                    <p class="font-medium text-gray-800">{{ $new_admin->full_name }}</p>
                    <p class="text-sm text-gray-600">{{ $new_admin->email }}</p>
                    <p class="text-sm text-gray-600">{{ $new_admin->phone }}</p>
                </div>
            </div>

            <p class="text-gray-600 mb-4">Anda dapat melihat detail pembaruan dan memantau progresnya.</p>
           
            <div class="text-center">
                <a href="{{ "https://" . ($is_https ? "lapor-ai-jatim.vercel.app" : "localhost:3000") . "/report/" . $report->id . "/track" }}" class="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 shadow-md">
                    Lihat Detail Laporan
                </a>
            </div>
        </div>

        <div class="bg-blue-50 border-t border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-blue-800">Informasi</h3>
            <p class="mt-1 text-xs text-blue-700">
                Laporan ini sekarang sepenuhnya berada dalam penanganan admin baru yang ditunjuk di atas. Email ini hanya untuk tujuan pemantauan dan transparansi.
            </p>
        </div>
    </div>

    <div class="text-center mt-8 text-xs text-gray-500">
        <p>&copy; {{ date('Y') }} Lapor.ai. Sistem Pengaduan Cerdas.</p>
    </div>
</body>
</html>
