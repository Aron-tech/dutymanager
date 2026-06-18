<?php

namespace App\Models;

use App\Concerns\DataTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'exam_id',
    'type',
    'points',
    'time_limit',
    'order',
    'content',
])]
class ExamQuestion extends Model
{
    use DataTrait;

    protected string $json_data_column = 'content';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'exam_id' => 'integer',
            'points' => 'integer',
            'time_limit' => 'integer',
            'order' => 'integer',
            'content' => 'array',
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
