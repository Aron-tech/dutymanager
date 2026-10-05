<?php

test('the landing page links to the bot authorization instead of a server invite', function () {
    config(['services.discord.client_id' => '123456789', 'services.discord.bot_permissions' => '8']);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->where('discordBotInviteUrl', fn (string $url) => str_starts_with($url, 'https://discord.com/oauth2/authorize?')
                && str_contains($url, 'client_id=123456789')
                && str_contains($url, 'permissions=8')
                && str_contains($url, 'integration_type=0')
                && str_contains($url, 'scope=bot')));
});

test('the login page is reachable for guests', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/login'));
});
