<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scholarship_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnDelete();
            $table->text('motivation_letter');
            $table->string('document_url');  // Path file PDF yang diupload
            $table->enum('decision_status', [
                'pending',
                'approved_fully',
                'approved_partial_a',
                'approved_partial_b',
                'rejected',
            ])->default('pending');
            $table->text('reviewer_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scholarship_applications');
    }
};
