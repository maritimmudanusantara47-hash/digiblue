<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('tbe_user_id')->nullable()->after('id')->index()->comment('ID User di The Blue Economist');
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->unsignedBigInteger('tbe_certificate_id')->nullable()->after('id')->index()->comment('ID Sertifikat di The Blue Economist');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('tbe_user_id');
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn('tbe_certificate_id');
        });
    }
};

