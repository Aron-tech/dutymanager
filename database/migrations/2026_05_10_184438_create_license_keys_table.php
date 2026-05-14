<?php

use App\Models\Guild;
use App\Models\User;
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
        Schema::create('license_keys', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('plan_type')->default('year');
            $table->timestamp('used_at')->nullable();
            $table->string('activated_by')->nullable();
            $table->foreign('activated_by')->references('id')->on('users');
            $table->string('guild_id');
            $table->foreign('guild_id')->references('id')->on('guilds');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('license_keys');
    }
};
