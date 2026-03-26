<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpsertDiscordUserAction
{
    use AsAction;

    /**
     * @return array[]
     */
    public function rules(): array
    {
        return [
            'id' => ['required', 'string', 'max:30'],
            'nickname' => ['required', 'string', 'max:255'],
            'global_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'avatar_url' => ['nullable', 'url', 'max:255'],
            'token' => ['required', 'string', 'max:255'],
            'refresh_token' => ['required', 'string', 'max:255'],
            'expires_in' => ['required', 'integer', 'min:1'],
            'language' => ['required', 'string', 'size:2', 'min:2', 'max:4'],
        ];
    }

    /**
     * @param array $data
     * @return User
     */
    public function handle(array $data): User
    {
        $language = config('app.locale');

        Validator::make($data, $this->rules($data))->validate();

        return User::updateOrCreate(
            ['id' => $data['id']],
            [
                'name' => $data['nickname'],
                'global_name' => $data['global_name'] ?? null,
                'email' => $data['email'],
                'avatar_url' => $data['avatar_url'] ?? null,
                'lang_code' => $data['language'] ?? $language,
                'access_token' => $data['token'],
                'refresh_token' => $data['refresh_token'],
                'access_expires_at' => now()->addSeconds($data['expires_in']),
            ]
        );
    }
}
