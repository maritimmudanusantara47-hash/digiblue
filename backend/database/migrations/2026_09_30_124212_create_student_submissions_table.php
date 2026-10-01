<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('content_id')->constrained('course_contents')->cascadeOnDelete();
            $table->text('essay_text')->nullable();          // Isi esai
            $table->string('video_url')->nullable();         // Link video oral exam
            $table->json('mcq_answers')->nullable();         // { question_id: option_id, ... }
            $table->decimal('score', 8, 2)->nullable();      // Nilai akhir (auto/manual)
            $table->text('assessor_feedback')->nullable();
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('graded_at')->nullable();
            $table->enum('status', ['submitted', 'graded'])->default('submitted');
            $table->timestamps();

            $table->unique(['user_id', 'content_id']); // 1 submission per konten per user
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_submissions');
    }
};
