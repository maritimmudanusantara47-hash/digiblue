<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\CourseContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    /**
     * List konten kursus yang dapat diakses oleh student yang terdaftar.
     * Route: GET /enrollments/{id}/contents
     */
    public function index(Request $request, int $enrollmentId): JsonResponse
    {
        $user = $request->user();
        $query = Enrollment::with([
            'course.certificationLevel',
            'course.sections.contents.quizQuestions.options',
        ]);

        if (!method_exists($user, 'hasRole') || !$user->hasRole('admin')) {
            if (!$user->hasVerifiedEmail()) {
                return response()->json([
                    'message'          => 'Email Anda belum diverifikasi. Silakan lakukan verifikasi email Anda untuk mengakses modul & materi pembelajaran.',
                    'email_unverified' => true,
                ], 403);
            }
            $query->where('user_id', $user->id)
                  ->whereIn('status', ['active', 'completed']);
        }

        $enrollment = $query->findOrFail($enrollmentId);

        // Security check: Jika kursus bertipe Specialization, pastikan student sudah menyelesaikan Foundation
        if ((!method_exists($user, 'hasRole') || !$user->hasRole('admin')) && $enrollment->course->certificationLevel?->code === 'SPEC') {
            $hasCompletedFoundation = Enrollment::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereHas('course.certificationLevel', function ($q) {
                    $q->where('code', 'FND');
                })
                ->exists();

            if (!$hasCompletedFoundation) {
                return response()->json([
                    'message'             => 'Anda harus menyelesaikan kursus Foundation Level terlebih dahulu sebelum dapat mengakses materi kursus Spesialisasi.',
                    'foundation_required' => true,
                ], 403);
            }
        }

        // Untuk MCQ, sembunyikan is_correct dari student
        $sections = $enrollment->course->sections->map(function ($section) {
            $section->contents = $section->contents->map(function ($content) {
                if ($content->content_type === 'mcq_quiz') {
                    $content->quizQuestions = $content->quizQuestions->map(function ($q) {
                        $q->options = $q->options->map(fn($o) => $o->makeHidden('is_correct'));
                        return $q;
                    });
                }
                return $content;
            });
            return $section;
        });

        // Cek kelayakan dan auto-issue sertifikat jika semua materi telah tuntas 100%
        $certService = app(\App\Services\CertificateService::class);
        $certificate = $certService->autoIssueCertificateIfEligible($enrollment);
        if (!$certificate) {
            $certificate = $enrollment->certificate()->first();
        }

        return response()->json([
            'data' => [
                'enrollment'  => $enrollment->only(['id', 'status', 'attended_field_trip', 'enrollment_type']),
                'certificate' => $certificate,
                'course'      => [
                    'id'    => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'slug'  => $enrollment->course->slug,
                ],
                'sections'    => $sections,
            ],
        ]);
    }
}
