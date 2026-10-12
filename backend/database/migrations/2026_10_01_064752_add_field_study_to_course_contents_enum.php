<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE course_contents MODIFY COLUMN content_type ENUM(
                'pdf_module',
                'video_embed',
                'mcq_quiz',
                'essay_task',
                'oral_video_task',
                'critical_thinking',
                'field_study'
            ) NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE course_contents MODIFY COLUMN content_type ENUM(
                'pdf_module',
                'video_embed',
                'mcq_quiz',
                'essay_task',
                'oral_video_task',
                'critical_thinking'
            ) NOT NULL");
        }
    }
};
