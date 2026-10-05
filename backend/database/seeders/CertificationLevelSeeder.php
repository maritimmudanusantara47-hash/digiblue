<?php

namespace Database\Seeders;

use App\Models\CertificationLevel;
use App\Models\Course;
use Illuminate\Database\Seeder;

class CertificationLevelSeeder extends Seeder
{
    public function run(): void
    {
        $foundation = CertificationLevel::firstOrCreate(
            ['code' => 'FND'],
            [
                'name' => 'Foundation Level',
                'description' => 'Program sertifikasi dasar Blue Economy. Peserta wajib mengikuti Training Course (Field Trip) atau menyelesaikan modul Critical Thinking.',
                'is_field_trip_required' => true,
                'is_critical_thinking_required' => true,
                'order_index' => 1,
                'is_active' => true,
            ]
        );

        $specialization = CertificationLevel::firstOrCreate(
            ['code' => 'SPEC'],
            [
                'name' => 'Specialization Level',
                'description' => 'Program sertifikasi peminatan Blue Economy. Tidak wajib mengikuti Training Course atau Critical Thinking.',
                'is_field_trip_required' => false,
                'is_critical_thinking_required' => false,
                'order_index' => 2,
                'is_active' => true,
            ]
        );

        $national = CertificationLevel::firstOrCreate(
            ['code' => 'NAT'],
            [
                'name' => 'National Training Course',
                'description' => 'Program pelatihan tingkat nasional.',
                'is_field_trip_required' => false,
                'is_critical_thinking_required' => false,
                'order_index' => 3,
                'is_active' => true,
            ]
        );

        $singleModule = CertificationLevel::firstOrCreate(
            ['code' => 'SGL'],
            [
                'name' => 'Single Module Course',
                'description' => 'Kursus modul tunggal tematik.',
                'is_field_trip_required' => false,
                'is_critical_thinking_required' => false,
                'order_index' => 4,
                'is_active' => true,
            ]
        );
    }
}
