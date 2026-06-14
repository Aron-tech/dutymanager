<?php

namespace App\Casts;

use App\ValueObjects\ExamAnswerData;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class ExamAnswerCast implements CastsAttributes
{
    /**
     * Cast the given value.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        $data = json_decode($value, true) ?: [];
        $type = $model->examQuestion->type;

        return new ExamAnswerData($type, $data);
    }

    /**
     * Prepare the given value for storage.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if ($value instanceof ExamAnswerData) {
            return json_encode($value->toArray());
        }

        return json_encode($value);
    }
}
