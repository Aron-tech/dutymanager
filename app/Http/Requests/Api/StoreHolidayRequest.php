<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreHolidayRequest extends FormRequest
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
            'reason' => ['required', 'string', 'max:255'],
            'duration_in_days' => ['required', 'integer', 'min:1', 'max:365'],
            'holiday_start_delay_days' => ['nullable', 'integer', 'min:0', 'max:365'],
        ];
    }
}
