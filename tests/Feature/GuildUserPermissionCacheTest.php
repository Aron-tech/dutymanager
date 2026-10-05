<?php

use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\GuildRole;
use App\Models\GuildUser;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();

    $this->guild = Guild::factory()->create();
    $this->role = GuildRole::create([
        'guild_id' => $this->guild->id,
        'role_id' => '555555555555555555',
        'permissions' => [PermissionEnum::TOGGLE_DUTY->value],
    ]);
});

test('permissions cached while the user had no roles are refreshed once the roles are saved', function () {
    $guild_user = GuildUser::factory()->create(['guild_id' => $this->guild->id, 'cached_roles' => []]);

    expect($guild_user->getPermissionsAttribute())->toBe([]);

    $guild_user->update(['cached_roles' => [$this->role->role_id]]);

    expect($guild_user->fresh()->getPermissionsAttribute())->toBe([PermissionEnum::TOGGLE_DUTY->value]);
});

test('a freshly created guild user never inherits a stale permission cache', function () {
    $user = User::factory()->create();
    Cache::forever("guild_{$this->guild->id}_user_{$user->id}_permissions", []);

    $guild_user = GuildUser::factory()->create([
        'guild_id' => $this->guild->id,
        'user_id' => $user->id,
        'cached_roles' => [$this->role->role_id],
    ]);

    expect($guild_user->getPermissionsAttribute())->toBe([PermissionEnum::TOGGLE_DUTY->value]);
});

test('roles the member already holds on discord are pulled in when syncing', function () {
    Http::fake([
        '*/guilds/*/members/*' => Http::response(['roles' => [$this->role->role_id, '999999999999999999']]),
    ]);

    $guild_user = GuildUser::factory()->create(['guild_id' => $this->guild->id, 'cached_roles' => []]);
    $guild_user->syncRolesFromDiscord();

    expect($guild_user->fresh()->cached_roles)->toBe([$this->role->role_id])
        ->and($guild_user->fresh()->getPermissionsAttribute())->toBe([PermissionEnum::TOGGLE_DUTY->value]);
});

test('the role whitelist is not cached while empty', function () {
    $guild = Guild::factory()->create();

    expect($guild->getRoleWhitelist())->toBe([]);

    GuildRole::create(['guild_id' => $guild->id, 'role_id' => '111111111111111111', 'permissions' => []]);

    expect($guild->getRoleWhitelist())->toBe(['111111111111111111']);
});
