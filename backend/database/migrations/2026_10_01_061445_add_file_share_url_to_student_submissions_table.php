<?php

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
        Schema::table('student_submissions', function (Blueprint $table) {
            $table->string('file_share_url', 1000)->nullable()->after('video_url')
                  ->comment('URL share file Google Drive / OneDrive untuk essay submission');
            $table->json('mcq_answers_json')->nullable()->after('file_share_url')
                  ->comment('Simpan jawaban MCQ student untuk review setelah submit');
            $table->integer('correct_count')->nullable()->after('mcq_answers_json');
        });
    }

    public function down(): void
    {
        Schema::table('student_submissions', function (Blueprint $table) {
            $table->dropColumn(['file_share_url', 'mcq_answers_json', 'correct_count']);
        });
    }
};
