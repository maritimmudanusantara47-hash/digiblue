<?php

namespace Tests\Feature;

use App\Models\CertificationLevel;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CourseContent;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EnrollmentSecurityTest extends TestCase
{
    use RefreshDatabase;

    private User $studentA;
    private User $studentB;
    private User $admin;
    private Course $course;
    private CourseContent $content;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'student', 'guard_name' => 'web']);
        Role::create(['name' => 'admin',   'guard_name' => 'web']);

        $this->studentA = User::create([
            'name'              => 'Student A',
            'email'             => 'student.a@example.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $this->studentA->assignRole('student');

        $this->studentB = User::create([
            'name'              => 'Student B',
            'email'             => 'student.b@example.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $this->studentB->assignRole('student');

        $this->admin = User::create([
            'name'     => 'Admin System',
            'email'    => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);
        $this->admin->assignRole('admin');

        $level = CertificationLevel::create([
            'name'        => 'Foundation Level',
            'code'        => 'FND',
            'order_index' => 1,
            'is_active'   => true,
        ]);

        $this->course = Course::create([
            'certification_level_id' => $level->id,
            'title'                  => 'Ekonomi Biru Indonesia',
            'slug'                   => 'ekonomi-biru-indonesia',
            'price_idr'              => 500000,
            'is_active'              => true,
            'order_index'            => 1,
        ]);

        $section = CourseSection::create([
            'course_id'   => $this->course->id,
            'title'       => 'Seksi 1',
            'order_index' => 1,
        ]);

        $this->content = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'pdf_module',
            'title'        => 'Materi Modul 1',
            'order_index'  => 1,
        ]);
    }

    public function test_student_cannot_view_another_students_enrollment_detail(): void
    {
        // Enrollment milik Student B
        $enrollmentB = Enrollment::create([
            'user_id'         => $this->studentB->id,
            'course_id'       => $this->course->id,
            'status'          => 'active',
            'enrollment_type' => 'self_paid',
        ]);

        // Student A mencoba mengakses enrollment milik Student B
        Sanctum::actingAs($this->studentA);

        $response = $this->getJson("/api/v1/enrollments/{$enrollmentB->id}");

        // Wajib 404 Not Found karena di-filter oleh where('user_id', $user->id)
        $response->assertStatus(404);
    }

    public function test_admin_can_view_any_students_enrollment(): void
    {
        $enrollmentB = Enrollment::create([
            'user_id'         => $this->studentB->id,
            'course_id'       => $this->course->id,
            'status'          => 'active',
            'enrollment_type' => 'self_paid',
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->getJson("/api/v1/enrollments/{$enrollmentB->id}");
        $response->assertStatus(200);
    }

    public function test_unpaid_student_cannot_access_course_contents(): void
    {
        // Enrollment masih payment_pending (belum bayar)
        $enrollmentA = Enrollment::create([
            'user_id'         => $this->studentA->id,
            'course_id'       => $this->course->id,
            'status'          => 'payment_pending',
            'enrollment_type' => 'self_paid',
        ]);

        Sanctum::actingAs($this->studentA);

        $response = $this->getJson("/api/v1/enrollments/{$enrollmentA->id}/contents");

        // Wajib 404/ditolak karena hanya status active atau completed yang diizinkan
        $response->assertStatus(404);
    }

    public function test_active_paid_student_can_access_course_contents(): void
    {
        $enrollmentA = Enrollment::create([
            'user_id'         => $this->studentA->id,
            'course_id'       => $this->course->id,
            'status'          => 'active',
            'payment_status'  => 'paid',
            'paid_at'         => now(),
            'enrollment_type' => 'self_paid',
        ]);

        Sanctum::actingAs($this->studentA);

        $response = $this->getJson("/api/v1/enrollments/{$enrollmentA->id}/contents");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'enrollment',
                         'course',
                         'sections',
                     ]
                 ]);
    }

    public function test_non_enrolled_student_cannot_submit_homework_or_quiz(): void
    {
        // Student A tidak terdaftar di kursus ini
        Sanctum::actingAs($this->studentA);

        $response = $this->postJson('/api/v1/submissions', [
            'content_id' => $this->content->id,
            'essay_text' => 'Jawaban tanpa beli kursus',
        ]);

        // Ditolak dengan 403 Forbidden
        $response->assertStatus(403);
    }

    public function test_unverified_student_blocked_from_course_contents(): void
    {
        $unverifiedStudent = User::create([
            'name'              => 'Unverified Student',
            'email'             => 'unverified@example.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => null,
        ]);
        $unverifiedStudent->assignRole('student');

        $enrollment = Enrollment::create([
            'user_id'         => $unverifiedStudent->id,
            'course_id'       => $this->course->id,
            'status'          => 'active',
            'payment_status'  => 'paid',
            'paid_at'         => now(),
            'enrollment_type' => 'self_paid',
        ]);

        Sanctum::actingAs($unverifiedStudent);

        $response = $this->getJson("/api/v1/enrollments/{$enrollment->id}/contents");
        $response->assertStatus(403)
                 ->assertJson([
                     'email_unverified' => true,
                 ]);
    }

    public function test_unverified_student_cannot_enroll_in_course(): void
    {
        $unverifiedStudent = User::create([
            'name'              => 'Unverified Student Enroll',
            'email'             => 'unverified.enroll@example.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => null,
        ]);
        $unverifiedStudent->assignRole('student');

        Sanctum::actingAs($unverifiedStudent);

        $response = $this->postJson('/api/v1/enrollments', [
            'course_id' => $this->course->id,
        ]);

        $response->assertStatus(403)
                 ->assertJson([
                     'email_unverified' => true,
                 ]);
    }
}
