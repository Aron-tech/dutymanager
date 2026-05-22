<?php

namespace App\Models;

use App\Enums\ActionTypeEnum;
use App\Enums\FeatureEnum;
use App\Enums\PunishmentTypeEnum;
use App\Services\DiscordEmbedFactory;
use App\Services\DiscordFetchService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'guild_id', 'guild_user_id', 'type', 'level', 'reason', 'expires_at', 'created_by', 'is_expired'])]
class Punishment extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'type' => PunishmentTypeEnum::class,
            'is_expired' => 'bool',
        ];
    }

    public static function make(?GuildUser $guild_user, ?User $target_user, Guild $guild, PunishmentTypeEnum $type, ?int $level, string $reason, ?string $expires_at, ?User $created_by): ?Punishment
    {
        $guild_id = $guild->id;
        $target_user_id = $guild_user?->user_id ?: ($target_user?->id);
        $created_by ??= auth()->user();
        $level = $level ?: 1;

        if (empty($guild_id)) {
            return null;
        }

        $guild_user = $guild_user ?: GuildUser::where('guild_id', $guild_id)->where('user_id', $target_user->id)->first();

        if (in_array($type, [PunishmentTypeEnum::VERBAL_WARNING, PunishmentTypeEnum::WARNING])) {
            $level += Punishment::active()->where('user_id', $target_user_id)->where('guild_id', $guild_id)->where('type', $type)->max('level') ?? 0;
        }

        if ($type === PunishmentTypeEnum::WARNING) {
            $warning_roles = $guild->guildSettings->getFeatureSettings(FeatureEnum::WARN, 'warning_roles', []);
            $warning_roles_count = count($warning_roles);
            $new_warning_index = $level - 1;
            if ($new_warning_index < $warning_roles_count) {
                DiscordFetchService::addRoleToMember($guild_id, $target_user_id, $warning_roles[$new_warning_index]);
            } else {
                DiscordFetchService::addRoleToMember($guild_id, $target_user_id, $warning_roles[$warning_roles_count - 1]);
                $level = $warning_roles_count;
            }
            $channel_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::WARN, 'announcement_channel_id', null);

            $embed = DiscordEmbedFactory::create('warning', [
                'user_id' => $guild_user->user_id,
                'level' => $level,
                'reason' => $reason,
                'actor' => '<@'.$created_by->id.'>',
                'guild_name' => $guild->name,
                'guild_icon_url' => $guild->icon ? "https://cdn.discordapp.com/icons/{$guild->id}/{$guild->icon}.png" : null,
            ]);

            if ($channel_id) {
                DiscordFetchService::sendMessage($guild_id, $channel_id, null, [$embed]);
            }
        }

        $punishment = self::create([
            'user_id' => $target_user_id,
            'guild_id' => $guild_id,
            'guild_user_id' => $guild_user->id,
            'type' => $type,
            'level' => $level,
            'reason' => $reason,
            'expires_at' => $expires_at ?: null,
            'created_by' => $created_by?->id ?: auth()->id(),
            'is_expired' => false,
        ]);

        ActivityLog::make($guild_id, $created_by?->id, $target_user_id, ActionTypeEnum::ADD_PUNISHMENT_TO_GUILD_USER, $punishment->toArray());

        return $punishment;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('expires_at', '>', now());
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function guild(): BelongsTo
    {
        return $this->belongsTo(Guild::class, 'guild_id', 'id');
    }

    public function guildUser(): BelongsTo
    {
        return $this->belongsTo(GuildUser::class, 'guild_user_id', 'id');
    }

    public function createdByGuildUser(): BelongsTo
    {
        return $this->belongsTo(GuildUser::class, 'created_by', 'user_id')->where('guild_id', $this->guild_id);
    }
}
