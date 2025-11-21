<?php

namespace Database\Factories;

use App\Enums\AdminStatusEnum;
use App\Enums\DistrictEnum;
use App\Enums\RegencyEnum;
use Illuminate\Support\Str;
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
        
        $allAdminIds = Administrator::pluck('id')->toArray();

        $matchingDistricts = [];
        $randomRegency = null;
        $allRegencies = RegencyEnum::cases();
        $allDistricts = DistrictEnum::cases();

        while (empty($matchingDistricts)) {
            $randomRegency = $this->faker->randomElement($allRegencies);
            
            $matchingDistricts = array_filter(
                $allDistricts,
                fn($district) => Str::startsWith($district->name, $randomRegency->name . '_')
            );
        }

        $randomDistrict = $this->faker->randomElement(array_values($matchingDistricts));

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
        $statusChangeHistory = [];
        $lastTimestamp = Carbon::instance($this->faker->dateTimeBetween('-1 month', '-2 weeks'));
        
        for ($i = 0; $i < $historyCount; $i++) {
            $currentTimestamp = Carbon::instance($this->faker->dateTimeBetween($lastTimestamp, Carbon::now()->subSecond()));
            $reviewTimestamps[] = $currentTimestamp->toDateTimeString();
            $lastTimestamp = $currentTimestamp;
            $reviewingAdminIds[] = $this->faker->randomElement($allAdminIds);
            $reviewNotes[] = $i === 0 ? "Laporan dibuat oleh sistem." : $this->faker->sentence();
            $statusChangeHistory[] = $i === 0 || in_array($statuses[$i], [ReportStatusEnum::Finished, ReportStatusEnum::Rejected])
                                    ? true : $this->faker->boolean();
        }

        $service_code = $serviceProfile->code;

        $assigneeAdmin = Administrator::where('role', RoleAdministratorEnum::BaseAdmin)
                                    ->where('service_code', $service_code)
                                    ->where('status', AdminStatusEnum::Active)
                                    ->inRandomOrder()
                                    ->first();

        if (!$assigneeAdmin) {
            $assigneeAdmin = Administrator::factory()->create([
                'role' => RoleAdministratorEnum::BaseAdmin,
            ]);
        }

        return [
            'assignee_admin_id' => $assigneeAdmin->id,
            'service_id' => $serviceProfile->id,
            'service_code' => $service_code,
            'reporter_name' => $this->faker->name(),
            'reporter_contact' => $this->faker->phoneNumber(),
            'title' => $this->faker->sentence(6),
            'description' => $this->faker->paragraph(3),
            'address' => $this->faker->streetAddress(),
            
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
            'status_change_history' => $statusChangeHistory,
        ];
    }
}