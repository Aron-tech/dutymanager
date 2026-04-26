<?php

namespace App\Services;

use App\Actions\JoinUserToGuildAction;
use App\Concerns\FileHandlerTrait;
use App\Enums\ActionTypeEnum;
use App\Enums\DutyStatusEnum;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\Image;
use App\Models\User;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GuildUserService
{
    use FileHandlerTrait;

    public function getIndexData(Guild $guild, array $data): array
    {
        $paginated_users = $this->getGuildUserPagination($guild, $data);
        $guild_settings = $guild->guildSettings;
        $user_details_config = $guild_settings?->user_details_config ?? [];
        $unattached_guild_users = DiscordFetchService::getGuildMembers($guild->id, true, 2);

        return [
            'guild_users' => $paginated_users,
            'user_details_config' => $user_details_config,
            'unattached_guild_users' => $unattached_guild_users,
            'filters' => $data,
        ];
    }

    public function getGuildUserPagination(Guild $guild, ?array $filter): LengthAwarePaginator|AbstractPaginator
    {
        $search_query = $filter['search'] ?? null;
        $per_page = $filter['per_page'] ?? 20;
        $sort = $filter['sort'] ?? 'created_at';
        $direction = strtolower($filter['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $status = $filter['status'] ?? 'accepted';

        $query = GuildUser::query()
            ->where('guild_id', $guild->id)
            ->with([
                'user:id,name',
                'activePunishments' => function ($q) use ($guild) {
                    $q->where('guild_id', $guild->id)
                        ->with('createdByUser:id,name');
                },
            ])
            ->withCount(['activePunishments' => function ($q) use ($guild) {
                $q->where('guild_id', $guild->id);
            }])
            ->withSum(['duties as current_period_duties_sum_value' => function ($q) {
                $q->where('status', '<=', DutyStatusEnum::CURRENT_PERIOD);
            }], 'value')
            ->withSum('duties as all_period_duties_sum_value', 'value');

        if ($status == 'pending') {
            $query->notAccepted();
        } else {
            $query->accepted();
        }

        if ($search_query) {
            $query->where(function ($q) use ($search_query) {
                $q->where('ic_name', 'like', "%{$search_query}%")
                    ->orWhere('guild_users.user_id', 'like', "%{$search_query}%")
                    ->orWhere('details', 'like', "%{$search_query}%")
                    ->orWhereHas('user', function ($uq) use ($search_query) {
                        $uq->where('name', 'like', "%{$search_query}%");
                    });
            });
        }

        switch ($sort) {
            case 'global_name':
                $query->join('users', 'guild_users.user_id', '=', 'users.id')
                    ->select('guild_users.*')
                    ->orderBy('users.name', $direction);
                break;
            case 'current_duty':
                $query->orderBy('current_period_duties_sum_value', $direction);
                break;
            case 'all_duty':
                $query->orderBy('all_period_duties_sum_value', $direction);
                break;
            case 'joined_at':
                $query->orderBy('created_at', $direction);
                break;
            case 'punishments':
                $query->orderBy('active_punishments_count', $direction);
                break;
            default:
                if (str_starts_with($sort, 'detail_')) {
                    $field_name = str_replace('detail_', '', $sort);
                    $query->orderByRaw("JSON_UNQUOTE(JSON_EXTRACT(details, '$.\"$field_name\"')) $direction");
                } else {
                    $query->orderBy($sort, $direction);
                }
                break;
        }

        return $query->paginate($per_page)->withQueryString();
    }

    public function joinUserToGuild(array $data): GuildUser
    {
        return DB::transaction(function () use ($data) {
            $guild = $data['guild'] ?? null;

            if (! $guild) {
                throw new Exception('A megadott szerver nem található az adatbázisban.');
            }

            $user = User::firstOrCreate(
                ['id' => $data['user_id']],
                [
                    'id' => $data['user_id'],
                    'name' => $data['name'] ?? 'Ismeretlen',
                    'lang_code' => $data['language'] ?? $guild->lang_code,
                ]
            );

            $added_by = auth()->user();

            $is_assigned_user = GuildUser::where('user_id', $data['user_id'])->where('guild_id', $guild->id)->exists();

            if ($is_assigned_user) {
                throw new Exception('A felhasználó már be van regisztrálva.');
            }

            $guild_user = JoinUserToGuildAction::run(
                $user,
                $guild,
                $data['ic_name'],
                $data['details'] ?? [],
                $data['is_request'] ?? false,
                $added_by
            );

            ActivityLog::make($guild->id, auth()->id(), $guild_user->user_id, ActionTypeEnum::ADD_USER_TO_GUILD, $guild_user->toArray());

            return $guild_user;
        });
    }

    /**
     * @throws Throwable
     */
    public function updateGuildUser(GuildUser $guild_user, array $data): GuildUser
    {
        return DB::transaction(function () use ($guild_user, $data) {
            $guild_user->update($data);

            ActivityLog::make($guild_user->guild_id, auth()->id(), $guild_user->user_id, ActionTypeEnum::UPDATE_USER_TO_GUILD, $guild_user->toArray());

            return $guild_user;
        });
    }

    public function acceptUser(GuildUser $guild_user, ?User $auth_user = null): bool
    {
        $auth_user = $auth_user ?: auth()->user();

        if (! is_null($guild_user->accepted_at)) {
            return false;
        }

        DB::beginTransaction();

        try {
            $guild_user->update([
                'accepted_at' => now(),
                'added_by' => $auth_user->id,
            ]);

            ActivityLog::make($guild_user->guild_id, $auth_user->id, $guild_user->user_id, ActionTypeEnum::ACCEPTED_USER_TO_GUILD, $guild_user->toArray());

            DB::commit();

            return true;
        } catch (Throwable $e) {
            DB::rollBack();

            Log::error('Hiba a felhasználó elfogadásakor: '.$e->getMessage(), [
                'guild_user_id' => $guild_user->id,
                'auth_user_id' => $auth_user->id,
            ]);

            return false;
        }
    }

    /**
     * @throws Throwable
     */
    public function deleteUsersFromGuild(Guild $guild, array $ids): void
    {
        DB::transaction(function () use ($guild, $ids) {
            $guild_users = GuildUser::where('guild_id', $guild->id)
                ->whereIn('id', $ids)
                ->get();

            foreach ($guild_users as $guild_user) {
                $guild_user->delete();
            }

            ActivityLog::make($guild->id, auth()->id(), null, ActionTypeEnum::DELETE_USER_FROM_GUILD, $guild_users->toArray());
        });
    }

    /**
     * @throws Throwable
     */
    public function addImageToUser(GuildUser $guild_user, UploadedFile $file): Image
    {
        return DB::transaction(function () use ($guild_user, $file) {
            $path = self::storeFile($file, "guilds/{$guild_user->guild_id}/users/{$guild_user->id}");

            if (! $path) {
                throw new Exception('Hiba a fájl mentése közben.');
            }

            $image = $guild_user->images()->create([
                'path' => $path,
                'disk' => 'public',
            ]);

            ActivityLog::make($guild_user->guild_id, auth()->id(), $guild_user->user_id, ActionTypeEnum::UPLOAD_IMAGE_TO_USER_GUILD, $image->toArray());

            return $image;
        });
    }

    public function removeImage(Image $image): bool
    {
        $guild_user = $image->imageable()->first();

        self::deleteFile($image->path, $image->disk);

        $is_deleted = $image->delete();

        ActivityLog::make($guild_user->guild_id, auth()->id(), $guild_user->user_id, ActionTypeEnum::DELETE_IMAGE_FROM_USER_GUILD, $image->toArray());

        return $is_deleted;
    }
}
