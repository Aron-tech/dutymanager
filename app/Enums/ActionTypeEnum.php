<?php

namespace App\Enums;

enum ActionTypeEnum: string
{
    case FIRST_LOGIN_TO_WEBSITE = 'first_login_to_website';
    case ADD_USER_TO_GUILD = 'add_user_to_guild';
    case ADD_USER_TO_GUILD_WITH_RESTORE = 'add_user_to_guild_with_restore';
    case ACCEPTED_USER_TO_GUILD = 'accepted_user_to_guild';
    case UPDATE_USER_TO_GUILD = 'update_user_to_guild';
    case DELETE_USER_FROM_GUILD = 'delete_user_from_guild';

    case UPLOAD_IMAGE_TO_USER_GUILD = 'upload_image_to_user_guild';
    case DELETE_IMAGE_FROM_USER_GUILD = 'delete_image_from_user_guild';

    case ADD_ITEM_TO_GUILD = 'add_item_to_guild';
    case DELETE_ITEM_FROM_GUILD = 'delete_item_from_guild';

    case JOIN_TO_GUILD = 'join_to_guild';
    case LEAVE_FROM_GUILD = 'leave_from_guild';
    case ADD_BOT_TO_GUILD = 'add_bot_to_guild';

    case ADD_DUTY_TO_GUILD_USER = 'add_duty_to_guild_user';
    case UPDATE_DUTY_TO_GUILD_USER = 'update_duty_to_guild_user';
    case CANCELED_DUTY_FROM_GUILD_USER = 'canceled_duty_from_guild_user';
    case DELETE_DUTY_FROM_GUILD_USER = 'delete_duty_from_guild_user';

    case ADD_PUNISHMENT_TO_GUILD_USER = 'add_punishment_to_guild_user';
    case DELETE_PUNISHMENT_FROM_GUILD_USER = 'delete_punishment_from_guild_user';
    case SETUP_GUILD = 'setup_guild';

    // DEFAULT logs
    case ON_DUTY = 'on_duty';
    case OFF_DUTY = 'off_duty';
    case CANCEL_GUILD = 'cancel_duty';

    case REQUEST_JOIN_GUILD = 'request_join_guild';
    case GET_HOLIDAY = 'get_holiday';
    case CANCEL_HOLIDAY = 'cancel_holiday';

    /**
     * @return array
     */
    public static function getOptions(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function getLabel(): string
    {
        return __('log.'.$this->value);
    }
}
