<?php

namespace Database\Factories;

use App\Models\Report;
use App\Models\ReportMediaWork;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ReportMediaWorkFactory extends Factory
{
    protected $model = ReportMediaWork::class;

    public function definition(): array
    {
        $dummyPath = storage_path('app/public/dummy/reports/work');
        $storageRelativePath = 'pu/dummy/reports/work';

        // Default value jika folder kosong/tidak ada
        $defaultReturn = [
            'report_id' => Report::factory(),
            'files_path' => [],
            'files_type' => [],
            'created_at' => now(),
        ];

        if (!File::exists($dummyPath)) {
            return $defaultReturn;
        }

        // 1. Ambil semua file dan pisahkan Image vs Video
        $allFiles = File::files($dummyPath);
        $imageFiles = [];
        $videoFiles = [];

        foreach ($allFiles as $file) {
            $mime = File::mimeType($file->getPathname());
            
            if (Str::startsWith($mime, 'image/')) {
                $imageFiles[] = $file;
            } elseif (Str::startsWith($mime, 'video/')) {
                $videoFiles[] = $file;
            }
        }

        // Jika tidak ada gambar sama sekali, kembalikan array kosong (karena syarat Minimal 1 Gambar)
        if (empty($imageFiles)) {
            return $defaultReturn;
        }

        // 2. Pilih Gambar (Minimal 1, Maksimal 3 misalnya)
        // Pastikan tidak meminta jumlah yang lebih besar dari jumlah file yang ada
        $imageCount = $this->faker->numberBetween(1, min(3, count($imageFiles)));
        $selectedImages = $this->faker->randomElements($imageFiles, $imageCount);

        // 3. Pilih Video (Max 1, Min 0)
        // Logic: Jika ada file video, ambil 1 dengan peluang 50% (boolean)
        $selectedVideo = [];
        if (!empty($videoFiles) && $this->faker->boolean(50)) {
            $selectedVideo = [$this->faker->randomElement($videoFiles)];
        }

        // 4. Gabungkan Gambar dan Video
        $finalFiles = array_merge($selectedImages, $selectedVideo);
        
        // (Opsional) Acak urutannya agar video tidak selalu di akhir
        shuffle($finalFiles);

        // 5. Susun format data
        $filesPath = [];
        $filesType = [];

        foreach ($finalFiles as $file) {
            $filesPath[] = $storageRelativePath . '/' . $file->getFilename();
            $filesType[] = File::mimeType($file->getPathname());
        }

        return [
            'report_id' => Report::factory(),
            'files_path' => $filesPath,
            'files_type' => $filesType,
            'created_at' => now(),
        ];
    }
}