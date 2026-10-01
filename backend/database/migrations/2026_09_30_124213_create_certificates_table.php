<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // Format: CBEC/ID/IX/20260166
            $table->string('serial_number')->unique();
            // Format: CBECIDIX20260166HBB (for URL & QR Code)
            $table->string('serial_url_key')->unique();
            $table->string('grade');               // e.g. 'Excellent', 'Good'
            $table->date('date_of_issue');
            $table->string('place_of_issue')->default('Jakarta');
            $table->string('pdf_path')->nullable(); // Path PDF sertifikat yang digenerate
            $table->enum('sync_status', ['pending', 'synced', 'failed'])->default('pending');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
