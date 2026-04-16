<?php

use App\Enums\GlobalRoleEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('name');
            $table->string('global_name')->nullable();
            $table->string('email')->unique()->nullable();
            $table->string('avatar_url')->nullable();
            $table->enum('global_role', GlobalRoleEnum::getOptions())->default(GlobalRoleEnum::USER);
            $table->string('lang_code', 4)->default('hu');
            $table->string('access_token')->nullable();
            $table->string('refresh_token')->nullable();
            $table->timestamp('access_expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id')->nullable()->index();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
