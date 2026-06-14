<?php

use App\Enums\ExamStatusEnum;
use App\Models\Exam;
use App\Models\GuildUser;
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
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Exam::class)->references('id')->on('exams');
            $table->string('guild_id', 30);
            $table->string('user_id', 30);
            $table->foreignIdFor(GuildUser::class)->nullable()->references('id')->on('guild_users');
            $table->integer('total_score')->nullable();
            $table->float('percentage')->nullable();
            $table->enum('status', ExamStatusEnum::getOptions());
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->string('graded_by', 30)->nullable();

            $table->foreign('guild_id')->references('id')->on('guilds')->onDelete('restrict');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('graded_by')->references('id')->on('users')->nullOnDelete();
            $table->index('user_id');
            $table->index('guild_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
