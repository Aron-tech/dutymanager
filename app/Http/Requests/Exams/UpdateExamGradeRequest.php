<?php

namespace App\Http\Requests\Exams;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamGradeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'answers' => ['required', 'array'],
            'answers.*.exam_attempt_answer_id' => ['required', 'integer', 'exists:exam_attempt_answers,id'],
            'answers.*.points_awarded' => ['required', 'integer', 'min:0'],
            'answers.*.is_correct' => ['required', 'boolean'],
            'answers.*.feedback' => ['nullable', 'string'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
