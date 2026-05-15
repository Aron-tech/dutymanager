<?php

namespace App\Http\Requests\Api;

use App\Enums\DutyStatusEnum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreDutyRequest extends FormRequest
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
            'guild_id' => ['required', 'string', 'exists:guild_users,guild_id'],
            'user_id' => ['required', 'string', 'exists:guild_users,user_id'],
            'value' => ['required', 'integer'],
            'status' => ['required', new Enum(DutyStatusEnum::class)],
        ];
    }
}
