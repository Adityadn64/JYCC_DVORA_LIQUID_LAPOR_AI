<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Lapor.ai') - Pelaporan Publik Cerdas</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-100 text-gray-800">
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex-shrink-0">
                    <a href="{{ route('home') }}" class="text-2xl font-bold text-blue-600">
                        Lapor<span class="text-gray-900">.ai</span>
                    </a>
                </div>

                <div class="flex items-center space-x-8">
                    <nav class="hidden md:flex md:space-x-8">
                        <a href="{{ route('report.create') }}" class="font-medium text-gray-600 hover:text-blue-600 transition-colors">Buat Laporan</a>
                        <a href="{{ route('report.track.index') }}" class="font-medium text-gray-600 hover:text-blue-600 transition-colors">Lacak Laporan</a>
                    </nav>

                    @guest('administrators')
                        <div class="hidden md:block">
                            <a href="{{ route('login') }}" class="inline-block border border-gray-300 rounded-md px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                Masuk
                            </a>
                        </div>
                    @endguest

                    @auth('administrators')
                        <div class="hidden md:flex items-center space-x-4">
                            <a href="{{ route('admin.dashboard') }}" class="inline-block bg-blue-600 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-blue-700 transition-colors">
                                Dasbor
                            </a>
                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <button type="submit" class="text-sm font-medium text-gray-500 hover:text-gray-900">Logout</button>
                            </form>
                        </div>
                    @endauth
                </div>
            </div>
        </div>
    </header>

    <main class="py-12 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            @yield('content')
        </div>
    </main>

    <footer class="bg-white border-t">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
            <p>&copy; {{ date('Y') }} Lapor.ai. Didukung oleh Teknologi Cerdas untuk Pelayanan Publik Jawa Timur.</p>
        </div>
    </footer>
</body>
</html>