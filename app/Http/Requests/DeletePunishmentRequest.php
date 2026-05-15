<?php

namespace App\Http\Requests;

use App\Enums\PunishmentTypeEnum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class DeletePunishmentRequest extends FormRequest
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
            'guild_id' => ['required', 'string', 'exists:guild_users,id', 'exists:guilds,id'],
            'user_id' => ['required', 'string', 'exists:guild_users,user_id', 'exists:users,id'],
            'type' => ['required', new Enum(PunishmentTypeEnum::class)],
            'value' => ['integer', 'min:1'],
        ];
    }
}
