<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('course_batches', function (Blueprint $table) {
            $table->date('in_class_learning_date')->nullable()->after('end_date');
            $table->date('exam_mcq_date')->nullable()->after('in_class_learning_date');
            $table->date('exam_essay_start_date')->nullable()->after('exam_mcq_date');
            $table->date('exam_essay_end_date')->nullable()->after('exam_essay_start_date');
            $table->date('exam_presentation_date')->nullable()->after('exam_essay_end_date');
        });
    }

    public function down(): void
    {
        Schema::table('course_batches', function (Blueprint $table) {
            $table->dropColumn([
                'in_class_learning_date',
                'exam_mcq_date',
                'exam_essay_start_date',
                'exam_essay_end_date',
                'exam_presentation_date',
            ]);
        });
    }
};
