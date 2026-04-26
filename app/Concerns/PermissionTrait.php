<?php

namespace App\Concerns;

use App\Enums\PermissionEnum;
use App\Models\User;

trait PermissionTrait
{
    use ResponsesTrait;
    private function checkAPIPermission(PermissionEnum $permission, User $user): array
    {
        $has_permission = $user->cannot($permission);
    }
}
