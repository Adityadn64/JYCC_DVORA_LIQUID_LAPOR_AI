@extends('../layouts.app')

@section('title', 'Detail Laporan #' . $report->id)

@section('content')
    @if (session('success'))
        <div class="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 mb-6 rounded-md" role="alert">
            <p class="font-bold">Berhasil!</p>
            <p>{{ session('success') }}</p>
        </div>
    @endif

    @php
        $previousUrl = url()->previous();
        $path = parse_url($previousUrl, PHP_URL_PATH);
        $lastSegment = basename($path);
    @endphp

    <div class="bg-white shadow-lg rounded-xl overflow-hidden">
        <div class="p-6 md:p-8">
            @if($lastSegment !== 'lacak')
                <a href="{{ route('report.track.index') }}" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer">
                    <- Kembali ke halaman pencarian
                </a>
            @else
                <a onClick="history.back();" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer">
                    <- Kembali ke halaman pencarian
                </a>
            @endif
            <br><br>
            <hr><br>

            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div>
                    <h2 class="text-sm font-semibold text-blue-600 uppercase">Laporan ID: {{ $report->id }}</h2>
                    <h1 class="text-3xl font-bold text-gray-900 mt-1">{{ $report->title }}</h1>
                    <p class="mt-2 text-sm text-gray-500">Dibuat pada: {{ $report->created_at->format('d F Y, H:i') }}</p>
                </div>
                <div class="mt-4 sm:mt-0">
                    @php
                        $statusesArray = $report->statuses; 
                        
                        $status = !empty($statusesArray) ? end($statusesArray) : 'unknown'; 
                        
                        $statusClass = [
                            'pending' => 'bg-yellow-100 text-yellow-800',
                            'process' => 'bg-cyan-100 text-cyan-800',
                            'finished' => 'bg-green-100 text-green-800',
                            'rejected' => 'bg-red-100 text-red-800',
                        ][$status] ?? 'bg-gray-100 text-gray-800';
                    @endphp
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {{ $statusClass }}">
                        Status: {{ ucfirst($status) }}
                    </span>
                </div>
            </div>
        </div>

        <div class="border-t border-gray-200">
            <dl class="divide-y divide-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">
                    <dt class="text-sm font-medium text-gray-500">Prioritas</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2 font-semibold">{{ ucfirst($report->priority->value) }}</dd>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">
                    <dt class="text-sm font-medium text-gray-500">Kategori</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2">{{ $report->category->value }}</dd>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">
                    <dt class="text-sm font-medium text-gray-500">Dinas Terkait</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2">{{ $report->serviceProfile->full_name }}</dd>
                </div>
                 <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">
                    <dt class="text-sm font-medium text-gray-500">Lokasi</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2">{{ $report->address }}</dd>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">
                    <dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2 whitespace-pre-wrap">{{ $report->description }}</dd>
                </div>
                
                @if($report->media && !empty($report->media->files_path))
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">
                    <dt class="text-sm font-medium text-gray-500">Bukti Media</dt>
                    <dd class="text-sm text-gray-900 md:col-span-2">
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            @foreach($report->media->files_path as $index => $path)
                                @php
                                    // Dapatkan tipe file dari array files_type berdasarkan index
                                    $fileType = $report->media->files_type[$index] ?? '';
                                @endphp

                                @if(Illuminate\Support\Str::startsWith($fileType, 'image/'))
                                    <a href="{{ asset('storage/' . $path) }}" target="_blank">
                                        <img src="{{ asset('storage/' . $path) }}" alt="Bukti Laporan" class="rounded-lg shadow-md hover:opacity-80 transition-opacity aspect-square object-cover">
                                    </a>
                                @elseif(Illuminate\Support\Str::startsWith($fileType, 'video/'))
                                    <video controls class="rounded-lg shadow-md w-full aspect-square object-cover">
                                        <source src="{{ asset('storage/' . $path) }}" type="{{ $fileType }}">
                                        Browser Anda tidak mendukung tag video.
                                    </video>
                                @endif
                            @endforeach
                        </div>
                    </dd>
                </div>
                @endif
            </dl>
        </div>
    </div>
    
    <div class="mt-10">
        <h3 class="text-xl font-bold text-gray-900 mb-6">Riwayat Penanganan Laporan</h3>
        <div class="flow-root">
            <ul role="list" class="-mb-8">
                @foreach($report->statuses as $index => $status)
                    <li>
                        <div class="relative pb-8">
                            @if(!$loop->last)
                                <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            @endif
                            <div class="relative flex space-x-3 items-start">
                                <div>
                                    <span class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                        <svg class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                        </svg>
                                    </span>
                                </div>
                                <div class="min-w-0 flex-1 pt-1.5">
                                    <div class="flex flex-wrap justify-between items-center gap-2">
                                        <p class="text-sm font-semibold text-gray-800">
                                            Status diubah menjadi: <span class="font-bold text-blue-600">{{ ucfirst($status) }}</span>
                                        </p>
                                        <p class="text-xs text-gray-500 whitespace-nowrap">
                                            {{ \Carbon\Carbon::parse($report->review_timestamps[$index])->format('d M Y, H:i') }}
                                        </p>
                                    </div>
                                    <div class="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                                        <p><strong>Catatan:</strong> {{ $report->review_notes[$index] ?? 'Tidak ada catatan.' }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                @endforeach
            </ul>
        </div>
    </div>
@endsection