<?php

return [
    'command_data' => [
        [
            'name' => 'duty',
            'description' => 'duty.duty_command_description',
            'type' => 1,
        ],
        [
            'name' => 'duty-cancel',
            'description' => 'duty.duty_cancel_command_description',
            'type' => 1,
        ],
        [
            'name' => 'duty-fcancel',
            'description' => 'duty_fcancel_command_description',
            'type' => 1,
            'options' => [
                [
                    'name' => '',
                    'description' => 'A tag akinek törölni szeretnéd a duty-ját',
                    'type' => 6,
                    'required' => true,
                ],
            ],
        ],
    ],
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
