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
        Schema::create('guild_roles', function (Blueprint $table) {
            $table->id();
            $table->string('guild_id', 30);
            $table->string('role_id', 30);
            $table->jsonb('permissions');
            $table->timestamps();

            $table->foreign('guild_id')->references('id')->on('guilds');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guild_roles');
    }
};
