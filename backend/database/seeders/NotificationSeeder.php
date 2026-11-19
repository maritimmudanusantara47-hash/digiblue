<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Admin Notifications
        $admins = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->get();
        foreach ($admins as $admin) {
            UserNotification::firstOrCreate([
                'user_id'    => $admin->id,
                'title'      => 'Tugas Baru: Esai Modul Ekonomi Biru',
                'type'       => 'new_submission',
            ], [
                'message'    => 'Peserta Budi Santoso mengumpulkan tugas esai pada kursus Certified Blue Economist (CBEC).',
                'icon'       => 'pen-to-square',
                'action_url' => '/assessor/submissions',
                'is_read'    => false,
                'created_at' => now()->subMinutes(15),
                'updated_at' => now()->subMinutes(15),
            ]);

            UserNotification::firstOrCreate([
                'user_id'    => $admin->id,
                'title'      => 'Pendaftaran Kursus Baru',
                'type'       => 'new_enrollment',
            ], [
                'message'    => 'Peserta Siti Rahma baru saja mendaftar kursus Blue Business Development.',
                'icon'       => 'clipboard',
                'action_url' => '/admin/enrollments',
                'is_read'    => false,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ]);

            UserNotification::firstOrCreate([
                'user_id'    => $admin->id,
                'title'      => 'Sertifikat Baru Diterbitkan',
                'type'       => 'certificate_issued',
            ], [
                'message'    => 'Sertifikat resmi CBEC/ID/XI/20260012 otomatis diterbitkan untuk peserta Budi Santoso.',
                'icon'       => 'certificate-badge-1',
                'action_url' => '/admin/certificates',
                'is_read'    => true,
                'read_at'    => now()->subHours(1),
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(1),
            ]);
        }

        // 2. Assessor Notifications
        $assessors = User::whereHas('roles', fn($q) => $q->where('name', 'assessor'))->get();
        foreach ($assessors as $assessor) {
            UserNotification::firstOrCreate([
                'user_id'    => $assessor->id,
                'title'      => 'Tugas Baru Menunggu Penilaian',
                'type'       => 'new_submission',
            ], [
                'message'    => 'Peserta Budi Santoso telah mengumpulkan tugas Esai Modul 2 untuk dinilai.',
                'icon'       => 'pen-to-square',
                'action_url' => '/assessor/submissions',
                'is_read'    => false,
                'created_at' => now()->subMinutes(25),
                'updated_at' => now()->subMinutes(25),
            ]);

            UserNotification::firstOrCreate([
                'user_id'    => $assessor->id,
                'title'      => 'Video Ujian Lisan Siap Dinilai',
                'type'       => 'new_submission',
            ], [
                'message'    => 'Peserta Ahmad Fauzi mengumpulkan rekaman video ujian lisan.',
                'icon'       => 'pen-to-square',
                'action_url' => '/assessor/submissions',
                'is_read'    => false,
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3),
            ]);
        }

        // 3. Student Notifications (semua user student atau non-admin/non-assessor)
        $students = User::whereDoesntHave('roles', fn($q) => $q->whereIn('name', ['admin', 'assessor']))->get();
        foreach ($students as $student) {
            UserNotification::firstOrCreate([
                'user_id'    => $student->id,
                'title'      => 'Tugas Dinilai: Esai Studi Kasus Modul 1',
                'type'       => 'submission_graded',
            ], [
                'message'    => 'Tugas modul 1 Anda telah dinilai oleh Asesor dengan skor 94. Catatan: Argumen dan solusi praktis sangat tajam.',
                'icon'       => 'pencil-1',
                'action_url' => '/student/dashboard',
                'is_read'    => false,
                'created_at' => now()->subMinutes(40),
                'updated_at' => now()->subMinutes(40),
            ]);

            UserNotification::firstOrCreate([
                'user_id'    => $student->id,
                'title'      => 'Selamat! Sertifikat Resmi Anda Telah Terbit',
                'type'       => 'certificate_issued',
            ], [
                'message'    => 'Sertifikat kompetensi Foundation Level resmi Anda telah diterbitkan dan terdaftar di The Blue Economist.',
                'icon'       => 'certificate-badge-1',
                'action_url' => '/student/certificates',
                'is_read'    => false,
                'created_at' => now()->subHours(4),
                'updated_at' => now()->subHours(4),
            ]);

            UserNotification::firstOrCreate([
                'user_id'    => $student->id,
                'title'      => 'Akses Kursus Telah Aktif',
                'type'       => 'enrollment_activated',
            ], [
                'message'    => 'Pendaftaran Anda di Certified Blue Economist (CBEC) — Foundation Level telah aktif. Selamat belajar!',
                'icon'       => 'book-1',
                'action_url' => '/student/dashboard',
                'is_read'    => true,
                'read_at'    => now()->subDays(1),
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(1),
            ]);
        }
    }
}
