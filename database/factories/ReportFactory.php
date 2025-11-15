<?php

namespace Database\Factories;

// Import yang ditambahkan
use App\Enums\DistrictEnum;
use App\Enums\RegencyEnum;
use Illuminate\Support\Str;

// Import yang sudah ada
use App\Enums\RoleAdministratorEnum;
use App\Models\Administrator;
use App\Models\ServiceProfile;
use App\Enums\ReportStatusEnum;
use App\Enums\PriorityEnum;
use App\Enums\ReportCategoryEnum;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class ReportFactory extends Factory
{
    public function definition(): array
    {
        $serviceProfile = ServiceProfile::inRandomOrder()->first();
        $assigneeAdmin = Administrator::where('role', RoleAdministratorEnum::BaseAdmin)
                                    ->inRandomOrder()
                                    ->first();

        if (!$assigneeAdmin) {
            $assigneeAdmin = Administrator::factory()->create([
                'role' => RoleAdministratorEnum::BaseAdmin,
            ]);
        }
        
        $allAdminIds = Administrator::pluck('id')->toArray();

        // ===================================================================
        // LOGIKA BARU UNTUK MEMILIH KOTA DAN KECAMATAN YANG VALID
        // ===================================================================
        
        $matchingDistricts = [];
        $randomRegency = null;
        $allRegencies = RegencyEnum::cases();
        $allDistricts = DistrictEnum::cases();

        // Loop ini untuk memastikan kita mendapatkan kabupaten/kota yang memiliki data kecamatan,
        // mencegah error jika ada data yang tidak konsisten.
        while (empty($matchingDistricts)) {
            // Pilih satu kabupaten/kota secara acak
            $randomRegency = $this->faker->randomElement($allRegencies);
            
            // Filter kecamatan yang nama 'case' Enum-nya diawali dengan nama 'case' kabupaten/kota terpilih
            // Contoh: 'KABUPATEN_BANGKALAN_AROSBAYA' diawali dengan 'KABUPATEN_BANGKALAN_'
            $matchingDistricts = array_filter(
                $allDistricts,
                fn($district) => Str::startsWith($district->name, $randomRegency->name . '_')
            );
        }

        // Setelah ditemukan, pilih satu kecamatan secara acak dari daftar yang cocok
        // array_values() digunakan untuk mereset index array setelah di-filter
        $randomDistrict = $this->faker->randomElement(array_values($matchingDistricts));

        // ===================================================================
        // LOGIKA UNTUK STATUS HISTORY (TIDAK DIUBAH)
        // ===================================================================
        $historyCount = $this->faker->numberBetween(1, 5);
        $statuses = [];

        if ($historyCount === 1) {
            $statuses[] = ReportStatusEnum::Pending->value;
        } else {
            $statuses[] = ReportStatusEnum::Pending->value;
            for ($i = 0; $i < $historyCount - 2; $i++) {
                $statuses[] = ReportStatusEnum::Process->value;
            }
            $finalStatus = $this->faker->numberBetween(0, 100) % 3 !== 0
                ? (
                    $historyCount > 2 && $this->faker->numberBetween(0, 100) % 7 !== 0
                        ? ReportStatusEnum::Finished->value
                        : ReportStatusEnum::Rejected->value
                ) : ReportStatusEnum::Process->value;
            $statuses[] = $finalStatus;
        }

        $reviewTimestamps = [];
        $reviewingAdminIds = [];
        $reviewNotes = [];
        $agreementsHistory = [];
        $disagreementsHistory = [];
        $lastTimestamp = Carbon::instance($this->faker->dateTimeBetween('-1 month', '-2 weeks'));
        
        for ($i = 0; $i < $historyCount; $i++) {
            $currentTimestamp = Carbon::instance($this->faker->dateTimeBetween($lastTimestamp, Carbon::now()->subSecond()));
            $reviewTimestamps[] = $currentTimestamp->toDateTimeString();
            $lastTimestamp = $currentTimestamp;
            $reviewingAdminIds[] = $this->faker->randomElement($allAdminIds);
            $reviewNotes[] = $this->faker->sentence();
            $agreementsHistory[] = $this->faker->numberBetween(0, 9);
            $disagreementsHistory[] = $this->faker->numberBetween(0, 9);
        }

        return [
            'assignee_admin_id' => $assigneeAdmin->id,
            'service_id' => $serviceProfile->id,
            'service_code' => $serviceProfile->code,
            'reporter_name' => $this->faker->name(),
            'reporter_contact' => $this->faker->phoneNumber(),
            'title' => $this->faker->sentence(6),
            'description' => $this->faker->paragraph(3),
            'address' => $this->faker->streetAddress(),
            
            // --- PERUBAHAN UTAMA DI SINI ---
            // Menggunakan value (kode wilayah) dari Enum yang sudah dipilih secara acak
            'city' => $randomRegency->value,
            'district' => $randomDistrict->value,
            
            'category' => $this->faker->randomElement(ReportCategoryEnum::cases()),
            'priority' => $this->faker->randomElement(PriorityEnum::cases()),
            'created_at' => Carbon::parse($reviewTimestamps[0]),
            'updated_at' => Carbon::parse(end($reviewTimestamps)),
            'statuses' => $statuses,
            'review_timestamps' => $reviewTimestamps,
            'reviewing_admin_ids' => $reviewingAdminIds,
            'review_notes' => $reviewNotes,
            'agreements_history' => $agreementsHistory,
            'disagreements_history' => $disagreementsHistory,
        ];
    }
}