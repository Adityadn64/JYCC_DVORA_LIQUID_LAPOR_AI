<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\ReportMediaUser;
use App\Models\ReportMediaWork;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        Report::factory()
            ->count(50)
            ->has(ReportMediaUser::factory(), 'userMedia') // Pastikan nama relasi di Model Report benar ('userMedia')
            ->has(ReportMediaWork::factory(), 'workMedia') // Pastikan nama relasi di Model Report benar ('workMedia')
            ->create();
    }
}