<?php

use App\Enums\PunishmentTypeEnum;
use App\Models\Guild;
use App\Models\GuildUser;
use App\Models\User;
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
        Schema::create('punishments', function (Blueprint $table) {
            $table->id();
            $table->string('guild_id');
            $table->foreign('guild_id')->references('id')->on('guilds');
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreignIdFor(GuildUser::class)->nullable()->constrained()->nullOnDelete();
            $table->enum('type', PunishmentTypeEnum::getOptions());
            $table->unsignedTinyInteger('level')->nullable();
            $table->text('reason');
            $table->string('created_by');
            $table->foreign('created_by')->references('id')->on('users');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('punishments');
    }
};
