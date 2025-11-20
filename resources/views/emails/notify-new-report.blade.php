<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Berhasil Dibuat</title>
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
                Lapor<span class="text-gray-900">.ai</span> Notifikasi
            </h1>
        </div>

        <div class="p-6 sm:p-8">
            <p class="text-gray-600 mb-6">Halo <strong>{{ $report->reporter_name }}</strong>,</p>
            <p class="text-gray-600 mb-6">Terima kasih telah peduli dengan lingkungan Anda. Laporan Anda telah berhasil direkam oleh sistem kami dan sedang menunggu verifikasi admin.</p>
            
            <div class="mb-6">
                <div class="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 mt-4 mr-4">
                        <span class="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-yellow-200">
                            Pending
                        </span>
                    </div>

                    <p class="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">ID Tiket Anda</p>
                    <h2 class="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                        #{{ $report->id }}
                    </h2>
                    
                    <div class="border-t border-blue-200 pt-4">
                        <p class="font-bold text-gray-800 mb-1">{{ $report->title }}</p>
                        <p class="text-sm text-gray-600 flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            {{ $report->district }}, {{ $report->city }}
                        </p>
                    </div>
                </div>
            </div>

            <p class="text-gray-600 mb-4 text-sm">
                Laporan ini dikategorikan sebagai <strong>{{ $report->category }}</strong> dengan prioritas <strong>{{ $report->priority }}</strong>.
            </p>
            
            <div class="text-center mt-6">
                <a href="{{ url('/lacak?search_id=' . $report->id) }}" class="inline-block bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-300 shadow-md">
                    Lacak Status Laporan
                </a>
            </div>
        </div>

        <div class="bg-green-50 border-t border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-green-800">Apa Selanjutnya?</h3>
            <ul class="mt-2 text-xs text-green-700 list-disc list-inside space-y-1">
                <li>Admin akan memverifikasi laporan Anda.</li>
                <li>Jika valid, laporan akan diteruskan ke dinas terkait.</li>
                <li>Anda akan menerima update status selanjutnya via email/WhatsApp.</li>
            </ul>
        </div>
    </div>

    <div class="text-center mt-8 text-xs text-gray-500">
        <p>&copy; {{ date('Y') }} Lapor.ai. Bersama Membangun Kota.</p>
    </div>
</body>
</html>