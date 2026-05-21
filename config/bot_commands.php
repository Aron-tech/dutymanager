<?php

return [
    'command_data' => [
        [
            'name' => 'info',
            'description' => 'guild_user.info_command_description',
            'type' => 1,
        ],
        [
            'name' => 'user',
            'description' => 'guild_user.user_commands_description',
            'type' => 1,
            'options' => [
                [
                    'name' => 'info', // /user info
                    'description' => 'guild_user.user_info_command_description',
                    'type' => 1,
                    'options' => [
                        [
                            'name' => 'user',
                            'description' => 'guild_user.user_option_description',
                            'type' => 6,
                            'required' => false,
                        ],
                        [
                            'name' => 'discord_id',
                            'description' => 'guild_user.discord_id_description',
                            'type' => 3,
                            'required' => false,
                        ],
                    ],
                ],
            ],
        ],
        [
            'name' => 'duty',
            'description' => 'Duty rendszer kezelése',
            'type' => 1,
            'options' => [
                [
                    'name' => 'toggle', // Sima /duty helyett /duty toggle
                    'description' => 'duty.duty_command_description',
                    'type' => 1,
                ],
                [
                    'name' => 'cancel', // /duty cancel
                    'description' => 'duty.duty_cancel_command_description',
                    'type' => 1,
                ],
                [
                    'name' => 'fcancel', // /duty fcancel
                    'description' => 'duty.duty_fcancel_command_description',
                    'type' => 1,
                    'options' => [
                        [
                            'name' => 'user',
                            'description' => 'duty.duty_fcancel_command_user_description',
                            'type' => 6,
                            'required' => true,
                        ],
                    ],
                ],
            ],
        ],
    ],
];
