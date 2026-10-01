<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('certificate_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('certificate_id')->constrained('certificates')->cascadeOnDelete();
            $table->enum('status', ['success', 'failed']);
            $table->integer('http_status_code')->nullable();
            $table->text('response_body')->nullable();  // Simpan response dari API TBE
            $table->text('error_message')->nullable();
            $table->timestamp('attempted_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_sync_logs');
    }
};
