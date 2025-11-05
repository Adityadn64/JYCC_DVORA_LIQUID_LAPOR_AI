<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('phone')->unique();
            $table->foreign('phone')->references('phone')->on('administrators')->onDelete('cascade');
            $table->string('otp_code');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_verifications');
    }
};