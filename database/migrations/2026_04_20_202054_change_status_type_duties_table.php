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
        DB::statement('ALTER TABLE duties ALTER COLUMN status TYPE bigint USING status::bigint');
        Schema::table('duties', function (Blueprint $table) {
            $table->unsignedBigInteger('status')->default(DutyStatusEnum::CURRENT_PERIOD->value)->change();
        });
    }

    public function down(): void
    {
        Schema::table('duties', function (Blueprint $table) {
            $table->string('status')->change();
        });
    }
};
