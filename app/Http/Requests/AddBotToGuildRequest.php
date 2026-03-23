<?php

namespace App\Http\Requests;

use App\LanguageEnum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddBotToGuildRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id' => 'required|string|unique:guilds|max:30',
            'name' => 'required|string|max:255',
            'owner_id' => 'required|string|exists:users,id|max:30',
            'executor_id' => 'required|string|exists:users,id|max:30',
        ];
    }
}
