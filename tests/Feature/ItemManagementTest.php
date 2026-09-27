<?php

use App\Enums\PermissionEnum;
use App\Models\Guild;
use App\Models\GuildRole;
use App\Models\GuildSettings;
use App\Models\GuildUser;
use App\Models\Item;
use App\Models\User;
use App\Services\SelectedGuildService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Http::fake(['discord.com/*' => Http::response([], 200)]);
    Storage::fake('public');

    $this->owner = User::factory()->create();
    $this->guild = Guild::factory()->create(['owner_id' => $this->owner->id]);
    GuildSettings::factory()->create(['guild_id' => $this->guild->id]);

    $this->item = Item::create([
        'guild_id' => $this->guild->id,
        'name' => 'Old car',
        'type' => 'vehicle',
        'details' => ['spawn_code' => 'old'],
        'position' => 1,
    ]);
});

afterEach(function () {
    SelectedGuildService::clear();
});

test('an item can be updated without replacing its image', function () {
    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->put(route('items.update', $this->item), [
            'name' => 'New car',
            'type' => 'vehicle',
            'spawn_code' => 'newcar',
            'max_speed' => 200,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($this->item->fresh())
        ->name->toBe('New car')
        ->details->toMatchArray(['spawn_code' => 'newcar', 'max_speed' => 200]);
});

test('an item image can be replaced and removed', function () {
    $session = [SelectedGuildService::SESSION_KEY => $this->guild->id];

    $this->actingAs($this->owner)
        ->withSession($session)
        ->put(route('items.update', $this->item), [
            'name' => 'Old car',
            'type' => 'vehicle',
            'image' => UploadedFile::fake()->image('car.png'),
        ])
        ->assertSessionHasNoErrors();

    $path = $this->item->fresh()->image->path;
    Storage::disk('public')->assertExists($path);

    $this->actingAs($this->owner)
        ->withSession($session)
        ->delete(route('items.image.destroy', $this->item))
        ->assertRedirect();

    expect($this->item->fresh()->image)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

test('an item can be deleted', function () {
    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->delete(route('items.destroy', $this->item))
        ->assertRedirect();

    $this->assertModelMissing($this->item);
});

test('items of another guild cannot be deleted', function () {
    $other_guild = Guild::factory()->create();
    $foreign_item = Item::create([
        'guild_id' => $other_guild->id,
        'name' => 'Foreign',
        'type' => 'vehicle',
        'details' => [],
        'position' => 1,
    ]);

    $this->actingAs($this->owner)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->delete(route('items.destroy', $foreign_item))
        ->assertNotFound();

    $this->assertModelExists($foreign_item);
});

test('a member with clothing edit permission cannot switch an item to a type they lack permission for', function () {
    $role_id = '111222333';

    GuildRole::create([
        'guild_id' => $this->guild->id,
        'role_id' => $role_id,
        'permissions' => [PermissionEnum::EDIT_ITEM_CLOTHES->value],
    ]);

    $member = GuildUser::factory()->create([
        'guild_id' => $this->guild->id,
        'cached_roles' => [$role_id],
    ]);

    $clothing_item = Item::create([
        'guild_id' => $this->guild->id,
        'name' => 'Old jacket',
        'type' => 'clothing',
        'details' => [],
        'position' => 2,
    ]);

    $this->actingAs($member->user)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->put(route('items.update', $clothing_item), [
            'name' => 'Hijacked',
            'type' => 'vehicle',
            'spawn_code' => 'hijacked',
        ])
        ->assertForbidden();

    expect($clothing_item->fresh())->name->toBe('Old jacket');
});

test('members without item permission cannot create items', function () {
    $member = GuildUser::factory()->create(['guild_id' => $this->guild->id]);

    $this->actingAs($member->user)
        ->withSession([SelectedGuildService::SESSION_KEY => $this->guild->id])
        ->post(route('items.store'), [
            'name' => 'Car',
            'type' => 'vehicle',
            'image' => UploadedFile::fake()->image('car.png'),
        ])
        ->assertForbidden();
});
