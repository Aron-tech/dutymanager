<?php

namespace App\Models;

use App\Concerns\DataTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['guild_id', 'name', 'description', 'required_min_percentage', 'max_attempts', 'random_questions', 'time_limit', 'auto_grade', 'expires_at', 'data', 'visible'])]
class Exam extends Model
{
    use DataTrait;

    protected function casts(): array
    {
        return [
            'required_min_percentage' => 'integer',
            'max_attempts' => 'integer',
            'random_questions' => 'bool',
            'time_limit' => 'integer',
            'auto_grade' => 'bool',
            'expires_at' => 'datetime',
            'data' => 'array',
            'visible' => 'bool',
        ];
    }

    /**
     * @return BelongsTo
     */
    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }

    /**
     * @return HasMany
     */
    public function examQuestions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }

    /**
     * @return HasMany
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }
}
