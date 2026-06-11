<?php

use App\Enums\ItemTypeEnum;
use App\Models\Guild;
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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('guild_id', 30);
            $table->string('name');
            $table->enum('type', ItemTypeEnum::getOptions());
            $table->jsonb('details');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('guild_id')->references('id')->on('guilds')->onDelete('restrict');
            $table->index('guild_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
