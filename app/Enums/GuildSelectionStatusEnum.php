<?php

namespace App\Enums;

enum GuildSelectionStatusEnum: string
{
    case FULL_ACCESS = 'full_access';
    case NEEDS_REQUEST = 'needs_request';
    case LIMITED_ADMIN = 'limited_admin';
    case NEEDS_INSTALLATION = 'needs_installation';
    case NEEDS_DEV_GUILD = 'needs_dev_guild';
    case NOT_INSTALLED_NO_ACCESS = 'not_installed_no_access';
}
