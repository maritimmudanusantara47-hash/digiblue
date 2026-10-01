<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('scholarship_appeals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scholarship_application_id')->constrained('scholarship_applications')->cascadeOnDelete();
            $table->text('reason');                                 // Alasan keberatan / kendala finansial
            $table->decimal('proposed_amount', 12, 2)->nullable(); // Nominal yang diusulkan peserta
            $table->string('supporting_document_url')->nullable();  // Bukti tambahan opsional
            $table->decimal('final_agreed_amount', 12, 2)->nullable(); // Nominal kesepakatan akhir dari admin
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_response_notes')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scholarship_appeals');
    }
};
