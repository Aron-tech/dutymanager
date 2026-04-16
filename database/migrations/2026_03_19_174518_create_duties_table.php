<?php

use App\Enums\DutyStatusEnum;
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
            $table->foreignId('guild_user_id')->constrained();
            $table->integer('value');
            $table->timestamp('started_at');
            $table->timestamp('finished_at');
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
