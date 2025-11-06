<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignee_admin_id')->nullable()->constrained('administrators')->onDelete('set null');
            $table->foreignId('service_id')->constrained('service_profiles')->onDelete('restrict');
            $table->string('service_code');
            $table->string('reporter_name')->nullable();
            $table->string('reporter_contact')->nullable();
            $table->string('title');
            $table->text('description');
            $table->string('address');
            $table->string('city');
            $table->string('district');
            $table->string('category');
            $table->string('priority');
            $table->timestamps();
            $table->softDeletes();

            $table->json('statuses')->nullable();
            $table->json('review_timestamps')->nullable();
            $table->json('reviewing_admin_ids')->nullable();
            $table->json('review_notes')->nullable();
            $table->json('agreements_history')->nullable();
            $table->json('disagreements_history')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};