@extends('layouts.app')

@section('title', 'Buat Laporan Baru')

@section('content')
    <div class="bg-white shadow-lg rounded-xl p-8 max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Formulir Pelaporan Publik</h1>
        <p class="text-gray-600 mb-8">Sampaikan laporan Anda dengan jelas dan akurat. Sistem AI kami akan membantumu.</p>

        @if ($errors->any())
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                <p class="font-bold">Terjadi Kesalahan</p>
                <ul class="mt-2">
                    @foreach ($errors->all() as $error)
                        <li class="list-disc ml-5">{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('report.store') }}" method="POST" enctype="multipart/form-data" class="space-y-6">
            @csrf
            <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Deskripsi Laporan <span class="text-red-500">*</span></label>
                <textarea id="description" name="description" rows="5"
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Jelaskan masalah yang Anda temukan secara detail. Contoh: Terdapat jalan berlubang yang membahayakan di depan Masjid Al-Ikhlas, sudah terjadi selama 2 minggu."
                    required>{{ old('description') }}</textarea>
                <p class="mt-2 text-xs text-gray-500">Semakin detail deskripsi Anda, semakin akurat analisis AI.</p>
            </div>

            <div>
                <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Lokasi Kejadian <span class="text-red-500">*</span></label>
                <input type="text" id="location" name="location" value="{{ old('location') }}"
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Contoh: Jl. Merdeka No. 10, Kelurahan Suka Maju, Kecamatan Jaya Baru" required>
            </div>

            <div>
                <label for="images" class="block text-sm font-medium text-gray-700 mb-1">Unggah Foto (Bukti) <span class="text-red-500">*</span></label>
                <input type="file" id="images" name="images[]" multiple accept="image/jpeg,image/png,image/jpg"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required>
                <p class="mt-2 text-xs text-gray-500">Anda bisa memilih lebih dari satu foto. Maksimal 2MB per foto.</p>
            </div>
            
            <div>
                <label for="videos" class="block text-sm font-medium text-gray-700 mb-1">Unggah Video (Opsional)</label>
                <input type="file" id="videos" name="videos[]" multiple accept="video/mp4"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100">
                <p class="mt-2 text-xs text-gray-500">Maksimal 10MB per video.</p>
            </div>
            
            <div class="pt-4">
                <button type="submit"
                    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Kirim Laporan
                </button>
            </div>
        </form>
    </div>
@endsection