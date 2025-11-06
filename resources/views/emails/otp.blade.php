<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Verifikasi Registrasi Lapor.ai</title>
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
                Lapor<span class="text-gray-900">.ai</span> Registrasi
            </h1>
        </div>

        <div class="p-6 sm:p-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Konfirmasi Akun Anda</h2>
            <p class="text-gray-600 mb-6">
                Gunakan kode di bawah ini untuk menyelesaikan proses registrasi Anda. Kode ini hanya valid untuk waktu yang terbatas.
            </p>
            
            <div class="mb-6">
                <div class="bg-blue-50 text-blue-700 text-4xl font-bold text-center py-4 px-6 rounded-lg tracking-widest border-2 border-dashed border-blue-200">
                    {{ $otp }}
                </div>
            </div>
            
            <p class="text-center text-sm text-gray-500">
                Kode ini akan kedaluwarsa dalam <span class="font-semibold">10 menit</span>.
            </p>
        </div>

        <div class="bg-yellow-50 border-t border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-yellow-800">Peringatan Keamanan</h3>
            <p class="mt-1 text-xs text-yellow-700">
                Jika Anda tidak merasa meminta kode ini, harap abaikan email ini. Jangan pernah membagikan kode verifikasi Anda kepada siapa pun.
            </p>
        </div>
    </div>

    <div class="text-center mt-8 text-xs text-gray-500">
        <p>&copy; {{ date('Y') }} Lapor.ai. Semua Hak Cipta Dilindungi.</p>
    </div>
</body>
</html>