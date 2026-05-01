<?php

namespace App\Services;

use App\Enums\ActionTypeEnum;
use App\Enums\PermissionEnum;
use App\Enums\PunishmentTypeEnum;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\Punishment;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PunishmentService
{
    public function getPaginatedPunishments(Guild $guild, array $filters = []): LengthAwarePaginator
    {
        $search_query = $filters['search'] ?? null;
        $per_page = $filters['per_page'] ?? 20;
        $sort = $filters['sort'] ?? 'created_at';
        $direction = strtolower($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $query = Punishment::query()
            ->withTrashed()
            ->select('punishments.*')
            ->join('guild_users', 'punishments.guild_user_id', '=', 'guild_users.id')
            ->join('users', 'guild_users.user_id', '=', 'users.id')
            ->leftJoin('users as creators', 'punishments.created_by', '=', 'creators.id')
            ->where('guild_users.guild_id', $guild->id)
            ->with(['guildUser.user:id,name', 'createdByUser:id,name']);

        if ($search_query) {
            $query->where(function ($q) use ($search_query) {
                $q->where('punishments.reason', 'like', "%{$search_query}%")
                    ->orWhere('punishments.type', 'like', "%{$search_query}%")
                    ->orWhere('users.name', 'like', "%{$search_query}%")
                    ->orWhere('guild_users.user_id', 'like', "%{$search_query}%")
                    ->orWhere('guild_users.ic_name', 'like', "%{$search_query}%")
                    ->orWhere('creators.name', 'like', "%{$search_query}%");
            });
        }

        switch ($sort) {
            case 'discord_id':
                $query->orderBy('guild_users.user_id', $direction);
                break;
            case 'discord_name':
                $query->orderBy('users.name', $direction);
                break;
            case 'created_by':
                $query->orderBy('creators.name', $direction);
                break;
            case 'status':
                $query->orderByRaw("
                    CASE
                        WHEN punishments.deleted_at IS NOT NULL THEN 3
                        WHEN punishments.expires_at IS NOT NULL AND punishments.expires_at < NOW() THEN 2
                        ELSE 1
                    END {$direction}
                ");
                break;
            case 'type':
            case 'level':
            case 'reason':
            case 'expires_at':
            case 'created_at':
                $query->orderBy('punishments.'.$sort, $direction);
                break;
            default:
                $query->orderBy('punishments.created_at', $direction);
                break;
        }

        return $query->paginate($per_page)->withQueryString();
    }

    public function create(array $data): Punishment
    {
        return DB::transaction(function () use ($data) {
            $guild = SelectedGuildService::get();
            $guild_user = $guild->acceptedGuildUsers()->where('user_id', $data['user_id'])->first();
            $type_enum = PunishmentTypeEnum::from($data['type']);
            $expires_at = (int) $data['expire_days'] > 0 ? now()->addDays($data['expire_days']) : null;
            $created_by = auth()->user();

            $punishment = Punishment::make($guild_user, null, null, $type_enum, $data['level'], $data['reason'], $expires_at, $created_by);

            ActivityLog::make($guild->id, $created_by->id, $guild_user->user_id, ActionTypeEnum::ADD_PUNISHMENT_TO_GUILD_USER, $punishment->toArray());

            return $punishment;
        });

    }

    /**
     * @throws \Throwable
     */
    public function delete(Punishment $punishment): bool
    {
        $guild = SelectedGuildService::get();
        $deleted_id = $punishment->id;

        return DB::transaction(function () use ($punishment, $deleted_id, $guild) {
            $is_deleted = $punishment->delete();

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::DELETE_PUNISHMENT_FROM_GUILD_USER, $deleted_id);

            return $is_deleted;
        });
    }

    /**
     * @return mixed
     *
     * @throws \Throwable
     */
    public function bulkDelete(array $punishment_ids)
    {
        $guild = SelectedGuildService::get();

        return DB::transaction(function () use ($punishment_ids, $guild) {
            $delete_count = Punishment::whereIn('id', $punishment_ids)->delete();

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::DELETE_PUNISHMENT_FROM_GUILD_USER, $punishment_ids);

            return $delete_count;
        });
    }

    /**
     * @param  PunishmentTypeEnum  $type
     * @param  string  $action  // 'add' or 'delete'
     */
    public function hasPermission(PunishmentTypeEnum $type, string $action = 'add'): bool
    {
        $auth_user = auth()->user();

        if ($action === 'add' && $auth_user->can(PermissionEnum::ADD_PUNISHMENTS)) {
            return true;
        } elseif ($action === 'delete' && $auth_user->can(PermissionEnum::DELETE_PUNISHMENTS)) {
            return true;
        }

        return match ($type) {
            PunishmentTypeEnum::BLACKLIST => $action === 'add' ? $auth_user->can(PermissionEnum::ADD_BLACKLIST) : $auth_user->can(PermissionEnum::DELETE_BLACKLIST),
            PunishmentTypeEnum::WARNING => $action === 'add' ? $auth_user->can(PermissionEnum::ADD_WARNING) : $auth_user->can(PermissionEnum::DELETE_WARNING),
            PunishmentTypeEnum::VERBAL_WARNING => $action === 'add' ? $auth_user->can(PermissionEnum::ADD_VERBAL_WARNING) : $auth_user->can(PermissionEnum::DELETE_VERBAL_WARNING),
            default => false,
        };
    }
}
