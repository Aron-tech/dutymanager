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
use Illuminate\Support\Facades\DB;

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
        $target_user_id = $guild_user?->user_id ?? $target_user?->id;
        $level = $level ?: 1;

        if (empty($guild_id) || empty($target_user_id)) {
            return null;
        }

        $guild_user ??= GuildUser::where('guild_id', $guild_id)->where('user_id', $target_user_id)->first();

        if (in_array($type, [PunishmentTypeEnum::VERBAL_WARNING, PunishmentTypeEnum::WARNING])) {
            $level += self::active()->where('user_id', $target_user_id)->where('guild_id', $guild_id)->where('type', $type)->max('level') ?? 0;
        }

        $punishment = self::create([
            'user_id' => $target_user_id,
            'guild_id' => $guild_id,
            'guild_user_id' => $guild_user?->id,
            'type' => $type,
            'level' => $level,
            'reason' => $reason,
            'expires_at' => $expires_at,
            'created_by' => $created_by?->id ?? auth()->id(),
            'is_expired' => false,
        ]);

        if ($punishment && $type === PunishmentTypeEnum::WARNING) {
            DB::afterCommit(function () use ($guild, $guild_id, $target_user_id, $level, $reason, $created_by) {
                $warning_roles = $guild->guildSettings->getFeatureSettings(FeatureEnum::WARN, 'warning_roles', []);
                $new_warning_index = min($level - 1, count($warning_roles) - 1);

                if (isset($warning_roles[$new_warning_index])) {
                    DiscordFetchService::addRoleToMember($guild_id, $target_user_id, $warning_roles[$new_warning_index]);
                }

                $channel_id = $guild->guildSettings->getFeatureSettings(FeatureEnum::WARN, 'announcement_channel_id', null);
                if ($channel_id) {
                    $embed = DiscordEmbedFactory::create('warning', [
                        'user_id' => $target_user_id,
                        'level' => $level,
                        'reason' => $reason,
                        'actor' => '<@'.($created_by?->id ?? auth()->id()).'>',
                        'guild_name' => $guild->name,
                        'guild_icon_url' => $guild->icon ? "https://cdn.discordapp.com/icons/{$guild->id}/{$guild->icon}.png" : null,
                    ]);

                    DiscordFetchService::sendMessage($guild_id, $channel_id, null, [$embed]);
                }
            });
        }

        ActivityLog::make($guild_id, $created_by?->id ?? auth()->id(), $target_user_id, ActionTypeEnum::ADD_PUNISHMENT_TO_GUILD_USER, $punishment->toArray());

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
