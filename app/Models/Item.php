<?php

namespace App\Models;

use App\Concerns\DataTrait;
use App\Enums\ItemTypeEnum;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

#[Fillable(['guild_id', 'name', 'type', 'details', 'position'])]
class Item extends Model
{
    use DataTrait;

    protected string $json_data_column = 'details';

    protected function casts(): array
    {
        return [
            'type' => ItemTypeEnum::class,
            'details' => 'array',
            'position' => 'integer',
        ];
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class);
    }

    public function image(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
