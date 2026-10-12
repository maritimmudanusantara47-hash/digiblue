<?php

namespace Tests\Feature;

use App\Models\CertificationLevel;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CourseContent;
use App\Models\Enrollment;
use App\Models\StudentSubmission;
use App\Models\User;
use App\Services\CertificateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CertificateAutoIssueTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private Course $course;
    private Enrollment $enrollment;
    private CourseContent $module;
    private CourseContent $quiz;
    private CourseContent $essay;
    private CourseContent $fieldStudy;
    private CourseContent $critThinking;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'student', 'guard_name' => 'web']);

        $this->student = User::create([
            'name'     => 'Ahmad Ramadhan',
            'email'    => 'ahmad@example.com',
            'password' => Hash::make('password'),
        ]);
        $this->student->assignRole('student');

        $level = CertificationLevel::create([
            'name'                   => 'Foundation Level',
            'code'                   => 'FND',
            'is_field_trip_required' => true,
            'order_index'            => 1,
            'is_active'              => true,
        ]);

        $this->course = Course::create([
            'certification_level_id' => $level->id,
            'title'                  => 'Certified Blue Economist Foundation',
            'slug'                   => 'cbec-foundation',
            'price_idr'              => 500000,
            'is_active'              => true,
            'order_index'            => 1,
        ]);

        $section = CourseSection::create([
            'course_id'   => $this->course->id,
            'title'       => 'Foundation Program',
            'order_index' => 1,
        ]);

        // 1. Modul Bacaan
        $this->module = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'pdf_module',
            'title'        => 'Foundation Learning Module',
            'order_index'  => 1,
        ]);

        // 2. Kuis MCQ
        $this->quiz = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'mcq_quiz',
            'title'        => 'Multiple-Choice Examination',
            'order_index'  => 2,
        ]);

        // 3. Tugas Esai
        $this->essay = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'essay_task',
            'title'        => 'Case-Study Essay Submission',
            'order_index'  => 3,
        ]);

        // 4. Field Study
        $this->fieldStudy = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'field_study',
            'title'        => 'Training Course (Field Study)',
            'order_index'  => 4,
        ]);

        // 5. Critical Thinking
        $this->critThinking = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'critical_thinking',
            'title'        => 'Critical Thinking Exam',
            'order_index'  => 5,
        ]);

        $this->enrollment = Enrollment::create([
            'user_id'              => $this->student->id,
            'course_id'            => $this->course->id,
            'status'               => 'active',
            'payment_status'       => 'paid',
            'paid_at'              => now(),
            'attended_field_trip'  => true, // Konfirmasi hadir field study
            'enrollment_type'      => 'self_paid',
        ]);
    }

    public function test_certificate_auto_issues_when_all_sections_completed_with_field_study(): void
    {
        // Beri nilai submission untuk modul 1, kuis, dan esai
        StudentSubmission::create([
            'user_id'    => $this->student->id,
            'content_id' => $this->module->id,
            'score'      => 100,
            'status'     => 'graded',
        ]);

        StudentSubmission::create([
            'user_id'    => $this->student->id,
            'content_id' => $this->quiz->id,
            'score'      => 85,
            'status'     => 'graded',
        ]);

        StudentSubmission::create([
            'user_id'    => $this->student->id,
            'content_id' => $this->essay->id,
            'score'      => 90,
            'status'     => 'graded',
        ]);

        // Karena attended_field_trip = true, Critical Thinking dibebaskan
        $certService = app(CertificateService::class);
        $eligibility = $certService->isEligibleForCertificate($this->enrollment);

        $this->assertTrue($eligibility['eligible'], 'Peserta harus eligible karena field study hadir dan 3 modul lain selesai dinilai');

        // Panggil endpoint /enrollments/{id}/contents
        Sanctum::actingAs($this->student);
        $response = $this->getJson("/api/v1/enrollments/{$this->enrollment->id}/contents");

        $response->assertStatus(200);

        // Pastikan sertifikat terbuat di database
        $this->assertDatabaseHas('certificates', [
            'enrollment_id' => $this->enrollment->id,
            'user_id'       => $this->student->id,
        ]);

        // Status enrollment berubah menjadi completed
        $this->assertEquals('completed', $this->enrollment->fresh()->status);

        // Dan sertifikat muncul di endpoint /api/v1/certificates
        $certResponse = $this->getJson('/api/v1/certificates');
        $certResponse->assertStatus(200)
                     ->assertJsonCount(1, 'data');
    }

    public function test_specialization_course_auto_issues_certificate_after_3_modules_and_essay(): void
    {
        $specLevel = CertificationLevel::create([
            'name'                   => 'Specialization Level',
            'code'                   => 'SPEC',
            'is_field_trip_required' => false,
            'order_index'            => 2,
            'is_active'              => true,
        ]);

        $specCourse = Course::create([
            'certification_level_id' => $specLevel->id,
            'title'                  => 'CBEc Specialization — Blue Carbon',
            'slug'                   => 'cbec-blue-carbon-test',
            'price_idr'              => 750000,
            'is_active'              => true,
            'order_index'            => 1,
        ]);

        $section = CourseSection::create([
            'course_id'   => $specCourse->id,
            'title'       => 'Program Spesialisasi — Blue Carbon',
            'order_index' => 1,
        ]);

        $mod1 = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'pdf_module',
            'title'        => 'Modul 1: Konsep Fundamental Karbon Biru',
            'order_index'  => 1,
        ]);

        $mod2 = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'pdf_module',
            'title'        => 'Modul 2: Metodologi MRV',
            'order_index'  => 2,
        ]);

        $mod3 = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'pdf_module',
            'title'        => 'Modul 3: Desain Proyek Restorasi',
            'order_index'  => 3,
        ]);

        $essay = CourseContent::create([
            'section_id'   => $section->id,
            'content_type' => 'essay_task',
            'title'        => 'Case-Study Essay Submission — Blue Carbon',
            'order_index'  => 4,
        ]);

        $specEnrollment = Enrollment::create([
            'user_id'              => $this->student->id,
            'course_id'            => $specCourse->id,
            'status'               => 'active',
            'payment_status'       => 'paid',
            'paid_at'              => now(),
            'attended_field_trip'  => false,
            'enrollment_type'      => 'self_paid',
        ]);

        // Complete module 1 and 2 only
        StudentSubmission::create([
            'user_id'    => $this->student->id,
            'content_id' => $mod1->id,
            'score'      => 100,
            'status'     => 'graded',
        ]);
        StudentSubmission::create([
            'user_id'    => $this->student->id,
            'content_id' => $mod2->id,
            'score'      => 100,
            'status'     => 'graded',
        ]);

        $certService = app(CertificateService::class);
        $eligibility1 = $certService->isEligibleForCertificate($specEnrollment);
        $this->assertFalse($eligibility1['eligible'], 'Belum eligible karena Modul 3 dan Essay belum selesai');

        // Complete module 3
        StudentSubmission::create([
            'user_id'    => $this->student->id,
            'content_id' => $mod3->id,
            'score'      => 100,
            'status'     => 'graded',
        ]);

        $eligibility2 = $certService->isEligibleForCertificate($specEnrollment);
        $this->assertFalse($eligibility2['eligible'], 'Belum eligible karena Essay belum diserahkan/dinilai');

        // Complete essay
        StudentSubmission::create([
            'user_id'    => $this->student->id,
            'content_id' => $essay->id,
            'score'      => 92,
            'status'     => 'graded',
        ]);

        $eligibility3 = $certService->isEligibleForCertificate($specEnrollment);
        $this->assertTrue($eligibility3['eligible'], 'Eligible setelah 3 modul dan essay bernilai lulus');

        // Trigger auto issue via contents endpoint
        Sanctum::actingAs($this->student);
        $res = $this->getJson("/api/v1/enrollments/{$specEnrollment->id}/contents");
        $res->assertStatus(200);

        $this->assertDatabaseHas('certificates', [
            'enrollment_id' => $specEnrollment->id,
            'user_id'       => $this->student->id,
        ]);

        $this->assertEquals('completed', $specEnrollment->fresh()->status);
    }

    public function test_oral_exam_submission_and_assessor_grading_flow(): void
    {
        $oralContent = CourseContent::create([
            'section_id'   => $this->course->sections->first()->id,
            'content_type' => 'oral_video_task',
            'title'        => 'Oral Video Examination',
            'max_score'    => 100,
            'order_index'  => 6,
        ]);

        // Student submits oral video link (Google Drive / YouTube)
        Sanctum::actingAs($this->student);
        $submitRes = $this->postJson('/api/v1/submissions', [
            'content_id'    => $oralContent->id,
            'enrollment_id' => $this->enrollment->id,
            'video_url'     => 'https://drive.google.com/file/d/1234567890/view',
            'essay_text'    => 'Catatan presentasi mengenai Blue Economy',
        ]);

        $submitRes->assertStatus(201);
        $submissionId = $submitRes->json('data.id');

        $this->assertDatabaseHas('student_submissions', [
            'id'        => $submissionId,
            'user_id'   => $this->student->id,
            'video_url' => 'https://drive.google.com/file/d/1234567890/view',
            'status'    => 'submitted',
            'score'     => null,
        ]);

        // Assessor grades the oral exam
        $assessor = User::create([
            'name'     => 'Assessor Maritim',
            'email'    => 'assessor@example.com',
            'password' => Hash::make('password'),
        ]);
        Role::firstOrCreate(['name' => 'assessor', 'guard_name' => 'web']);
        $assessor->assignRole('assessor');

        Sanctum::actingAs($assessor);
        $gradeRes = $this->patchJson("/api/v1/submissions/{$submissionId}/grade", [
            'score'             => 88,
            'assessor_feedback' => 'Artikulasi sangat baik dan penguasaan konsep komprehensif.',
        ]);

        $gradeRes->assertStatus(200);
        $this->assertDatabaseHas('student_submissions', [
            'id'                => $submissionId,
            'score'             => 88,
            'status'            => 'graded',
            'assessor_feedback' => 'Artikulasi sangat baik dan penguasaan konsep komprehensif.',
        ]);
    }
}
