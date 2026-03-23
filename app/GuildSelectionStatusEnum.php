<?php

namespace App;

enum GuildSelectionStatusEnum: string
{
    case FULL_ACCESS = 'full_access';               // 1. eset
    case NEEDS_REQUEST = 'needs_request';           // 2. eset
    case LIMITED_ADMIN = 'limited_admin';           // 3. eset
    case NEEDS_INSTALLATION = 'needs_installation'; // 4. eset
}
