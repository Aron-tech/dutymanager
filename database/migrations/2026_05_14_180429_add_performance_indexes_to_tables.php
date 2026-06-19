<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function indexExists(string $table, string $index): bool
    {
        return DB::selectOne(
            "SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = :table AND indexname = :index",
            ['table' => $table, 'index' => $index]
        ) !== null;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guild_users', function (Blueprint $table) {
            if (! $this->indexExists('guild_users', 'guild_users_guild_id_index')) {
                $table->index('guild_id');
            }
            if (! $this->indexExists('guild_users', 'guild_users_user_id_index')) {
                $table->index('user_id');
            }
            if (! $this->indexExists('guild_users', 'guild_users_accepted_at_index')) {
                $table->index('accepted_at');
            }
            if (! $this->indexExists('guild_users', 'guild_users_guild_id_user_id_unique')) {
                $table->unique(['guild_id', 'user_id']);
            }
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            if (! $this->indexExists('activity_logs', 'activity_logs_guild_id_index')) {
                $table->index('guild_id');
            }
            if (! $this->indexExists('activity_logs', 'activity_logs_user_id_index')) {
                $table->index('user_id');
            }
            if (! $this->indexExists('activity_logs', 'activity_logs_target_id_index')) {
                $table->index('target_id');
            }
            if (! $this->indexExists('activity_logs', 'activity_logs_created_at_index')) {
                $table->index('created_at');
            }
        });

        Schema::table('holidays', function (Blueprint $table) {
            if (! $this->indexExists('holidays', 'holidays_guild_id_index')) {
                $table->index('guild_id');
            }
            if (! $this->indexExists('holidays', 'holidays_user_id_index')) {
                $table->index('user_id');
            }
            if (! $this->indexExists('holidays', 'holidays_guild_user_id_index')) {
                $table->index('guild_user_id');
            }
            if (! $this->indexExists('holidays', 'holidays_unprocessed_idx')) {
                $table->index(['ended_at'], 'holidays_unprocessed_idx')->where('is_expired', false);
            }
        });

        Schema::table('punishments', function (Blueprint $table) {
            if (! $this->indexExists('punishments', 'punishments_guild_id_index')) {
                $table->index('guild_id');
            }
            if (! $this->indexExists('punishments', 'punishments_user_id_index')) {
                $table->index('user_id');
            }
            if (! $this->indexExists('punishments', 'punishments_guild_user_id_index')) {
                $table->index('guild_user_id');
            }
            if (! $this->indexExists('punishments', 'punishments_created_by_index')) {
                $table->index('created_by');
            }
            if (! $this->indexExists('punishments', 'punishments_unprocessed_idx')) {
                $table->index(['expires_at'], 'punishments_unprocessed_idx')->where('is_expired', false);
            }
        });

        Schema::table('duties', function (Blueprint $table) {
            if (! $this->indexExists('duties', 'duties_guild_id_index')) {
                $table->index('guild_id');
            }
            if (! $this->indexExists('duties', 'duties_user_id_index')) {
                $table->index('user_id');
            }
            if (! $this->indexExists('duties', 'duties_started_at_index')) {
                $table->index('started_at');
            }
            if (! $this->indexExists('duties', 'duties_guild_user_id_status_index')) {
                $table->index(['guild_user_id', 'status']);
            }
        });

        Schema::table('guild_roles', function (Blueprint $table) {
            if (! $this->indexExists('guild_roles', 'guild_roles_guild_id_index')) {
                $table->index('guild_id');
            }
        });

        Schema::table('license_keys', function (Blueprint $table) {
            if (! $this->indexExists('license_keys', 'license_keys_guild_id_index')) {
                $table->index('guild_id');
            }
            if (! $this->indexExists('license_keys', 'license_keys_activated_by_index')) {
                $table->index('activated_by');
            }
        });

        Schema::table('items', function (Blueprint $table) {
            if (! $this->indexExists('items', 'items_guild_id_index')) {
                $table->index('guild_id');
            }
        });

        if (! $this->indexExists('guild_settings', 'guild_settings_feature_settings_gin')) {
            DB::statement('CREATE INDEX guild_settings_feature_settings_gin ON guild_settings USING GIN (feature_settings);');
        }
        if (! $this->indexExists('guild_users', 'guild_users_cached_roles_gin')) {
            DB::statement('CREATE INDEX guild_users_cached_roles_gin ON guild_users USING GIN (cached_roles);');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS guild_settings_feature_settings_gin;');
        DB::statement('DROP INDEX IF EXISTS guild_users_cached_roles_gin;');

        Schema::table('items', function (Blueprint $table) {
            if ($this->indexExists('items', 'items_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
        });

        Schema::table('license_keys', function (Blueprint $table) {
            if ($this->indexExists('license_keys', 'license_keys_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
            if ($this->indexExists('license_keys', 'license_keys_activated_by_index')) {
                $table->dropIndex(['activated_by']);
            }
        });

        Schema::table('guild_roles', function (Blueprint $table) {
            if ($this->indexExists('guild_roles', 'guild_roles_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
        });

        Schema::table('duties', function (Blueprint $table) {
            if ($this->indexExists('duties', 'duties_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
            if ($this->indexExists('duties', 'duties_user_id_index')) {
                $table->dropIndex(['user_id']);
            }
            if ($this->indexExists('duties', 'duties_started_at_index')) {
                $table->dropIndex(['started_at']);
            }
            if ($this->indexExists('duties', 'duties_guild_user_id_status_index')) {
                $table->dropIndex(['guild_user_id', 'status']);
            }
        });

        Schema::table('punishments', function (Blueprint $table) {
            if ($this->indexExists('punishments', 'punishments_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
            if ($this->indexExists('punishments', 'punishments_user_id_index')) {
                $table->dropIndex(['user_id']);
            }
            if ($this->indexExists('punishments', 'punishments_guild_user_id_index')) {
                $table->dropIndex(['guild_user_id']);
            }
            if ($this->indexExists('punishments', 'punishments_created_by_index')) {
                $table->dropIndex(['created_by']);
            }
            if ($this->indexExists('punishments', 'punishments_unprocessed_idx')) {
                $table->dropIndex('punishments_unprocessed_idx');
            }
        });

        Schema::table('holidays', function (Blueprint $table) {
            if ($this->indexExists('holidays', 'holidays_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
            if ($this->indexExists('holidays', 'holidays_user_id_index')) {
                $table->dropIndex(['user_id']);
            }
            if ($this->indexExists('holidays', 'holidays_guild_user_id_index')) {
                $table->dropIndex(['guild_user_id']);
            }
            if ($this->indexExists('holidays', 'holidays_unprocessed_idx')) {
                $table->dropIndex('holidays_unprocessed_idx');
            }
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            if ($this->indexExists('activity_logs', 'activity_logs_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
            if ($this->indexExists('activity_logs', 'activity_logs_user_id_index')) {
                $table->dropIndex(['user_id']);
            }
            if ($this->indexExists('activity_logs', 'activity_logs_target_id_index')) {
                $table->dropIndex(['target_id']);
            }
            if ($this->indexExists('activity_logs', 'activity_logs_created_at_index')) {
                $table->dropIndex(['created_at']);
            }
        });

        Schema::table('guild_users', function (Blueprint $table) {
            if ($this->indexExists('guild_users', 'guild_users_guild_id_index')) {
                $table->dropIndex(['guild_id']);
            }
            if ($this->indexExists('guild_users', 'guild_users_user_id_index')) {
                $table->dropIndex(['user_id']);
            }
            if ($this->indexExists('guild_users', 'guild_users_accepted_at_index')) {
                $table->dropIndex(['accepted_at']);
            }
        });
    }
};
