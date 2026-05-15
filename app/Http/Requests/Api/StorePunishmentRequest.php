<?php

namespace App\Http\Requests\Api;

use App\Enums\PunishmentTypeEnum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StorePunishmentRequest extends FormRequest
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
            'guild_id' => ['required', 'string', 'exists:guilds,id', 'exists:guild_users,guild_id'],
            'user_id' => ['required', 'string', 'exists:users,id', 'exists:guild_users,user_id'],
            'type' => ['required', new Enum(PunishmentTypeEnum::class)],
            'level' => ['nullable', 'integer', 'min:1'],
            'reason' => ['required', 'string'],
            'expire_days' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
