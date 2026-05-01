<?php

namespace App\Http\Requests;

use App\Concerns\ValidatesDynamicUserDetailsTrait;
use App\Services\SelectedGuildService;
use Illuminate\Foundation\Http\FormRequest;

class StoreGuildUserRequest extends FormRequest
{
    use ValidatesDynamicUserDetailsTrait;

    public function rules(): array
    {
        $rules = [
            'user_id' => ['required', 'string', 'max:255'],
            'name' => ['required_unless:is_request,true', 'string', 'min:3', 'max:255'],
            'ic_name' => ['required', 'string', 'min:3', 'max:255'],
            'is_request' => ['boolean'],
            'details' => ['nullable', 'array'],
        ];

        $guild = SelectedGuildService::get();

        return array_merge($rules, $this->getDynamicDetailsRules($guild));
    }

    public function messages(): array
    {
        return $this->getDynamicDetailsMessages();
    }
}
