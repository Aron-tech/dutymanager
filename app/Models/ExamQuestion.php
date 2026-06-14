<?php

namespace App\Models;

use App\Concerns\DataTrait;
use App\Enums\ExamQuestionTypeEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['exam_id', 'text', 'type', 'config', 'score', 'time_limit', 'position'])]
class ExamQuestion extends Model
{
    use DataTrait;

    protected string $json_data_column = 'config';

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'type' => ExamQuestionTypeEnum::class,
            'score' => 'integer',
            'config' => 'array',
            'time_limit' => 'integer',
            'position' => 'integer',
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * @return HasMany
     */
    public function examQuestionAnswers(): HasMany
    {
        return $this->hasMany(ExamQuestionAnswer::class);
    }
}
