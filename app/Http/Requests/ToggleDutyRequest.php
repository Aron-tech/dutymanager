<?php

namespace App\Http\Requests;

use App\Enums\DutyActionEnum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ToggleDutyRequest extends FormRequest
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
            'duty_action' => ['required', new (DutyActionEnum::class)],
            'forced_by' => ['nullable', 'exists:users,id'],
        ];
    }
}
