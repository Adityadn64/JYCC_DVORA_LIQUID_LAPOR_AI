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
        $serviceProfile = ServiceProfile::inRandomOrder()->first();
        $role = $this->faker->randomElement(RoleAdministratorEnum::cases());

        return [
            'service_code' => $role === RoleAdministratorEnum::BaseAdmin ? $serviceProfile->code : null,
            'nip' => $this->faker->unique()->numerify('##################'), // 18 digit NIP
            'full_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->unique()->phoneNumber(),
            'password_hash' => Hash::make('password'), // Default password
            'profile_picture_path' => null,
            'kta_scan_path' => null,
            'role' => $role,
            'status' => $this->faker->randomElement(AdminStatusEnum::cases()),
        ];
    }
}