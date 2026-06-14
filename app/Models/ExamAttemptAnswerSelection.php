<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttemptAnswerSelection extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_attempt_answer_id',
        'exam_question_answer_id',
    ];

    public function examAttemptAnswer(): BelongsTo
    {
        return $this->belongsTo(ExamAttemptAnswer::class);
    }

    public function examQuestionAnswer(): BelongsTo
    {
        return $this->belongsTo(ExamQuestionAnswer::class);
    }
}
