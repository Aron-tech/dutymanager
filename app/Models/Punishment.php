<?php

namespace App\Models;

use App\Enums\ActionTypeEnum;
use App\Enums\PunishmentTypeEnum;
use App\Services\SelectedGuildService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'guild_id', 'guild_user_id', 'type', 'level', 'reason', 'expires_at', 'created_by'])]
class Punishment extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'type' => PunishmentTypeEnum::class,
        ];
    }

    public static function make(?GuildUser $guild_user, ?User $target_user, ?Guild $guild, PunishmentTypeEnum $type, ?int $level, string $reason, ?string $expires_at, ?User $created_by): ?Punishment
    {

        $guild_id = $guild_user?->guild_id ?: ($guild?->id ?: SelectedGuildService::get()?->id);
        $target_user_id = $guild_user?->user_id ?: ($target_user?->id);

        if (empty($guild_id)) {
            return null;
        }

        $guild_user = $guild_user ?: GuildUser::where('guild_id', $guild_id)->where('user_id', $target_user->id)->first();

        if (empty($level) && in_array($type, [PunishmentTypeEnum::VERBAL_WARNING, PunishmentTypeEnum::WARNING])) {
            $level = Punishment::where('user_id', $target_user_id)->where('guild_id', $guild_id)->where('type', $type)->max('level') ?? 0;
            $level++;
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
        ]);

        ActivityLog::make($guild_id, $created_by?->id, $target_user_id, ActionTypeEnum::ADD_PUNISHMENT_TO_GUILD_USER, $punishment->toArray());

        return $punishment;
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
