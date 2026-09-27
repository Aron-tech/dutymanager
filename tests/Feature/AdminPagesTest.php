<?php

use App\Models\Duty;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Models\Punishment;
use App\Models\User;
use App\Services\SelectedGuildService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::fake(['discord.com/*' => Http::response([], 200)]);

    $this->owner = User::factory()->create();
    $this->guild = Guild::factory()->create(['owner_id' => $this->owner->id]);
    GuildSettings::factory()->create(['guild_id' => $this->guild->id]);

    $this->member = GuildUser::factory()->create(['guild_id' => $this->guild->id]);
    Duty::factory()->create(['guild_user_id' => $this->member->id]);
    Duty::factory()->active()->create(['guild_user_id' => $this->member->id]);
    Punishment::factory()->create(['guild_user_id' => $this->member->id]);

    // A duty whose guild user has been removed (guild_user_id nulled by the observer).
    Duty::factory()->create(['guild_user_id' => $this->member->id])->update(['guild_user_id' => null]);
});

afterEach(function () {
    SelectedGuildService::clear();
});

dataset('admin pages', [
    'dashboard' => ['dashboard'],
    'statistics' => ['statistics'],
    'guild users' => ['guild.users.index'],
    'duties' => ['duty.index'],
    'active duties' => ['duty.active'],
    'punishments' => ['punishment.index'],
    'holidays' => ['holiday.index'],
    'items' => ['items.index', ['type' => 'vehicle']],
    'activity log' => ['activity-log.index'],
    'guild settings' => ['guild.settings'],
    'exams' => ['exams.index'],
    'exam attempts' => ['exams.attempts'],
]);

test('admin pages load for the guild owner', function (string $route_name, array $parameters = []) {
    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->get(route($route_name, $parameters))
        ->assertOk();
})->with('admin pages');
