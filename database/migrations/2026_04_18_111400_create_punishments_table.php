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
            $table->foreignIdFor(User::class)->constrained();
            $table->foreignIdFor(Guild::class)->constrained();
            $table->foreignIdFor(GuildUser::class)->nullable()->constrained()->nullOnDelete();
            $table->enum('type', PunishmentTypeEnum::getOptions());
            $table->unsignedTinyInteger('level')->nullable();
            $table->text('reason');
            $table->foreignIdFor(User::class, 'created_by')->constrained('users');
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
