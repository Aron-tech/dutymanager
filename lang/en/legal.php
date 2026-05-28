<?php

return [
    'disclaimer' => 'DutyManager v3 is not affiliated with, endorsed, or sponsored by Discord Inc. "Discord" is a trademark of Discord Inc.',
    'terms' => [
        'meta' => [
            'title' => 'Terms of Service — DutyManager v3',
        ],
        'header' => [
            'title' => 'Terms of Service',
        ],
        'intro' => 'These Terms of Service ("Terms") govern your access to and use of the DutyManager v3 Discord bot, its associated web dashboard, and related services (collectively, the "Service"). By inviting the bot to a Discord server or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.',
        'section_1' => [
            'title' => '1. Eligibility',
            'content_part_1' => 'You must comply with the',
            'link_1' => 'Discord Terms of Service',
            'content_part_2' => 'and meet Discord\'s minimum age requirement for your jurisdiction to use the Service. By using the Service on a Discord server, you represent that you have the authority to bind that server to these Terms.',
        ],
        'section_2' => [
            'title' => '2. Description of the Service',
            'content' => 'DutyManager v3 provides duty-time tracking, member management, a punishment system, and holiday management through Discord slash commands and a synchronized web dashboard. Features may be added, changed, or removed at any time. Some features are available only with a Premium subscription.',
        ],
        'section_3' => [
            'title' => '3. Premium Subscriptions',
            'content_part_1' => 'Premium subscriptions unlock additional features.',
            'bold_content' => 'Premium subscriptions can exclusively be purchased via our Discord server.',
            'content_part_2' => 'All purchases are subject to the terms presented at the point of sale. Unless required by applicable law, payments are non-refundable. We reserve the right to change pricing and the features included in any plan.',
        ],
        'section_4' => [
            'title' => '4. Acceptable Use',
            'intro' => 'You agree that you will not:',
            'list_item_1' => 'Use the Service to violate the Discord Terms of Service, Community Guidelines, or any applicable law.',
            'list_item_2' => 'Attempt to disrupt, overload, reverse engineer, or gain unauthorized access to the Service or its infrastructure.',
            'list_item_3' => 'Abuse, automate, or exploit commands in a way that degrades the experience for other users.',
            'list_item_4' => 'Use the Service to harass, abuse, or harm others, or to store unlawful content.',
        ],
        'section_5' => [
            'title' => '5. Discord API Compliance',
            'content_part_1' => 'The Service operates as a Discord application and relies on the Discord API. Your use of the Service is also governed by the',
            'link_1' => 'Discord Developer Terms of Service',
            'content_part_2' => 'and',
            'link_2' => 'Developer Policy',
            'content_part_3' => 'We handle Discord data in accordance with those policies, and access to Discord-provided data may be limited or revoked by Discord at any time, which may affect the Service.',
        ],
        'section_6' => [
            'title' => '6. Data and Message Caching',
            'content_part_1' => 'To deliver its features, the Service stores configuration data, member records, duty totals, punishments, and holidays associated with your server. The bot may temporarily cache message and interaction data in memory to process commands; such cache is transient and is not retained longer than necessary. Details of what we store and for how long are described in our',
            'link_1' => 'Privacy Policy',
        ],
        'section_7' => [
            'title' => '7. Availability and Disclaimer of Warranties',
            'content' => 'The Service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that data will never be lost. You are responsible for maintaining your own records where appropriate.',
        ],
        'section_8' => [
            'title' => '8. Limitation of Liability',
            'content' => 'To the maximum extent permitted by law, the operators of DutyManager v3 shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill arising from your use of, or inability to use, the Service.',
        ],
        'section_9' => [
            'title' => '9. Termination',
            'content' => 'We may suspend or terminate access to the Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, the Service, or third parties. You may stop using the Service at any time by removing the bot from your server.',
        ],
        'section_10' => [
            'title' => '10. Changes to These Terms',
            'content' => 'We may update these Terms from time to time. Material changes will be communicated through our Discord server or the Service. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.',
        ],
        'section_11' => [
            'title' => '11. Contact',
            'content_part_1' => 'Questions about these Terms can be directed to our',
            'link_1' => 'Discord support server',
            'content_part_2' => 'or by email at',
        ],
    ],
    'privacy' => [
        'meta' => [
            'title' => 'Privacy Policy — DutyManager v3',
        ],
        'header' => [
            'title' => 'Privacy Policy',
        ],
        'intro' => 'This Privacy Policy explains what data the DutyManager v3 Discord bot and its web dashboard (the "Service") collect, how it is used, and the choices you have. By using the Service, you consent to the practices described below.',
        'section_1' => [
            'title' => '1. Data We Collect',
            'intro' => 'To provide its features, the Service stores the following categories of data:',
            'list_item_1' => [
                'term' => 'Discord identifiers',
                'description' => 'server (guild) IDs, channel IDs, role IDs, and user IDs.',
            ],
            'list_item_2' => [
                'term' => 'Member records',
                'description' => 'usernames, nicknames, assigned ranks, and related metadata required for management features.',
            ],
            'list_item_3' => [
                'term' => 'Duty data',
                'description' => 'on-duty sessions and accumulated time totals per period.',
            ],
            'list_item_4' => [
                'term' => 'Punishment data',
                'description' => 'verbal warnings, warnings, and blacklists, including reasons, levels, and expiry.',
            ],
            'list_item_5' => [
                'term' => 'Holiday data',
                'description' => 'registered time-off periods and reasons.',
            ],
            'list_item_6' => [
                'term' => 'Configuration',
                'description' => 'per-server settings and enabled features.',
            ],
            'outro' => 'We do not intentionally collect sensitive personal information, and we do not sell your data to third parties.',
        ],
        'section_2' => [
            'title' => '2. Message Caching',
            'content' => 'The Service primarily operates through slash commands and interactions rather than reading general chat messages. When required to process a command, the bot may temporarily hold message or interaction content in memory (a transient cache). This cache is short-lived, is used only to fulfill the requested action, and is not written to long-term storage unless a feature you use explicitly requires it (for example, logging an action you performed).',
        ],
        'section_3' => [
            'title' => '3. How We Use Data',
            'list_item_1' => 'To operate and provide the bot\'s commands and dashboard features.',
            'list_item_2' => 'To maintain duty totals, punishments, holidays, and server configuration.',
            'list_item_3' => 'To synchronize data between Discord and the web dashboard.',
            'list_item_4' => 'To diagnose issues, prevent abuse, and improve reliability of the Service.',
        ],
        'section_4' => [
            'title' => '4. Legal Basis and Discord API',
            'content_part_1' => 'The Service accesses data through the Discord API and complies with the',
            'link_1' => 'Discord Developer Terms of Service',
            'content_part_2' => 'and',
            'link_2' => 'Developer Policy',
            'content_part_3' => 'We process Discord data only to provide the features you and your server administrators enable.',
        ],
        'section_5' => [
            'title' => '5. Data Retention',
            'content' => 'We retain stored data for as long as the bot remains in your server and the data is needed to provide the Service. When the bot is removed from a server, or upon a valid deletion request, associated server data is deleted or anonymized within a reasonable period, except where retention is required by law or for legitimate operational purposes such as abuse prevention.',
        ],
        'section_6' => [
            'title' => '6. Data Sharing',
            'content' => 'We do not sell personal data. We may share limited data with infrastructure providers (such as hosting and database providers) strictly to operate the Service, and where required by law or to protect our rights, users, or the public.',
        ],
        'section_7' => [
            'title' => '7. Security',
            'content' => 'We take reasonable technical and organizational measures to protect stored data against unauthorized access, alteration, or destruction. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
        ],
        'section_8' => [
            'title' => '8. Your Rights',
            'content' => 'Depending on your jurisdiction, you may have the right to access, correct, or request deletion of data associated with you. Server administrators can remove data by deleting member records via the bot\'s commands or by removing the bot. To make a data request, contact us through the channels below.',
        ],
        'section_9' => [
            'title' => '9. Children\'s Privacy',
            'content' => 'The Service is not directed to individuals below Discord\'s minimum age requirement. We do not knowingly collect data from such individuals. If you believe a minor has provided data, please contact us so we can remove it.',
        ],
        'section_10' => [
            'title' => '10. Changes to This Policy',
            'content' => 'We may update this Privacy Policy from time to time. Material changes will be communicated through our Discord server or the Service. Continued use after changes take effect constitutes acceptance of the revised policy.',
        ],
        'section_11' => [
            'title' => '11. Contact',
            'content_part_1' => 'For privacy questions or data requests, reach us on our',
            'link_1' => 'Discord support server',
            'content_part_2' => 'or by email at',
        ],
    ],
];
