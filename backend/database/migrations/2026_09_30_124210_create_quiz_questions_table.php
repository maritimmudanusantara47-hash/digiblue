<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('course_contents')->cascadeOnDelete();
            $table->text('question_text');
            $table->integer('weight_score')->default(1); // Bobot nilai per soal — bisa diset admin
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
