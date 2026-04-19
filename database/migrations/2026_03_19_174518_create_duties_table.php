<?php

use App\Enums\DutyStatusEnum;
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
        Schema::create('duties', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(GuildUser::class)->nullable()->constrained()->nullOnDelete();
            $table->foreignIdFor(Guild::class)->constrained();
            $table->foreignIdFor(User::class)->constrained();
            $table->integer('value')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->enum('status', DutyStatusEnum::getOptions());
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('duties');
    }
};
