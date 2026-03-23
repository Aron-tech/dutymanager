<?php

namespace App\Actions;

use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class JoinUserToGuildAction
{
    use AsAction;

    /**
     * @param User $user
     * @param Guild $guild
     * @param string $ic_name
     * @param array $details
     * @param bool $is_request
     * @param User|null $added_by
     * @return GuildUser
     */
    public function handle(User $user, Guild $guild, string $ic_name, array $details, bool $is_request, ?User $added_by): GuildUser
    {
        $this->validateDynamicData($guild, $details);

        return GuildUser::create([
            'user_id' => $user->id,
            'guild_id' => $guild->id,
            'ic_name' => $ic_name,
            'details' => $details,
            'is_request' => $is_request,
            'accepted_at' => $added_by ? now() : null,
            'added_by' => $added_by,
        ]);
    }

    /**
     * @param Guild $guild
     * @param array $data
     * @return void
     */
    private function validateDynamicData(Guild $guild, array $data): void
    {
        $user_details_config = $guild->guildSettings->user_details_config ?? [];
        $dynamic_rules = [];

        foreach ($user_details_config as $field_name => $field_config) {
            $rules = [];

            $rules[] = ($field_config['required'] ?? false) ? 'required' : 'nullable';

            $rules[] = match ($field_config['type'] ?? 'string') {
                'integer' => 'integer',
                'boolean' => 'boolean',
                'numeric' => 'numeric',
                default => 'string',
            };

            $dynamic_rules[$field_name] = $rules;
        }

        Validator::make($data, $dynamic_rules)->validate();
    }
}
