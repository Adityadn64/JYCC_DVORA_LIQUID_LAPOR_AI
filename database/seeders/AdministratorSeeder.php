<?php

namespace Database\Seeders;

use App\Models\Administrator;
use Illuminate\Database\Seeder;

class AdministratorSeeder extends Seeder
{
    public function run(): void
    {
        Administrator::factory()->count(100)->create();
    }
}
