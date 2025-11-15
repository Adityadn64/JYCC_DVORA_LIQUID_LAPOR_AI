<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Regency;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class RegionSeeder extends Seeder
{
    /**
     * Membaca dan mendekode file JSON data wilayah.
     * Karena provinsi hanya satu, kita langsung ambil array 'regencies'.
     * @return array
     */
    private function getRegionData(): array
    {
        $path = database_path('generator/region/output/region.json');
        if (!File::exists($path)) {
            $this->command->error("File region.json tidak ditemukan di path: {$path}");
            return [];
        }
        $json = File::get($path);
        $data = json_decode($json, true);
        // Langsung ambil array 'regencies' dari root JSON
        return $data['regencies'] ?? [];
    }

    /**
     * Mengonversi nama wilayah menjadi nama case Enum yang valid.
     * Contoh: "Kabupaten Bangkalan" -> "KABUPATEN_BANGKALAN"
     * @param string $name
     * @return string
     */
    private function toEnumName(string $name): string
    {
        $name = preg_replace('/[^A-Za-z0-9\s]/', ' ', $name);
        return strtoupper(trim(preg_replace('/\s+/', '_', $name)));
    }

    /**
     * Membuat konten string untuk file PHP Enum.
     * @param string $className
     * @param array $cases
     * @return string
     */
    private function createEnumFileContent(string $className, array $cases): string
    {
        $casesString = implode("\n", $cases);
        return <<<PHP
<?php

namespace App\Enums;

enum {$className}: string
{
{$casesString}
}

PHP;
    }

    /**
     * Fungsi utama untuk generate file Enum dari data wilayah.
     * @param array $regenciesData
     */
    private function generateEnums(array $regenciesData): void
    {
        $this->command->info('    Memulai proses generate file Enum...');
        
        $enumPath = app_path('Enums');
        File::ensureDirectoryExists($enumPath); // Pastikan direktori app/Enums ada

        $regencyCases = [];
        $districtCases = [];

        foreach ($regenciesData as $regency) {
            // 1. Buat nama case Enum untuk Kabupaten/Kota
            $regencyEnumName = $this->toEnumName($regency['name']);
            // 2. Gunakan KODE yang unik sebagai VALUE
            $regencyCases[] = "    case {$regencyEnumName} = '{$regency['code']}';";

            if (empty($regency['districts'])) continue;

            foreach ($regency['districts'] as $district) {
                // 3. Buat nama case Enum yang unik untuk Kecamatan (dengan prefix kabupaten)
                $districtEnumName = $regencyEnumName . '_' . $this->toEnumName($district['name']);
                // 4. Gunakan KODE Kecamatan yang unik sebagai VALUE
                $districtCases[] = "    case {$districtEnumName} = '{$district['code']}';";
            }
        }

        // Tulis konten ke file RegencyEnum.php
        $regencyEnumContent = $this->createEnumFileContent('RegencyEnum', $regencyCases);
        File::put($enumPath . '/RegencyEnum.php', $regencyEnumContent);
        $this->command->line('    -> File app/Enums/RegencyEnum.php berhasil dibuat/diperbarui.');

        // Tulis konten ke file DistrictEnum.php
        $districtEnumContent = $this->createEnumFileContent('DistrictEnum', $districtCases);
        File::put($enumPath . '/DistrictEnum.php', $districtEnumContent);
        $this->command->line('    -> File app/Enums/DistrictEnum.php berhasil dibuat/diperbarui.');
        
        $this->command->info('    Proses generate file Enum selesai.');
    }

    /**
     * Jalankan database seeder.
     */
    public function run(): void
    {
        $this->command->info('    Memulai proses seeder wilayah...');

        // Ambil data dari file JSON
        $regenciesData = $this->getRegionData();

        if (empty($regenciesData)) {
            $this->command->warn('Tidak ada data wilayah untuk diproses.');
            return;
        }

        // Panggil fungsi untuk generate file Enum SEBELUM seeding database
        $this->generateEnums($regenciesData);

        // Lanjutkan proses seeding ke database
        $this->command->info('    Memulai proses seeding data ke database...');

        DB::transaction(function () use ($regenciesData) {
            Schema::disableForeignKeyConstraints();
            District::truncate();
            Regency::truncate();
            Schema::enableForeignKeyConstraints();

            $this->command->getOutput()->progressStart(count($regenciesData));

            foreach ($regenciesData as $regencyData) {
                $regency = Regency::create([
                    'code' => $regencyData['code'],
                    'name' => $regencyData['name'],
                ]);

                if (!empty($regencyData['districts'])) {
                    $districtsToInsert = [];
                    foreach ($regencyData['districts'] as $districtData) {
                        $districtsToInsert[] = [
                            'regency_id' => $regency->id,
                            'code'       => $districtData['code'],
                            'name'       => $districtData['name'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    District::insert($districtsToInsert);
                }
                
                $this->command->getOutput()->progressAdvance();
            }
            
            $this->command->getOutput()->progressFinish();
        });

        $this->command->info('    Proses seeder wilayah telah selesai.');
    }
}