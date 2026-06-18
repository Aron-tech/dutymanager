<?php

namespace App\Models;

use App\Concerns\DataTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'guild_id',
    'name',
    'description',
    'required_roles',
    'max_attempts',
    'min_percent',
    'is_visible',
    'auto_grade',
    'time_limit',
    'settings',
])]
class Exam extends Model
{
    use DataTrait, SoftDeletes;

    protected string $json_data_column = 'settings';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'required_roles' => 'array',
            'max_attempts' => 'integer',
            'min_percent' => 'integer',
            'is_visible' => 'boolean',
            'auto_grade' => 'boolean',
            'time_limit' => 'integer',
            'settings' => 'array',
        ];
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }
}
