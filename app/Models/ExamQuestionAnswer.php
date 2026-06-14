<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['exam_question_id', 'text', 'is_correct', 'position'])]
class ExamQuestionAnswer extends Model
{
    protected function casts(): array
    {
        return [
            'is_correct' => 'bool',
            'position' => 'integer',
        ];
    }

    /**
     * @return BelongsTo
     */
    public function examQuestion(): BelongsTo
    {
        return $this->belongsTo(ExamQuestion::class);
    }
}
