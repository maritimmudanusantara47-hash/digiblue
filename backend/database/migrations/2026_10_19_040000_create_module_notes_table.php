<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_content_id')->constrained('course_contents')->cascadeOnDelete();
            $table->text('note_text')->nullable();
            $table->text('selected_text')->nullable(); // Kutipan yang disorot
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_notes');
    }
};
