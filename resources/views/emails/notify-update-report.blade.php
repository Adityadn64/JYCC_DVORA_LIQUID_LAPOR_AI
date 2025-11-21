<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Laporan Diperbarui</title>
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
            <p class="text-gray-600 mb-6">Status laporan Anda telah diperbarui. Terima kasih atas kesabaran Anda.</p>
            
            <div class="mb-6">
                <div class="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 mt-4 mr-4">
                        <!-- Example of dynamic status, assuming $report->status is available -->
                        <span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-green-200">
                            {{ $report->status ?? 'Verified' }} 
                        </span>
                    </div>

                    <p class="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">ID Tiket Anda</p>
                    <h2 class="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                        #{{ $report->id }}
                    </h2>
                    
                    <div class="border-t border-blue-200 pt-4">
                        <p class="font-bold text-gray-800 mb-1">{{ $report->title }}</p>
                        <p class="text-sm text-gray-600 flex items-center">
                            {{ $report->address }}, {{ $report->district_name }}, {{ $report->city_name }}
                        </p>
                    </div>
                </div>
            </div>

            <p class="text-gray-600 mb-4 text-sm">
                Laporan ini dikategorikan sebagai <strong>{{ $report->category }}</strong> dengan prioritas <strong>{{ $report->priority }}</strong>.
            </p>
            
            <div class="text-center mt-6">
                <a href="{{ "https://" . ($is_https ? "lapor-ai-jatim.vercel.app" : "localhost:3000") . "/report/" . $report->id . "/track" }}" class="inline-block bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-300 shadow-md">
                    Lacak Status Laporan
                </a>
            </div>
        </div>

        <div class="bg-green-50 border-t border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-green-800">Apa Selanjutnya?</h3>
            <ul class="mt-2 text-xs text-green-700 list-disc list-inside space-y-1">
                <!-- Example of dynamic next steps based on assumed $report->status -->
                <li>Status saat ini: <strong>{{ $report->status ?? 'Verified' }}</strong>.</li>
                <li>Pihak terkait sedang memproses laporan Anda.</li>
                <li>Anda akan menerima update status selanjutnya via email/WhatsApp.</li>
            </ul>
        </div>
    </div>

    <div class="text-center mt-8 text-xs text-gray-500">
        <p>&copy; {{ date('Y') }} Lapor.ai. Bersama Membangun Kota.</p>
    </div>
</body>
</html>
