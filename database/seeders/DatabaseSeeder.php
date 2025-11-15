<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Models\District;
use App\Models\Regency;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Matikan pengecekan foreign key untuk memungkinkan truncate
        Schema::disableForeignKeyConstraints();

        // 2. Bersihkan tabel dalam urutan terbalik dari dependensi
        // (Anak -> Induk)
        Report::truncate();
        Administrator::truncate();
        ServiceProfile::truncate();
        
        District::truncate();
        Regency::truncate();

        // 3. Nyalakan kembali pengecekan foreign key
        Schema::enableForeignKeyConstraints();

        // 4. Panggil seeder untuk mengisi data dalam urutan yang benar
        // (Induk -> Anak)
        $this->call([
            ServiceProfileSeeder::class,
            AdministratorSeeder::class,
            ReportSeeder::class,
            RegionSeeder::class,
        ]);
    }
}