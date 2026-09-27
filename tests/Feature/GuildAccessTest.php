<?php

use App\Enums\FeatureEnum;
use App\Models\Duty;
use App\Models\Guild;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Models\User;
use App\Services\SelectedGuildService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::fake(['discord.com/*' => Http::response([], 200)]);

    $this->owner = User::factory()->create();
    $this->guild = Guild::factory()->create(['owner_id' => $this->owner->id]);
    GuildSettings::factory()->create(['guild_id' => $this->guild->id]);
});

afterEach(function () {
    SelectedGuildService::clear();
});

test('selecting a guild without membership does not grant access to its panel', function () {
    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->post(route('guilds.select', $this->guild))
        ->assertSessionMissing(SelectedGuildService::SESSION_KEY);

    SelectedGuildService::clear();

    $this->actingAs($outsider)
        ->get(route('dashboard'))
        ->assertRedirect(route('guilds.selector'));
});

test('selecting a guild as an accepted member stores it in the session', function () {
    $member = GuildUser::factory()->create(['guild_id' => $this->guild->id]);

    $this->actingAs($member->user)
        ->post(route('guilds.select', $this->guild))
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas(SelectedGuildService::SESSION_KEY, $this->guild->id);
});

test('models of another guild cannot be accessed through the selected guild', function () {
    $other_guild = Guild::factory()->create();
    GuildSettings::factory()->create(['guild_id' => $other_guild->id]);
    $foreign_user = GuildUser::factory()->create(['guild_id' => $other_guild->id]);
    $foreign_duty = Duty::factory()->create(['guild_user_id' => $foreign_user->id]);

    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->get(route('guild.users.duties', $foreign_user))
        ->assertNotFound();

    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->delete(route('duty.delete', $foreign_duty))
        ->assertNotFound();

    expect($foreign_duty->fresh())->not->toBeNull();
});

test('a user can send a join request only for themselves', function () {
    $requester = User::factory()->create();
    $victim = User::factory()->create();

    $this->actingAs($requester)
        ->post(route('guilds.join-request', $this->guild), [
            'user_id' => $victim->id,
            'ic_name' => 'John Doe',
            'is_request' => true,
            'details' => [],
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('guild_users', [
        'guild_id' => $this->guild->id,
        'user_id' => $requester->id,
        'accepted_at' => null,
    ]);
    $this->assertDatabaseMissing('guild_users', ['user_id' => $victim->id]);
});

test('the store endpoint cannot be used to bypass permissions with is_request', function () {
    $member = GuildUser::factory()->create(['guild_id' => $this->guild->id]);
    $target = User::factory()->create();

    $this->actingAs($member->user)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->post(route('guild.users.store'), [
            'user_id' => $target->id,
            'ic_name' => 'John Doe',
            'is_request' => true,
        ])
        ->assertForbidden();
});

test('the guild owner sees the dashboard even without a guild user record', function () {
    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('guild_user_id', null)
            ->where('auth.permissions', ['all']));
});

test('the active duty count on the dashboard only includes the selected guild', function () {
    $member = GuildUser::factory()->create(['guild_id' => $this->guild->id]);
    Duty::factory()->active()->create(['guild_user_id' => $member->id]);
    Duty::factory()->active()->create();

    $this->actingAs($member->user)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('active_duties_count', 1));
});

test('guild users page provides ranks as id and name pairs', function () {
    $this->guild->saveDataAtomically('roles', ['10' => 'Recruit', '20' => 'Officer', '30' => 'Other']);
    $this->guild->guildSettings->update([
        'feature_settings' => [FeatureEnum::RANK->value => ['rank_roles' => ['10', '20']]],
    ]);

    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->get(route('guild.users.index'))
        ->assertInertia(fn ($page) => $page->where('available_ranks', [
            ['id' => '10', 'name' => 'Recruit'],
            ['id' => '20', 'name' => 'Officer'],
        ]));
});

test('reset of duties affects the guild duties relation', function () {
    $member = GuildUser::factory()->create(['guild_id' => $this->guild->id]);
    Duty::factory()->count(2)->create(['guild_user_id' => $member->id]);

    expect($this->guild->duties()->count())->toBe(2)
        ->and($this->guild->getDutiesValue())->toBe(120);
});
