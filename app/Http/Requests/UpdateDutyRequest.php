<?php

namespace App\Http\Requests;

use App\Enums\DutyStatusEnum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateDutyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'guild_user_id' => ['nullable', 'integer', 'exists:guild_users,id'],
            'value' => ['nullable', 'integer'],
            'started_at' => ['nullable', 'date'],
            'finished_at' => ['nullable', 'date'],
            'status' => ['nullable', new Enum(DutyStatusEnum::class)],
        ];
    }
}
