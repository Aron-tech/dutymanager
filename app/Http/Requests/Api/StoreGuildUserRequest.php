<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGuildUserRequest extends FormRequest
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
            'user_id' => ['required', 'string', 'max:30'],
            'guild_id' => ['required', 'string', 'max:30', 'exists:guilds,id'],
            'name' => ['required', 'string', 'max:255'],
            'ic_name' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'array'],
            'details.*' => ['nullable', 'string'],
            'is_request' => ['required', 'boolean'],
            'accepted_at' => ['nullable', 'boolean'],
            'added_by' => ['nullable', 'string', 'exists:users,id', 'max:30'],
            'language' => ['nullable', 'string', 'min:2', 'max:4'],
        ];
    }
}
