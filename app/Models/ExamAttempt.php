<?php

namespace App\Models;

use App\Concerns\DataTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'exam_id',
    'guild_id',
    'user_id',
    'guild_user_id',
    'score',
    'status',
    'data',
])]
class ExamAttempt extends Model
{
    use DataTrait;

    protected string $json_data_column = 'data';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'exam_id' => 'integer',
            'guild_user_id' => 'integer',
            'score' => 'integer',
            'data' => 'array',
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guildUser(): BelongsTo
    {
        return $this->belongsTo(GuildUser::class);
    }
}
