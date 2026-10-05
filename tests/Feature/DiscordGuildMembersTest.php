<?php

use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
use App\Services\DiscordFetchService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
});

function fakeMember(int $id, bool $bot = false): array
{
    return ['user' => ['id' => (string) $id, 'username' => "user{$id}", 'bot' => $bot]];
}

test('guild members are fetched across every page and bots are excluded', function () {
    $first_page = collect(range(1, 1000))->map(fn (int $id) => fakeMember($id))->all();
    $second_page = [fakeMember(1001), fakeMember(1002, bot: true)];

    Http::fake([
        '*/guilds/111/members*' => Http::sequence()
            ->push($first_page)
            ->push($second_page),
    ]);

    $members = DiscordFetchService::getGuildMembers('111');

    expect($members)->toHaveCount(1001);
    Http::assertSentCount(2);
});

test('unattached members reflect the database without waiting for the cache to expire', function () {
    $guild = Guild::factory()->create();

    $user = User::factory()->create();

    Http::fake([
        '*/guilds/*/members*' => Http::response([fakeMember($user->id), fakeMember($user->id + 1)]),
    ]);

    $ids = fn () => collect(DiscordFetchService::getGuildMembers($guild->id, true, 2))->pluck('value')->all();

    expect($ids())->toBe([(string) $user->id, (string) ($user->id + 1)]);

    GuildUser::factory()->create(['guild_id' => $guild->id, 'user_id' => $user->id]);

    expect($ids())->toBe([(string) ($user->id + 1)]);
});
