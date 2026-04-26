<?php

namespace App\Http\Requests;

use App\Enums\ItemTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', new Enum(ItemTypeEnum::class)],
            'image' => ['required', 'image', 'max:2040'],
            'roles' => ['nullable', 'string'],

            'spawn_code' => ['nullable', 'string', 'max:255'],
            'max_speed' => ['nullable', 'numeric', 'min:0'],

            'season' => ['nullable', 'string', 'max:255'],
            'mask' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'jackets' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'body_armor' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'hands' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'decals' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'hats' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'ears' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'scarves_chains' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'shirts' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'bags' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'pants' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'shoes' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'glasses' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
            'watches' => ['nullable', 'regex:/^\d+\s*-\s*\d+$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'regex' => __('enum.clothing_regex_invalid'),
        ];
    }
}
