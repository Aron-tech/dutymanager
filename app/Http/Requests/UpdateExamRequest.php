<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExamRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'required_roles' => ['nullable', 'array'],
            'required_roles.*' => ['string'],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'min_percent' => ['required', 'integer', 'between:0,100'],
            'is_visible' => ['required', 'boolean'],
            'auto_grade' => ['required', 'boolean'],
            'time_limit' => ['nullable', 'integer', 'min:1'],
            'settings' => ['nullable', 'array'],

            'questions' => ['nullable', 'array'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.type' => ['required', 'string', 'in:multiple_choice,true_false,matching,free_text,cloze'],
            'questions.*.points' => ['required', 'integer', 'min:1'],
            'questions.*.time_limit' => ['nullable', 'numeric', 'min:0.01'],
            'questions.*.order' => ['required', 'integer', 'min:0'],
            'questions.*.content' => ['required', 'array'],
        ];
    }
}
