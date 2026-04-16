<?php

namespace App\Http\Requests;

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
            'guild_user_id' => ['required', 'integer', 'exists:guild_users,id'],
            'value' => ['required', 'integer'],
            'status' => ['required', new Enum(DutyStatusEnum::class)],
        ];
    }
}
