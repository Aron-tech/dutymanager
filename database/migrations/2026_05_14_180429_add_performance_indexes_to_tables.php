<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guild_users', function (Blueprint $table) {
            $table->index('guild_id');
            $table->index('user_id');
            $table->index('accepted_at');
            $table->unique(['guild_id', 'user_id']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('guild_id');
            $table->index('user_id');
            $table->index('target_id');
            $table->index('created_at');
        });

        Schema::table('holidays', function (Blueprint $table) {
            $table->index('guild_id');
            $table->index('user_id');
            $table->index('guild_user_id');
            $table->index(['ended_at'], 'holidays_unprocessed_idx')->where('is_expired', false);
        });

        Schema::table('punishments', function (Blueprint $table) {
            $table->index('guild_id');
            $table->index('user_id');
            $table->index('guild_user_id');
            $table->index('created_by');
            $table->index(['expires_at'], 'punishments_unprocessed_idx')->where('is_expired', false);
        });

        Schema::table('duties', function (Blueprint $table) {
            $table->index('guild_id');
            $table->index('user_id');
            $table->index('started_at');
            $table->index(['guild_user_id', 'status']);
        });

        Schema::table('guild_roles', function (Blueprint $table) {
            $table->index('guild_id');
        });

        Schema::table('license_keys', function (Blueprint $table) {
            $table->index('guild_id');
            $table->index('activated_by');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->index('guild_id');
        });

        DB::statement('CREATE INDEX guild_settings_feature_settings_gin ON guild_settings USING GIN (feature_settings);');
        DB::statement('CREATE INDEX guild_users_cached_roles_gin ON guild_users USING GIN (cached_roles);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS guild_settings_feature_settings_gin;');
        DB::statement('DROP INDEX IF EXISTS guild_users_cached_roles_gin;');

        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
        });

        Schema::table('license_keys', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
            $table->dropIndex(['activated_by']);
        });

        Schema::table('guild_roles', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
        });

        Schema::table('duties', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['started_at']);
            $table->dropIndex(['guild_user_id', 'status']);
        });

        Schema::table('punishments', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['guild_user_id']);
            $table->dropIndex(['created_by']);
            $table->dropIndex('punishments_unprocessed_idx');
        });

        Schema::table('holidays', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['guild_user_id']);
            $table->dropIndex('holidays_unprocessed_idx');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['target_id']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('guild_users', function (Blueprint $table) {
            $table->dropIndex(['guild_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['accepted_at']);
        });
    }
};
