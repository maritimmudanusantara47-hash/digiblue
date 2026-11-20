<?php

namespace Database\Seeders;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CertificateSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Data Peserta Contoh Sertifikat
        $students = [
            [
                'name'         => 'Budi Santoso',
                'email'        => 'student@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '081234567890',
                'institution'  => 'Universitas Indonesia',
                'course_slug'  => 'certified-blue-economist-foundation',
                'serial_number'=> 'CBEC/ID/X/20260001',
                'serial_key'   => 'CBECIDX20260001BST',
                'grade'        => 'Excellent',
                'date_of_issue'=> '2026-10-23',
                'place'        => 'Jakarta',
            ],
            [
                'name'         => 'Iqbal Hambali',
                'email'        => 'iqbal@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '081298765432',
                'institution'  => 'Institut Pertanian Bogor',
                'course_slug'  => 'certified-blue-economist-foundation',
                'serial_number'=> 'CBEC/ID/XI/20260002',
                'serial_key'   => 'CBECIDXI20260002IQB',
                'grade'        => 'Excellent',
                'date_of_issue'=> '2026-11-20',
                'place'        => 'Jakarta',
            ],
            [
                'name'         => 'Nabila Azzahro Widodo',
                'email'        => 'nabila@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '082345678901',
                'institution'  => 'Universitas Diponegoro',
                'course_slug'  => 'blue-farming',
                'serial_number'=> 'CBEC/ID/XI/20260003',
                'serial_key'   => 'CBECIDXI20260003NAB',
                'grade'        => 'Excellent',
                'date_of_issue'=> '2026-11-20',
                'place'        => 'Jakarta',
            ],
            [
                'name'         => 'Siti Rahma',
                'email'        => 'student2@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '082345678902',
                'institution'  => 'Institut Teknologi Bandung',
                'course_slug'  => 'blue-tourism',
                'serial_number'=> 'CBEC/ID/XI/20260004',
                'serial_key'   => 'CBECIDXI20260004STR',
                'grade'        => 'Excellent',
                'date_of_issue'=> '2026-11-20',
                'place'        => 'Jakarta',
            ],
            [
                'name'         => 'Ahmad Fauzi',
                'email'        => 'student3@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '083456789012',
                'institution'  => 'Universitas Gadjah Mada',
                'course_slug'  => 'blue-energy',
                'serial_number'=> 'CBEC/ID/XI/20260005',
                'serial_key'   => 'CBECIDXI20260005AHM',
                'grade'        => 'Good',
                'date_of_issue'=> '2026-11-20',
                'place'        => 'Jakarta',
            ],
        ];

        foreach ($students as $data) {
            // A. Cari atau buat User
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => Hash::make($data['password']),
                    'phone_number'      => $data['phone_number'],
                    'institution'       => $data['institution'],
                    'email_verified_at' => now(),
                ]
            );

            if (!$user->hasRole('student')) {
                $user->assignRole('student');
            }

            // B. Cari Course terkait (atau fallback ke kursus pertama jika slug tidak ditemukan)
            $course = Course::where('slug', $data['course_slug'])->first() ?? Course::first();
            if (!$course) {
                continue;
            }

            // C. Buat atau update Enrollment kelulusan
            $enrollment = Enrollment::firstOrCreate(
                [
                    'user_id'   => $user->id,
                    'course_id' => $course->id,
                ],
                [
                    'enrollment_type'     => 'self_paid',
                    'status'              => 'completed',
                    'attended_field_trip' => true,
                    'paid_at'             => now()->subDays(30),
                ]
            );

            // D. Buat atau update Certificate
            Certificate::firstOrCreate(
                [
                    'enrollment_id' => $enrollment->id,
                ],
                [
                    'user_id'        => $user->id,
                    'serial_number'  => $data['serial_number'],
                    'serial_url_key' => $data['serial_key'],
                    'grade'          => $data['grade'],
                    'date_of_issue'  => $data['date_of_issue'],
                    'place_of_issue' => $data['place'],
                    'sync_status'    => 'synced',
                    'synced_at'      => now(),
                ]
            );
        }
    }
}
