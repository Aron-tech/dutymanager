<?php

use App\DutyStatusEnum;
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
            $table->string('guild_user_id');
            $table->unsignedInteger('value');
            $table->timestamp('started_at');
            $table->timestamp('finished_at');
            $table->enum('status', DutyStatusEnum::getOptions());
            $table->softDeletes();

            $table->foreign('guild_user_id')->references('id')->on('guild_users');
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
