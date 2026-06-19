<?php

return [
    'meta' => [
        'title' => 'Documentation — DutyManager v3',
    ],
    'header' => [
        'eyebrow' => 'Documentation',
        'title' => 'DutyManager v3',
        'subtitle_part_1' => 'The complete command reference and setup guide. Press',
        'subtitle_part_2' => '(or',
        'subtitle_part_3' => ') to search.',
    ],
    'search' => [
        'button' => 'Search',
        'placeholder' => 'Search the documentation and commands...',
        'no_results' => 'No results found.',
        'pages' => 'Pages',
        'commands' => 'Commands',
    ],
    'table' => [
        'option' => 'Option',
        'type' => 'Type',
        'required' => 'Required',
        'description' => 'Description',
        'required_yes' => 'Required',
        'required_no' => 'Optional',
    ],
    'toc' => [
        'title' => 'On this page',
    ],
    'sections' => [
        [
            'id' => 'introduction',
            'title' => 'Introduction',
            'group' => 'Getting Started',
            'summary' => 'What DutyManager v3 is and the problems it solves for staffed Discord communities.',
            'paragraphs' => [
                'DutyManager v3 is a Discord management bot built for serious communities that run staff teams, roleplay factions, and organized servers. It tracks on-duty time, manages member records, issues structured punishments, and handles staff holidays — all from native slash commands.',
                'Every feature is driven by Discord slash commands and synchronized with a web dashboard, so administrators can review data both inside Discord and from the browser.',
                'This documentation is generated from the live command schema. Each command below lists its exact options, types, and whether they are required.',
            ],
        ],
        [
            'id' => 'installation',
            'title' => 'Installation',
            'group' => 'Getting Started',
            'summary' => 'Invite the bot and run the initial setup command in your server.',
            'paragraphs' => [
                'Invite DutyManager v3 using the “Add to Discord” button, then grant it the role permissions it requests so it can manage members and post embeds.',
                'Once the bot has joined, run the setup command to register the bot inside your guild and initialize its configuration.',
            ],
            'commands' => [
                [
                    'signature' => '/install',
                    'description' => 'Installs and initializes DutyManager v3 in the current server. Run this once after inviting the bot.',
                ],
                [
                    'signature' => '/info',
                    'description' => 'Displays general information about the bot and the current guild configuration.',
                ],
            ],
        ],
        [
            'id' => 'user-management',
            'title' => 'User Management',
            'group' => 'Commands',
            'summary' => 'Inspect, synchronize, and remove member records tracked by the bot.',
            'paragraphs' => [
                'The /user command group manages the member records DutyManager keeps for your server. Use it to look up a member, re-sync their data, or remove them entirely.',
            ],
            'commands' => [
                [
                    'signature' => '/user info',
                    'description' => 'Shows the stored record for a member, including ranks, duty totals, and punishments.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => false, 'description' => 'The member to look up.'],
                        ['name' => 'discord_id', 'type' => 'String', 'required' => false, 'description' => 'Look up by raw Discord ID instead of a mention.'],
                    ],
                ],
                [
                    'signature' => '/user sync',
                    'description' => 'Re-synchronizes member data between Discord and DutyManager.',
                ],
                [
                    'signature' => '/user delete',
                    'description' => 'Permanently deletes a member record from DutyManager.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => false, 'description' => 'The member to delete.'],
                        ['name' => 'discord_id', 'type' => 'String', 'required' => false, 'description' => 'Delete by raw Discord ID.'],
                        ['name' => 'kick', 'type' => 'Boolean', 'required' => false, 'description' => 'Also kick the member from the server.'],
                    ],
                ],
            ],
        ],
        [
            'id' => 'duty-system',
            'title' => 'Duty System',
            'group' => 'Commands',
            'summary' => 'Track on-duty time, manage totals, and view leaderboards.',
            'paragraphs' => [
                'The /duty command group is the core of DutyManager. Members toggle their own duty status, while staff can adjust totals, view leaderboards, and reset periods.',
            ],
            'commands' => [
                ['signature' => '/duty toggle', 'description' => 'Toggles your own on-duty status on or off.'],
                ['signature' => '/duty cancel', 'description' => 'Cancels your currently active duty session.'],
                [
                    'signature' => '/duty fcancel',
                    'description' => 'Force-cancels another member’s active duty session.',
                    'options' => [['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member whose duty session to cancel.']],
                ],
                [
                    'signature' => '/duty toplist',
                    'description' => 'Displays a leaderboard of members ranked by accumulated duty time.',
                    'options' => [
                        ['name' => 'limit', 'type' => 'Integer (1–100)', 'required' => false, 'description' => 'How many members to show.'],
                        ['name' => 'show', 'type' => 'Boolean', 'required' => false, 'description' => 'Post the leaderboard publicly instead of privately.'],
                        ['name' => 'order_by', 'type' => 'String', 'required' => false, 'description' => 'Sort by the current period sum or the all-time period sum.'],
                    ],
                ],
                [
                    'signature' => '/duty add',
                    'description' => 'Adds duty minutes to a member’s total.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to credit.'],
                        ['name' => 'minutes', 'type' => 'Integer (min 1)', 'required' => true, 'description' => 'Number of minutes to add.'],
                        ['name' => 'status', 'type' => 'Integer (0 = current period, 1 = all period)', 'required' => false, 'description' => 'Which period the minutes apply to.'],
                    ],
                ],
                [
                    'signature' => '/duty remove',
                    'description' => 'Removes duty minutes from a member’s total.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to deduct from.'],
                        ['name' => 'minutes', 'type' => 'Integer (min 1)', 'required' => true, 'description' => 'Number of minutes to remove.'],
                        ['name' => 'status', 'type' => 'Integer (0 = current period, 1 = all period)', 'required' => false, 'description' => 'Which period the minutes apply to.'],
                    ],
                ],
                [
                    'signature' => '/duty delete',
                    'description' => 'Deletes a member’s duty data for a given period.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to clear.'],
                        ['name' => 'status', 'type' => 'Integer (0 or 1)', 'required' => false, 'description' => 'Which period to delete.'],
                    ],
                ],
                ['signature' => '/duty reset', 'description' => 'Resets the current duty period for the whole server.'],
                ['signature' => '/duty clear', 'description' => 'Clears all duty data for the server.'],
            ],
        ],
        [
            'id' => 'punishments',
            'title' => 'Punishment System',
            'group' => 'Commands',
            'summary' => 'Issue and revoke verbal warnings, warnings, and blacklists.',
            'paragraphs' => [
                'The /punishment command group provides a tiered disciplinary workflow: verbal warnings, formal warnings, and blacklists, each with optional expiry and severity levels.',
            ],
            'commands' => [
                [
                    'signature' => '/punishment verbal_warning',
                    'description' => 'Issues a verbal warning to a member.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to warn.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'Reason for the warning.'],
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Number of days until the warning expires.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Severity level of the warning.'],
                    ],
                ],
                [
                    'signature' => '/punishment warn',
                    'description' => 'Issues a formal warning to a member.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to warn.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'Reason for the warning.'],
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Number of days until the warning expires.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Warning level.'],
                    ],
                ],
                [
                    'signature' => '/punishment blacklist',
                    'description' => 'Blacklists a member from the server systems.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to blacklist.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'Reason for the blacklist.'],
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Number of days until the blacklist expires.'],
                    ],
                ],
                [
                    'signature' => '/punishment removeverbal_warning',
                    'description' => 'Removes a verbal warning from a member.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to update.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'The warning level to remove.'],
                    ],
                ],
                [
                    'signature' => '/punishment removewarn',
                    'description' => 'Removes a formal warning from a member.',
                    'options' => [
                        ['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to update.'],
                        ['name' => 'level', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'The warning level to remove.'],
                    ],
                ],
                [
                    'signature' => '/punishment removeblacklist',
                    'description' => 'Removes a blacklist from a member.',
                    'options' => [['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member to unblacklist.']],
                ],
            ],
        ],
        [
            'id' => 'holidays',
            'title' => 'Holiday System',
            'group' => 'Commands',
            'summary' => 'Let staff register approved time off and manage active holidays.',
            'paragraphs' => [
                'The /holiday command group lets members register approved time off so they are excluded from activity requirements, and lets staff cancel holidays when needed.',
            ],
            'commands' => [
                [
                    'signature' => '/holiday start',
                    'description' => 'Starts a holiday for the member running the command.',
                    'options' => [
                        ['name' => 'days', 'type' => 'Integer (min 1)', 'required' => true, 'description' => 'How many days the holiday lasts.'],
                        ['name' => 'reason', 'type' => 'String', 'required' => true, 'description' => 'Reason for the holiday.'],
                        ['name' => 'delay_days', 'type' => 'Integer (min 1)', 'required' => false, 'description' => 'Delay before the holiday begins, in days.'],
                    ],
                ],
                ['signature' => '/holiday cancel', 'description' => 'Cancels your own active holiday.'],
                [
                    'signature' => '/holiday fcancel',
                    'description' => 'Force-cancels another member’s active holiday.',
                    'options' => [['name' => 'user', 'type' => 'User', 'required' => true, 'description' => 'The member whose holiday to cancel.']],
                ],
            ],
        ],
    ],
];
