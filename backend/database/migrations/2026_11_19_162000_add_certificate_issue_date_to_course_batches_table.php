<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('course_batches', function (Blueprint $table) {
            $table->date('certificate_issue_date')->nullable()->after('field_trip_date');
        });
    }

    public function down(): void
    {
        Schema::table('course_batches', function (Blueprint $table) {
            $table->dropColumn('certificate_issue_date');
        });
    }
};
