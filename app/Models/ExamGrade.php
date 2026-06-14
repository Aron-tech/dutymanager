<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_attempt_id',
        'score',
        'max_score',
        'passed',
        'graded_by',
        'graded_at',
        'feedback',
    ];

    protected $casts = [
        'score' => 'integer',
        'max_score' => 'integer',
        'passed' => 'boolean',
        'graded_at' => 'datetime',
    ];

    public function examAttempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class);
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}
