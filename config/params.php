<?php

return [
    'subscriptions' => [
        'monthly' => [
            'price' => 10,
            'stripe_price_id' => env('STRIPE_MONTHLY_PRICE_ID', 'price_placeholder_monthly'),
            'features' => [
                '1 szerverhez köthető',
                'Havi 1 alkalommal módosítható',
                'Discord integráció',
                'Prémium támogatás',
            ],
        ],
        'yearly' => [
            'price' => 100, // Éves díj
            'stripe_price_id' => env('STRIPE_YEARLY_PRICE_ID', 'price_placeholder_yearly'),
            'features' => [
                '1 szerverhez köthető',
                'Havi 1 alkalommal módosítható',
                'Discord integráció',
                'Prémium támogatás',
            ],
        ],
    ],
    'message_template' => [
        'warn_template' => [
            'title' => 'Új Szabadság',
            'description' => '**Gipsz Jakab** szabadságra ment.',
            'color' => hexdec('ffaa00'),
            'fields' => [
                [
                    'name' => 'Tervezett visszatérés',
                    'value' => '2026. 05. 20.',
                    'inline' => true,
                ],
                [
                    'name' => 'Indok',
                    'value' => 'Nyaralás',
                    'inline' => true,
                ],
            ],
            'timestamp' => now()->toIso8601String(),
        ],
    ],
];
