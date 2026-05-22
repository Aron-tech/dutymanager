<?php

return [
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
                'name' => 'info',
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
        'description' => 'duty.duty_commands_description',
        'type' => 1,
        'options' => [
            [
                'name' => 'toggle',
                'description' => 'duty.duty_command_description',
                'type' => 1,
            ],
            [
                'name' => 'cancel',
                'description' => 'duty.duty_cancel_command_description',
                'type' => 1,
            ],
            [
                'name' => 'fcancel',
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
            [
                'name' => 'top-list',
                'description' => 'duty.duty_top_list_command_description',
                'type' => 1,
                'options' => [
                    [
                        'name' => 'limit',
                        'description' => 'duty.duty_top_list_command_limit_description',
                        'type' => 4,
                        'min_value' => 1,
                        'max_value' => 50,
                        'required' => false,
                    ],
                    [
                        'name' => 'order_by',
                        'description' => 'duty.duty_top_list_command_order_by_description',
                        'type' => 3,
                        'required' => false,
                        'choices' => [
                            [
                                'name' => 'duty.order_by_current_period_sum',
                                'value' => 'current_period_sum',
                            ],
                            [
                                'name' => 'duty.order_by_all_period_sum',
                                'value' => 'all_period_sum',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'add',
                'description' => 'duty.duty_add_command_description',
                'type' => 1,
                'options' => [
                    [
                        'name' => 'user',
                        'description' => 'duty.duty_add_command_user_description',
                        'type' => 6,
                        'required' => true,
                    ],
                    [
                        'name' => 'minutes',
                        'description' => 'duty.duty_add_command_minutes_description',
                        'type' => 4,
                        'min_value' => 1,
                        'required' => true,
                    ],
                    [
                        'name' => 'status',
                        'description' => 'duty.duty_add_command_status_description',
                        'type' => 4,
                        'min_value' => 0,
                        'max_value' => 1,
                        'required' => false,
                        'choices' => [
                            [
                                'name' => 'enum.duty_current_period',
                                'value' => 0,
                            ],
                            [
                                'name' => 'enum.duty_all_period',
                                'value' => 1,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'remove',
                'description' => 'duty.duty_remove_command_description',
                'type' => 1,
                'options' => [
                    [
                        'name' => 'user',
                        'description' => 'duty.duty_remove_command_user_description',
                        'type' => 6,
                        'required' => true,
                    ],
                    [
                        'name' => 'minutes',
                        'description' => 'duty.duty_remove_command_minutes_description',
                        'type' => 4,
                        'min_value' => 1,
                        'required' => true,
                    ],
                    [
                        'name' => 'status',
                        'description' => 'duty.duty_add_command_status_description',
                        'type' => 4,
                        'min_value' => 0,
                        'max_value' => 1,
                        'required' => false,
                        'choices' => [
                            [
                                'name' => 'enum.duty_current_period',
                                'value' => 0,
                            ],
                            [
                                'name' => 'enum.duty_all_period',
                                'value' => 1,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'delete',
                'description' => 'duty.duty_delete_command_description',
                'type' => 1,
                'options' => [
                    [
                        'name' => 'user',
                        'description' => 'duty.duty_delete_command_user_description',
                        'type' => 6,
                        'required' => true,
                    ],
                    [
                        'name' => 'status',
                        'description' => 'duty.duty_delete_command_status_description',
                        'type' => 4,
                        'min_value' => 0,
                        'max_value' => 1,
                        'required' => false,
                    ],
                ],
            ],
            [
                'name' => 'reset',
                'description' => 'duty.duty_reset_command_description',
                'type' => 1,
            ],
            [
                'name' => 'clear',
                'description' => 'duty.duty_clear_command_description',
                'type' => 1,
            ],
        ],
    ],
    [
        'name' => 'holiday',
        'description' => 'holiday.holiday_commands_description',
        'type' => 1,
        'options' => [
            [
                'name' => 'start',
                'description' => 'holiday.holiday_start_command_description',
                'type' => 1,
                'options' => [
                    [
                        'name' => 'days',
                        'description' => 'holiday.holiday_start_days_command_description',
                        'type' => 4,
                        'min_value' => 1,
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'cancel',
                'description' => 'holiday.holiday_cancel_command_description',
                'type' => 1,
            ],
            [
                'name' => 'fcancel',
                'description' => 'holiday.holiday_fcancel_command_description',
                'type' => 1,
                'options' => [
                    [
                        'name' => 'user',
                        'description' => 'guild_user.user_option_description',
                        'type' => 6,
                        'required' => true,
                    ],
                ],
            ],
        ],
    ],
];
