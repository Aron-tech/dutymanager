<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexGuildUserRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'search' => 'nullable|string|min:1|max:255',
            'per_page' => 'nullable|int|min:1|max:100',
            'sort' => 'nullable|string|max:64',
            'direction' => 'nullable|in:asc,desc',
            'status' => 'nullable|in:pending,accepted',
        ];
    }
}
