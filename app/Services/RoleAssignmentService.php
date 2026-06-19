<?php

namespace App\Services;

use App\Models\ExamAttempt;

class RoleAssignmentService
{
    /**
     * Assigns roles defined in the exam settings to the user if they passed.
     */
    public function assignPassedRoles(ExamAttempt $attempt): void
    {
        $exam = $attempt->exam;
        $guild_user = $attempt->guildUser;

        if ($attempt->score >= $exam->min_percent && $exam->auto_grade) {
            $settings = $exam->settings ?? [];
            $roles = [];

            if (is_array($settings)) {
                if (isset($settings['passed_roles']) && is_array($settings['passed_roles'])) {
                    $roles = $settings['passed_roles'];
                } elseif (isset($settings['roles']) && is_array($settings['roles'])) {
                    $roles = $settings['roles'];
                } elseif (isset($settings['roles_to_assign']) && is_array($settings['roles_to_assign'])) {
                    $roles = $settings['roles_to_assign'];
                } else {
                    $is_list = count(array_filter(array_keys($settings), 'is_string')) === 0;
                    if ($is_list) {
                        $roles = $settings;
                    }
                }
            }

            foreach ($roles as $role_id) {
                if (is_string($role_id)) {
                    DiscordFetchService::addRoleToMember($attempt->guild_id, $attempt->user_id, $role_id);

                    $cached_roles = $guild_user->cached_roles ?? [];
                    if (! in_array($role_id, $cached_roles)) {
                        $cached_roles[] = $role_id;
                        $guild_user->cached_roles = $cached_roles;
                        $guild_user->save();
                    }
                }
            }
        }
    }
}
