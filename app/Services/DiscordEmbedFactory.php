<?php

declare(strict_types=1);

namespace App\Services;

class DiscordEmbedFactory
{
    /**
     * @param  string  $type  'promotion', 'demotion', 'holiday', 'warning'
     * @param  array  $data  A behelyettesítendő adatok és mező értékek
     */
    public static function create(string $type, array $data): array
    {
        $guildName = $data['guild_name'] ?? 'Szerver Név';
        $guildIcon = $data['guild_icon_url'] ?? null;
        $timestamp = now()->toIso8601String();

        $embed = [
            'timestamp' => $timestamp,
            'footer' => [
                'text' => "DutyManager v3 - {$guildName}",
                'icon_url' => $guildIcon,
            ],
        ];

        $embed = match ($type) {
            'normal' => array_merge($embed, [
                'title' => $data['title'],
                'color' => hexdec($data['color']),
                'description' => $data['description'],
                'fields' => $data['fields'],
            ]),
            'promote' => array_merge($embed, [
                'title' => '📈 Előléptetés',
                'color' => hexdec('2ECC71'),
                'description' => "**<@{$data['user_id']}>** sikeresen el lett léptetve egy magasabb pozícióba.",
                'fields' => [
                    ['name' => 'Új Rang', 'value' => $data['rank'] ?? '-', 'inline' => true],
                    ['name' => 'Kiosztotta', 'value' => $data['actor'] ?? '-', 'inline' => true],
                ],
            ]),

            'demote' => array_merge($embed, [
                'title' => '📉 Lefokozás',
                'color' => hexdec('E74C3C'),
                'description' => "**<@{$data['user_id']}>** le lett fokozva egy alacsonyabb pozícióba.",
                'fields' => [
                    ['name' => 'Új Rang', 'value' => $data['rank'] ?? '-', 'inline' => true],
                    ['name' => 'Kiosztotta', 'value' => $data['actor'] ?? '-', 'inline' => true],
                ],
            ]),

            'holiday' => array_merge($embed, [
                'title' => '🌴 Szabadság Kezdete',
                'color' => hexdec('3498DB'),
                'description' => "**<@{$data['user_id']}>** megkezdte a szabadságát.",
                'fields' => [
                    ['name' => 'Tervezett Visszatérés', 'value' => $data['ended_at'] ?? '-', 'inline' => true],
                    ['name' => 'Indok', 'value' => $data['reason'] ?? '-', 'inline' => true],
                ],
            ]),

            'warning' => array_merge($embed, [
                'title' => '⚠️ Figyelmeztetés',
                'color' => hexdec('E67E22'),
                'description' => "**<@{$data['user_id']}>** új figyelmeztetést kapott a szerveren.",
                'fields' => [
                    ['name' => 'Aktuális Szint', 'value' => (string) ($data['level'] ?? '-'), 'inline' => true],
                    ['name' => 'Indok', 'value' => $data['reason'] ?? '-', 'inline' => true],
                    ['name' => 'Kiosztotta', 'value' => $data['actor'] ?? '-', 'inline' => false],
                ],
            ]),

            default => $embed,
        };

        return $embed;
    }
}
