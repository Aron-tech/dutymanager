<?php

namespace App\Http\Requests\Exams;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
            'time_limit' => ['required', 'integer', 'min:1'],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.text' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:multiple-choice,single-choice,text'],
            'questions.*.points' => ['required', 'integer', 'min:1'],
            'questions.*.answers' => ['required', 'array', 'min:1'],
            'questions.*.answers.*.id' => ['nullable', 'integer'],
            'questions.*.answers.*.text' => ['required', 'string'],
            'questions.*.answers.*.is_correct' => ['required', 'boolean'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
