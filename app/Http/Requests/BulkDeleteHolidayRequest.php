<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkDeleteHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'holiday_ids' => ['required', 'array'],
            'holiday_ids.*' => ['integer', 'exists:holidays,id'],
        ];
    }
}
