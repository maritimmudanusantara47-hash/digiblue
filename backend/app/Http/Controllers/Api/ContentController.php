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
        $enrollment = Enrollment::with([
            'course.sections.contents.quizQuestions.options',
        ])->where('user_id', $request->user()->id)
          ->findOrFail($enrollmentId);

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

        return response()->json([
            'data' => [
                'enrollment' => $enrollment->only(['id', 'status', 'attended_field_trip', 'enrollment_type']),
                'course'     => [
                    'id'    => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'slug'  => $enrollment->course->slug,
                ],
                'sections'   => $sections,
            ],
        ]);
    }
}
