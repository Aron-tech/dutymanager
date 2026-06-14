<?php

use App\Models\ExamAttempt;
use App\Models\ExamQuestion;
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
        Schema::create('exam_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(ExamAttempt::class)->references('id')->on('exam_attempts');
            $table->foreignIdFor(ExamQuestion::class)->references('id')->on('exam_questions');
            $table->jsonb('row_answer')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->integer('earned_score')->nullable();
            $table->text('teacher_comment')->nullable();
            $table->boolean('is_manually_graded')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_attempt_answers');
    }
};
