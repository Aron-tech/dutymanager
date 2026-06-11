<?php

declare(strict_types=1);

namespace App\Services;

use App\Actions\ChangeGuildUserRankAction;
use App\Actions\JoinUserToGuildAction;
use App\Concerns\FileHandlerTrait;
use App\Enums\ActionTypeEnum;
use App\Enums\DutyStatusEnum;
use App\Enums\FeatureEnum;
use App\Enums\PunishmentTypeEnum;
use App\Events\SendUserMessageEvent;
use App\Jobs\AddDiscordRoleJob;
use App\Jobs\DeleteGuildUserJob;
use App\Jobs\UpdateGuildUserRankJob;
use App\Models\ActivityLog;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\Image;
use App\Models\User;
use Exception;
use Illuminate\Bus\Batch;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Bus;
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

        $rank_roles = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'rank_roles', []);

        return [
            'guild_users' => $paginated_users,
            'user_details_config' => $user_details_config,
            'unattached_guild_users' => $unattached_guild_users,
            'filters' => $data,
            'rank_roles' => $rank_roles,
            'has_rank_system' => $guild_settings->isEnabledFeature(FeatureEnum::RANK),
            'all_ranks' => $guild->getData('roles'),
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
                'activeHoliday',
            ])
            ->withCount(['activePunishments', 'activeHoliday'])
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
            case 'rank_changed_ago':
                $query->orderBy('rank_changed_at', $direction);
                break;
            case 'joined_at':
                $query->orderBy('created_at', $direction);
                break;
            case 'statuses':
                $query->orderBy('active_holiday_count', $direction)->orderBy('active_punishments_count', $direction);
                break;
            case 'rank':
                $query->orderBy('data->rank_role_index', $direction);
                break;
            default:
                if (str_starts_with($sort, 'detail_')) {
                    $field_name = str_replace('detail_', '', $sort);
                    $query->orderBy("details->{$field_name}", $direction);
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

            $added_by = $data['added_by'] ?? auth()->user();

            $assigned_user = GuildUser::where('user_id', $data['user_id'])->where('guild_id', $guild->id)->with(['user:id,name'])->first();

            if ($assigned_user) {
                throw new Exception(__('guild_user.already_exists_user', ['user' => $assigned_user->user->name]));
            }

            if ($guild->guildSettings->isEnabledFeature(FeatureEnum::WARN)) {
                $blacklist = $guild->punishments()->where('user_id', $data['user_id'])->where('type', PunishmentTypeEnum::BLACKLIST)->where('is_expired', false)->select(['id', 'reason'])->latest()->first();
                if ($blacklist) {
                    throw new Exception(__('guild_user.error_blacklisted_user', ['reason' => $blacklist->reason]));
                }
            }

            return JoinUserToGuildAction::run(
                $user,
                $guild,
                $data['ic_name'],
                $data['details'] ?? [],
                $data['is_request'] ?? false,
                $added_by
            );
        });
    }

    /**
     * @throws Throwable
     */
    public function updateGuildUser(GuildUser $guild_user, Guild $guild, array $data): GuildUser
    {
        return DB::transaction(function () use ($guild_user, $guild, $data) {
            if (isset($data['rank_id'])) {
                $this->updateRank($guild_user, $guild, $data['rank_id']);
                unset($data['rank_id']);
            }

            $guild_user->update($data);

            ActivityLog::make($guild->id, auth()->id(), $guild_user->user_id, ActionTypeEnum::UPDATE_USER_TO_GUILD, $guild_user->toArray());

            return $guild_user;
        });
    }

    private function updateRank(GuildUser $guild_user, Guild $guild, string $new_rank_id): void
    {
        $guild_settings = $guild->guildSettings;
        $current_rank_data = $guild_user->getRankData($guild_settings);

        if ($current_rank_data['rank_id'] === $new_rank_id) {
            return;
        }

        $rank_roles = $guild_settings->getFeatureSettings(FeatureEnum::RANK, 'rank_roles', []);
        $current_index = $current_rank_data['index'] ?? -1;
        $new_index = array_search($new_rank_id, $rank_roles);

        if ($new_index === false) {
            return;
        }

        $action = $new_index > $current_index ? 'promote' : 'demote';
        $level = abs($new_index - $current_index);

        ChangeGuildUserRankAction::run($guild_user, $guild_settings, $action, $level);
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

            $guild = $guild_user->guild;
            $default_role = $guild->guildSettings?->getGeneralSettings('default_role', null);

            ActivityLog::make($guild_user->guild_id, $auth_user->id, $guild_user->user_id, ActionTypeEnum::ACCEPTED_USER_TO_GUILD, $guild_user->toArray());

            DB::commit();

            if ($default_role) {
                DiscordFetchService::addRoleToMember($guild->id, $guild_user->user_id, $default_role);
            }

            if ($guild->guildSettings?->isEnabledFeature(FeatureEnum::RANK)) {
                ChangeGuildUserRankAction::run($guild_user, $guild, 'promote', 0, $auth_user->id);
            }

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
    public function deleteUsersFromGuild(Guild $guild, array $ids, bool $should_kick = false): Batch
    {
        $guild_users = GuildUser::where('guild_id', $guild->id)->whereIn('id', $ids)->get();
        $causer_id = auth()->id();

        $jobs = $guild_users->map(function ($guild_user) use ($causer_id, $should_kick) {
            return new DeleteGuildUserJob($guild_user, $causer_id, $should_kick);
        });

        return Bus::batch($jobs)
            ->name('GuildUsers deleting from Guild: '.$guild->id)
            ->allowFailures()
            ->then(function (Batch $batch) use ($causer_id) {
                broadcast(new SendUserMessageEvent($causer_id, __('guild_user.success_deleted_user', ['user' => $batch->totalJobs]), 'success'));
            })
            ->catch(function (Batch $batch, Throwable $e) use ($causer_id) {
                broadcast(new SendUserMessageEvent($causer_id, __('app.error_action'), 'danger'));
            })
            ->dispatch();
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

    public function processBulkRankUpdate(Guild $guild, User $auth_user, array $data): array
    {
        $guild_users = $guild->acceptedGuildUsers()->whereIn('id', $data['guild_user_ids'])->get();
        $count = $guild_users->count();

        if ($count === 0) {
            return ['status' => 'error', 'message' => __('app.error_action')];
        }

        if ($count > 1) {
            return $this->dispatchBulkJobs($guild_users, $guild, $auth_user, $data);
        }

        return $this->executeSyncUpdate($guild_users, $guild, $auth_user, $data, $count);
    }

    private function dispatchBulkJobs(Collection $guild_users, Guild $guild, User $auth_user, array $data): array
    {
        $jobs = [];
        foreach ($guild_users as $user) {
            $jobs[] = new UpdateGuildUserRankJob($user, $guild, $data['action'], $data['level'] ?? 1, $auth_user->id);
        }

        Bus::batch($jobs)
            ->name('Bulk Rank Update: id => '.$guild->id.', name => '.$guild?->name)
            ->then(function (Batch $batch) use ($auth_user, $data) {
                broadcast(new SendUserMessageEvent($auth_user->id, ($data['action'] === 'promote') ? __('guild_user.success_promote_users', ['count' => $batch->totalJobs]) : __('guild_user.success_demote_users', ['count' => $batch->totalJobs]), 'success'));
            })
            ->catch(function (Batch $batch, Throwable $e) use ($auth_user) {
                broadcast(new SendUserMessageEvent($auth_user->id, __('app.error_action'), 'danger'));
            })
            ->dispatch();

        return ['status' => 'success', 'message' => ($data['action'] === 'promote') ? __('guild_user.promote_in_queue_started') : __('guild_user.demote_in_queue_started')];
    }

    private function executeSyncUpdate(Collection $guild_users, Guild $guild, User $auth_user, array $data, int $count): array
    {
        $success_count = 0;
        foreach ($guild_users as $guild_user) {
            if (ChangeGuildUserRankAction::run($guild_user, $guild, $data['action'], $data['level'] ?? 1, $auth_user->id)) {
                $success_count++;
            }
        }

        if ($success_count === $count) {
            return ['status' => 'success', 'message' => 'Ranks updated successfully.'];
        } elseif ($success_count > 0) {
            return ['status' => 'success', 'message' => 'Some ranks updated successfully.'];
        }

        return ['status' => 'error', 'message' => __('app.error_action')];
    }
}
