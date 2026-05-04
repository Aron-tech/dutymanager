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
];
