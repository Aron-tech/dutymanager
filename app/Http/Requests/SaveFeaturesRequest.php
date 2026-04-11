<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveFeaturesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
            'next_view' => ['required', 'string', 'min:1', 'max:255'],
        ];
    }
}
