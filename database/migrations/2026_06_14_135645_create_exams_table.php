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
            $table->string('guild_id', 30);
            $table->string('name');
            $table->string('description');
            $table->integer('required_min_percentage')->nullable();
            $table->integer('max_attempts')->default(1);
            $table->boolean('random_questions')->default(false);
            $table->integer('time_limit')->nullable();
            $table->boolean('auto_grade')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->jsonb('data')->nullable();
            $table->boolean('visible')->default(false);
            $table->timestamps();

            $table->foreign('guild_id')->references('id')->on('guilds')->onDelete('restrict');
            $table->index('guild_id');
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
