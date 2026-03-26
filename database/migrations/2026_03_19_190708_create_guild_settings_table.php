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
        Schema::create('guild_settings', function (Blueprint $table) {
            $table->string('guild_id')->primary();
            $table->jsonb('features');
            $table->jsonb('feature_settings');
            $table->jsonb('user_details_config')->nullable();
            $table->string('current_step')->default(0);
            $table->timestamps();

            $table->foreign('guild_id')->references('id')->on('guilds');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guild_settings');
    }
};
