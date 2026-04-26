<?php

namespace App\Http\Requests\Api;

use App\Concerns\ValidatesDynamicUserDetailsTrait;
use App\Models\Guild;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGuildUserRequest extends FormRequest
{
    use ValidatesDynamicUserDetailsTrait;

    protected ?Guild $guild = null;

    protected function prepareForValidation(): void
    {
        if ($this->guild_id) {
            $this->guild = Guild::with('guildSettings')
                ->where('id', $this->guild_id)
                ->first();
        }
    }

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
            'user_id' => ['required', 'string', 'max:30'],
            'guild_id' => ['required', 'string', 'max:30', 'exists:guilds,id'],
            'name' => ['required', 'string', 'max:255'],
            'ic_name' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'array'],
            'details.*' => ['nullable', 'string'],
            'is_request' => ['required', 'boolean'],
            'added_by' => ['string', 'exists:users,id', 'max:30'],
            'use_restore' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return $this->getDynamicDetailsMessages();
    }
}
