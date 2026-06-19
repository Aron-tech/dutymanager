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
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('guild_id');
            $table->foreign('guild_id')->references('id')->on('guilds')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->jsonb('required_roles')->nullable();
            $table->integer('max_attempts')->nullable();
            $table->integer('min_percent');
            $table->boolean('is_visible')->default(false);
            $table->boolean('auto_grade')->default(true);
            $table->integer('time_limit')->nullable();
            $table->jsonb('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
