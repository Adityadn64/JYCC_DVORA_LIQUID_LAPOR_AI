<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabel untuk menyimpan data Kabupaten/Kota
        Schema::create('regencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique(); // Contoh: 35.26
            $table->string('name');             // Contoh: Kabupaten Bangkalan
            $table->timestamps();
        });

        // Tabel untuk menyimpan data Kecamatan
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            // Relasi ke tabel regencies
            $table->foreignId('regency_id')->constrained('regencies')->onDelete('cascade');
            $table->string('code', 12)->unique(); // Contoh: 35.26.05
            $table->string('name');              // Contoh: Arosbaya
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regencies');
    }
};