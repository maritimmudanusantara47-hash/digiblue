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
        // 1. Drop tabel beasiswa (appeals harus di-drop duluan karena ada foreign key ke applications)
        Schema::dropIfExists('scholarship_appeals');
        Schema::dropIfExists('scholarship_applications');

        // 2. Perbarui tabel enrollments
        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('enrollment_type')->nullable()->change();
            $table->string('status')->default('payment_pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback
    }
};
