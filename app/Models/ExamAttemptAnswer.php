<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttemptAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_attempt_id',
        'exam_question_id',
        'answer_text',
        'is_correct',
        'points_awarded',
        'feedback',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'points_awarded' => 'integer',
    ];

    public function examAttempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class);
    }

    public function examQuestion(): BelongsTo
    {
        return $this->belongsTo(ExamQuestion::class);
    }

    public function examAttemptAnswerSelections(): HasMany
    {
        return $this->hasMany(ExamAttemptAnswerSelection::class);
    }
}
