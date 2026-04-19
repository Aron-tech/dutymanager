<?php

namespace App\Http\Requests;

use App\Enums\DutyStatusEnum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateStatusDutyRequest extends FormRequest
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
            'duty_ids' => ['required', 'array'],
            'duty_ids.*' => ['integer', 'exists:duties,id'],
            'status' => ['required', new Enum(DutyStatusEnum::class)],
        ];
    }
}
