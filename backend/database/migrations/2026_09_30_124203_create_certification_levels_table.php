<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('certification_levels', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();        // 'FND', 'SPEC'
            $table->string('name');                      // 'Foundation Level'
            $table->text('description')->nullable();
            $table->boolean('is_field_trip_required')->default(false);
            $table->boolean('is_critical_thinking_required')->default(false);
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certification_levels');
    }
};
