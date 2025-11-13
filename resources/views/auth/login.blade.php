@extends('../layouts.app')

@section('title', 'Login Administrator')

@section('content')
    <div class="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">Admin Login</h1>
        <p class="text-gray-600 mb-8 text-center">Silakan masuk untuk mengakses dasbor.</p>

        @error('login_identifier')
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ $message }}</p>
            </div>
        @enderror
        @if(session('success'))
             <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{{ session('success') }}</p>
            </div>
        @endif

        <form action="{{ route('login.attempt') }}" method="POST" class="space-y-6">
            @csrf
            
            <div>
                <label for="login_identifier" class="block text-sm font-medium text-gray-700 mb-1">Email / Telepon / NIP</label>
                <input type="text" id="login_identifier" name="login_identifier" value="{{ old('login_identifier') }}" required autofocus
                    class="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm @error('login_identifier') border-red-500 @enderror">
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" id="password" name="password" required
                    class="block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>

            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <input id="remember" name="remember" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="remember" class="ml-2 block text-sm text-gray-900">Ingat saya</label>
                </div>
                <div class="text-sm">
                    <a href="{{ route('password.request') }}" class="font-medium text-blue-600 hover:text-blue-500">
                        Lupa password?
                    </a>
                </div>
            </div>
            
            <div class="pt-4">
                <button type="submit"
                    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Masuk
                </button>
            </div>
        </form>

        <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
                Belum punya akun?
                <a href="{{ route('register') }}" class="font-medium text-blue-600 hover:text-blue-500">
                    Daftar di sini
                </a>
            </p>
        </div>
    </div>
@endsection