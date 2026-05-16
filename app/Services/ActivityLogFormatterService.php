<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ActionTypeEnum;
use App\Models\ActivityLog;

readonly class ActivityLogFormatterService
{
    public function format(ActivityLog $log): string
    {
        $details = $log->details ?? [];
        $action = $log->action;

        return match ($action) {
            ActionTypeEnum::ADD_DUTY_TO_GUILD_USER => __('log.format.duty_added', ['minutes' => $details['minutes'] ?? 0]),
            ActionTypeEnum::DELETE_DUTY_FROM_GUILD_USER => __('log.format.duty_deleted', ['minutes' => $details['minutes'] ?? 0]),
            ActionTypeEnum::CANCELED_DUTY_FROM_GUILD_USER => __('log.format.duty_canceled'),
            ActionTypeEnum::ON_DUTY => __('log.format.on_duty'),
            ActionTypeEnum::OFF_DUTY => __('log.format.duty_finished', ['minutes' => $details['minutes'] ?? 0]),

            ActionTypeEnum::REQUEST_JOIN_GUILD => __('log.format.request_join'),
            ActionTypeEnum::ADD_USER_TO_GUILD,
            ActionTypeEnum::ADD_USER_TO_GUILD_WITH_RESTORE => __('log.format.user_added'),
            ActionTypeEnum::ACCEPTED_USER_TO_GUILD => __('log.format.user_accepted'),
            ActionTypeEnum::DELETE_USER_FROM_GUILD => __('log.format.user_deleted'),
            ActionTypeEnum::UPDATE_USER_TO_GUILD => __('log.format.user_updated'),

            ActionTypeEnum::RANK_UP_GUILD_USER,
            ActionTypeEnum::RANK_DOWN_GUILD_USER,
            ActionTypeEnum::RANK_UP_WITH_RESET_GUILD_USER,
            ActionTypeEnum::RANK_DOWN_WITH_RESET_GUILD_USER => $this->formatRankChange($details, $action),

            ActionTypeEnum::GET_HOLIDAY => __('log.format.holiday_added', [
                'duration' => $details['duration_in_days'] ?? 0,
                'reason' => $details['reason'] ?? __('log.unknown_reason'),
            ]),
            ActionTypeEnum::CANCEL_HOLIDAY => __('log.format.holiday_canceled'),

            ActionTypeEnum::ADD_PUNISHMENT_TO_GUILD_USER => __('log.format.punishment_added', [
                'type' => $details['type'] ?? __('log.unknown_type'),
                'reason' => $details['reason'] ?? __('log.unknown_reason'),
            ]),
            ActionTypeEnum::DELETE_PUNISHMENT_FROM_GUILD_USER => __('log.format.punishment_deleted'),

            ActionTypeEnum::ADD_ITEM_TO_GUILD => __('log.format.item_added', [
                'type' => $details['type'] ?? '',
                'name' => $details['name'] ?? __('log.unknown_item'),
            ]),
            ActionTypeEnum::DELETE_ITEM_FROM_GUILD => __('log.format.item_deleted'),

            ActionTypeEnum::UPLOAD_IMAGE_TO_USER_GUILD => __('log.format.image_uploaded'),
            ActionTypeEnum::DELETE_IMAGE_FROM_USER_GUILD => __('log.format.image_deleted'),

            ActionTypeEnum::ADD_BOT_TO_GUILD => __('log.format.bot_added'),

            default => $action->getLabel(),
        };
    }

    private function formatRankChange(array $details, ActionTypeEnum $action): string
    {
        $old_rank = $details['old_rank_id'] ?? __('log.unknown');
        $new_rank = $details['new_rank_id'] ?? __('log.unknown');

        $translation_key = match ($action) {
            ActionTypeEnum::RANK_UP_GUILD_USER => 'log.format.rank_promoted',
            ActionTypeEnum::RANK_DOWN_GUILD_USER => 'log.format.rank_demoted',
            default => 'log.format.rank_changed'
        };

        return __($translation_key, ['old' => $old_rank, 'new' => $new_rank]);
    }
}
