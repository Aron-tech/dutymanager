<?php

namespace App\Models;

use App\Enums\ExamStatusEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['exam_id', 'guild_id', 'user_id', 'guild_user_id', 'total_score', 'percentage', 'status', 'started_at', 'submitted_at', 'graded_at', 'graded_by'])]
class ExamAttempt extends Model
{
    protected function casts(): array
    {
        return [
            'total_score' => 'integer',
            'percentage' => 'float',
            'status' => ExamStatusEnum::class,
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'graded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * @return BelongsTo
     */
    public function guildUser(): BelongsTo
    {
        return $this->belongsTo(GuildUser::class);
    }

    /**
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo
     */
    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    /**
     * @return HasMany
     */
    public function examAttemptAnswers(): HasMany
    {
        return $this->hasMany(ExamAttemptAnswer::class);
    }
}
