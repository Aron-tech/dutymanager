<?php

use App\Enums\ExamQuestionTypeEnum;
use App\Models\Exam;
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
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Exam::class)->references('id')->on('exams');
            $table->text('text');
            $table->enum('type', ExamQuestionTypeEnum::getOptions());
            $table->jsonb('config')->nullable();
            $table->integer('score');
            $table->integer('time_limit')->nullable();
            $table->integer('position');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_questions');
    }
};
