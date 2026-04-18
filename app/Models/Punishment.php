<?php

namespace App\Models;

use App\Enums\PunishmentTypeEnum;
use App\Services\SelectedGuildService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'guild_id', 'type', 'level', 'reason', 'expires_at', 'created_by'])]
class Punishment extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public static function make(User $target_user, ?Guild $guild, PunishmentTypeEnum $type, ?int $level, string $reason, ?int $expires_at): ?Punishment
    {
        $guild = $guild ?: SelectedGuildService::get() ?? null;

        if (empty($guild)) {
            return null;
        }

        if (! $level && in_array($type, [PunishmentTypeEnum::VERBAL_WARNING, PunishmentTypeEnum::VERBAL_WARNING], true)) {
            $level = Punishment::where('user_id', $target_user->id)->where('guild_id', $guild->id)->where('type', $type)->max('level') ?? 0;
            $level++;
        }

        return self::create([
            'user_id' => $target_user->id,
            'guild_id' => $guild->id,
            'type' => $type,
            'level' => $level,
            'reason' => $reason,
            'expires_at' => $expires_at,
        ]);
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
        return $this->belongsTo(GuildUser::class, 'user_id', 'user_id')->where('guild_id', $this->guild_id);
    }

    public function createdByGuildUser(): BelongsTo
    {
        return $this->belongsTo(GuildUser::class, 'created_by', 'user_id')->where('guild_id', $this->guild_id);
    }
}
