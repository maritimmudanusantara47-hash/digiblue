<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('course_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');          // e.g. 'Materi Pembelajaran', 'Ujian & Tugas'
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });

        Schema::create('course_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('course_sections')->cascadeOnDelete();
            $table->enum('content_type', [
                'pdf_module',       // Materi PDF yang diupload admin
                'video_embed',      // Video embed YouTube / GDrive
                'mcq_quiz',         // Kuis Pilihan Ganda (auto-graded)
                'essay_task',       // Tugas Esai (manual graded)
                'oral_video_task',  // Video Oral Exam (manual graded)
                'critical_thinking',// Modul Critical Thinking khusus Foundation
                'field_study',      // Training Course (Field Study)
            ]);
            $table->string('title');
            $table->string('file_path')->nullable();        // Untuk pdf_module
            $table->string('embed_url')->nullable();        // Untuk video_embed
            $table->text('instruction_text')->nullable();   // Untuk essay_task / oral_video_task
            $table->integer('max_score')->default(100);
            $table->boolean('is_prerequisite')->default(false); // Harus selesai sebelum lanjut
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_contents');
        Schema::dropIfExists('course_sections');
    }
};
