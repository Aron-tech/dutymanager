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
        Schema::create('guild_users', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 30);
            $table->string('guild_id', 30);
            $table->string('ic_name');
            $table->jsonb('details');
            $table->boolean('is_request');
            $table->timestamp('accepted_at')->nullable();
            $table->string('added_by')->nullable();
            $table->json('cached_roles')->nullable();
            $table->dateTime('roles_last_synced')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('guild_id')->references('id')->on('guilds')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guild_users');
    }
};
