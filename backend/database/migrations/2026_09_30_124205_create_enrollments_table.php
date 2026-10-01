<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->enum('enrollment_type', [
                'self_paid',
                'scholarship_fully',
                'scholarship_partial_a',
                'scholarship_partial_b',
            ])->nullable();
            $table->enum('status', [
                'pending_review',   // Menunggu kurasi beasiswa
                'payment_pending',  // Menunggu pembayaran (jalur mandiri / partial)
                'active',           // Kursus terbuka, sedang belajar
                'completed',        // Selesai, sertifikat terbit
                'rejected',         // Ditolak admin
            ])->default('pending_review');
            $table->boolean('attended_field_trip')->default(false);  // Centang admin: hadir Field Trip
            $table->decimal('final_payment_amount', 12, 2)->nullable(); // Nominal akhir setelah negosiasi
            $table->string('payment_token')->nullable();             // Token Midtrans/Xendit
            $table->string('payment_status')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']); // 1 user hanya bisa 1x daftar per kursus
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
