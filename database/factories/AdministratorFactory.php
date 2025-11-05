<?php

namespace Database\Factories;

use App\Models\ServiceProfile;
use App\Enums\RoleAdministratorEnum;
use App\Enums\AdminStatusEnum;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class AdministratorFactory extends Factory
{
    public function definition(): array
    {
        // Ambil service code acak dari dinas yang sudah ada
        $serviceProfile = ServiceProfile::inRandomOrder()->first();

        return [
            'service_code' => $serviceProfile->code,
            'nip' => $this->faker->unique()->numerify('##################'), // 18 digit NIP
            'full_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->unique()->phoneNumber(),
            'password_hash' => Hash::make('password'), // Default password
            'profile_picture_path' => null,
            'kta_scan_path' => null,
            'role' => $this->faker->randomElement(RoleAdministratorEnum::cases()),
            'status' => $this->faker->randomElement(AdminStatusEnum::cases()),
        ];
    }
}