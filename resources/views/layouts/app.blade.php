<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Lapor.ai') - Pelaporan Publik Cerdas Jawa Timur</title>
    <meta name="description" content="@yield('description', 'Lapor.ai adalah platform terintegrasi yang merevolusi cara masyarakat berinteraksi dengan pemerintah. Dengan memanfaatkan kecerdasan buatan (AI), setiap laporan yang masuk akan dianalisis dan diteruskan secara otomatis ke dinas yang berwenang, memastikan setiap masalah ditangani oleh ahlinya tanpa penundaan.')"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">
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
                {{-- KIRI: LOGO --}}
                <div class="flex-shrink-0">
                    <a href="{{ route('home') }}" class="text-2xl font-bold text-blue-600">
                        Lapor<span class="text-gray-900">.ai</span>
                    </a>
                </div>

                {{-- KANAN: NAVIGASI DESKTOP --}}
                <div class="hidden md:flex items-center space-x-8">
                    <nav class="flex space-x-8">
                        <a href="{{ route('home') }}" class="font-medium text-gray-600 hover:text-blue-600 transition-colors">Beranda</a>
                        <a href="{{ route('report.create') }}" class="font-medium text-gray-600 hover:text-blue-600 transition-colors">Buat Laporan</a>
                        <a href="{{ route('report.track.index') }}" class="font-medium text-gray-600 hover:text-blue-600 transition-colors">Lacak Laporan</a>
                    </nav>

                    @guest('administrators')
                        <div>
                            <a href="{{ route('login') }}" class="inline-block border border-gray-300 rounded-md px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                Masuk
                            </a>
                        </div>
                    @endguest

                    @auth('administrators')
                        {{-- POINT 1: DESKTOP ADMIN DROPDOWN (HOVER) --}}
                        <div class="relative inline-block text-left group">
                            <button type="button" class="flex justify-center items-center gap-x-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                @php $adminUser = Auth::guard('administrators')->user(); @endphp
                                <img class="h-8 w-8 rounded-full object-cover" src="{{ $adminUser->profile_picture_path ? Storage::url($adminUser->profile_picture_path) : 'https://ui-avatars.com/api/?name=' . urlencode($adminUser->full_name) }}" alt="Admin">
                                <span>Menu Admin</span>
                                <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <div class="absolute right-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block transition-all duration-300">
                                <div class="py-1">
                                    <a href="{{ route('admin.dashboard') }}" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Dasbor</a>
                                    <a href="{{ route('admin.analytics') }}" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Analisis Laporan</a>
                                    <a href="{{ route('admin.profile.show') }}" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Profil</a>
                                    @if(Auth::user()->role === \App\Enums\RoleAdministratorEnum::SystemAdmin)
                                        <a href="{{ route('admin.manage.index') }}" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Kelola Admin</a>
                                        <a href="{{ route('admin.performance.index') }}" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Performa Admin</a>
                                    @endif
                                    <form method="POST" action="{{ route('logout') }}">
                                        @csrf
                                        <button type="submit" class="text-red-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Logout</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    @endauth
                </div>

                {{-- TOMBOL HAMBURGER MOBILE --}}
                <div class="md:hidden flex items-center">
                    <button id="hamburger-button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                        <span class="sr-only">Buka menu utama</span>
                        <svg id="hamburger-icon" class="h-6 w-6" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        <svg id="close-icon" class="h-6 w-6 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <div id="mobile-menu" class="md:hidden hidden">
            <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <a href="{{ route('home') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Beranda</a>
                <a href="{{ route('report.create') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Buat Laporan</a>
                <a href="{{ route('report.track.index') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Lacak Laporan</a>
            </div>
            <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
                @guest('administrators')
                    <a href="{{ route('login') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                        Masuk
                    </a>
                @endguest

                @auth('administrators')
                    <div>
                        <button id="mobile-admin-menu-button" class="w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                            <span>Menu Admin</span>
                            <svg id="mobile-admin-menu-icon" class="h-5 w-5 transform transition-transform" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <div id="mobile-admin-menu-content" class="pl-4 mt-1 space-y-1 hidden">
                            <a href="{{ route('admin.dashboard') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Dasbor</a>
                            <a href="{{ route('admin.analytics') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Analisis Laporan</a>
                            <a href="{{ route('admin.profile.show') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Profil</a>
                            @if(Auth::user()->role === \App\Enums\RoleAdministratorEnum::SystemAdmin)
                                    <a href="{{ route('admin.manage.index') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Kelola Admin</a>
                                    <a href="{{ route('admin.performance.index') }}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Performa Admin</a>
                                @endif
                            <form method="POST" action="{{ route('logout') }}" class="block">
                                @csrf
                                <button type="submit" class="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-900 hover:bg-gray-100">Logout</button>
                            </form>
                        </div>
                    </div>
                @endauth
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

    {{-- POINT 3: JAVASCRIPT --}}
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            // Logika untuk Hamburger utama
            const hamburgerButton = document.getElementById('hamburger-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const hamburgerIcon = document.getElementById('hamburger-icon');
            const closeIcon = document.getElementById('close-icon');

            hamburgerButton.addEventListener('click', function () {
                mobileMenu.classList.toggle('hidden');
                hamburgerIcon.classList.toggle('hidden');
                closeIcon.classList.toggle('hidden');
            });

            // Logika untuk Dropdown Admin di Mobile
            const mobileAdminMenuButton = document.getElementById('mobile-admin-menu-button');
            const mobileAdminMenuContent = document.getElementById('mobile-admin-menu-content');
            const mobileAdminMenuIcon = document.getElementById('mobile-admin-menu-icon');

            // Cek apakah elemen ada sebelum menambahkan listener (untuk tamu yang tidak login)
            if (mobileAdminMenuButton) {
                mobileAdminMenuButton.addEventListener('click', function() {
                    mobileAdminMenuContent.classList.toggle('hidden');
                    mobileAdminMenuIcon.classList.toggle('rotate-180');
                });
            }
        });
    </script>
</body>
</html>