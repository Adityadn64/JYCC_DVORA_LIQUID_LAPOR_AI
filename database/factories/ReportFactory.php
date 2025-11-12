<?php

namespace Database\Factories;

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
        $assigneeAdmin = Administrator::inRandomOrder()->first() ?? Administrator::factory()->create();
        $allAdminIds = Administrator::pluck('id')->toArray();

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
            'city' => $this->faker->city(),
            'district' => $this->faker->state(),
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