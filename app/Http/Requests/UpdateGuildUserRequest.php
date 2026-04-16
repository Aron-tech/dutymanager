<?php

namespace App\Http\Requests;

use App\Concerns\ValidatesDynamicUserDetailsTrait;
use App\Services\SelectedGuildService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGuildUserRequest extends FormRequest
{
    use ValidatesDynamicUserDetailsTrait;

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
        $rules = [
            'ic_name' => ['required', 'string', 'min:3', 'max:255'],
            'details' => ['nullable', 'array'],
        ];

        $guild = SelectedGuildService::get();

        return array_merge($rules, $this->getdynamicDetailsRules($guild));
    }

    public function messages(): array
    {
        return $this->getDynamicDetailsMessages();
    }
}
