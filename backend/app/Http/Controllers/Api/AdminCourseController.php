<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CourseContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCourseController extends Controller
{
    // ─── Courses ──────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Course::with(['certificationLevel', 'sections.contents'])
            ->withCount('enrollments')
            ->orderBy('order_index');

        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }
        if ($request->filled('level')) {
            $query->whereHas('certificationLevel', fn($q) => $q->where('code', $request->level));
        }

        $courses = $request->boolean('paginate', false)
            ? $query->paginate((int) $request->get('per_page', 20))
            : $query->get();

        return response()->json(['data' => $courses]);
    }

    public function show(int $id): JsonResponse
    {
        $course = Course::with(['certificationLevel', 'sections.contents.quizQuestions.options'])
            ->withCount('enrollments')
            ->findOrFail($id);

        return response()->json(['data' => $course]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'certification_level_id' => 'required|exists:certification_levels,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'nullable|numeric|min:0',
            'is_active'   => 'nullable|boolean',
            'order_index' => 'nullable|integer',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);

        $course = Course::create($validated);

        return response()->json([
            'message' => 'Kursus berhasil dibuat.',
            'data'    => $course->load('certificationLevel'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'nullable|numeric|min:0',
            'is_active'   => 'nullable|boolean',
            'order_index' => 'nullable|integer',
        ]);

        if (isset($validated['title'])) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . $course->id;
        }

        $course->update($validated);

        return response()->json([
            'message' => 'Kursus berhasil diperbarui.',
            'data'    => $course->load('certificationLevel'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Kursus berhasil dihapus.']);
    }

    // ─── Sections ─────────────────────────────────────────────────────────────

    public function storeSection(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'order_index' => 'nullable|integer',
        ]);

        $section = $course->sections()->create($validated);

        return response()->json([
            'message' => 'Seksi berhasil ditambahkan.',
            'data'    => $section,
        ], 201);
    }

    public function updateSection(Request $request, int $courseId, int $sectionId): JsonResponse
    {
        $section = CourseSection::where('course_id', $courseId)->findOrFail($sectionId);

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'order_index' => 'nullable|integer',
        ]);

        $section->update($validated);

        return response()->json(['message' => 'Seksi berhasil diperbarui.', 'data' => $section]);
    }

    public function destroySection(int $courseId, int $sectionId): JsonResponse
    {
        $section = CourseSection::where('course_id', $courseId)->findOrFail($sectionId);
        $section->delete();

        return response()->json(['message' => 'Seksi berhasil dihapus.']);
    }

    // ─── Contents ─────────────────────────────────────────────────────────────

    public function storeContent(Request $request, int $sectionId): JsonResponse
    {
        $section = CourseSection::findOrFail($sectionId);

        $validated = $request->validate([
            'content_type'     => 'required|in:pdf_module,video_embed,mcq_quiz,essay_task,oral_video_task,critical_thinking',
            'title'            => 'required|string|max:255',
            'embed_url'        => 'nullable|url',
            'instruction_text' => 'nullable|string',
            'max_score'        => 'nullable|integer|min:0',
            'is_prerequisite'  => 'nullable|boolean',
            'order_index'      => 'nullable|integer',
        ]);

        $content = $section->contents()->create($validated);

        return response()->json(['message' => 'Konten berhasil ditambahkan.', 'data' => $content], 201);
    }

    public function uploadFile(Request $request, int $contentId): JsonResponse
    {
        $content = CourseContent::findOrFail($contentId);

        $request->validate(['file' => 'required|file|mimes:pdf|max:20480']); // max 20MB

        $path = $request->file('file')->store("course-contents/{$contentId}", 'public');

        $content->update(['file_path' => $path]);

        return response()->json([
            'message'   => 'File berhasil diupload.',
            'file_path' => $path,
            'url'       => url("storage/{$path}"),
        ]);
    }

    public function updateContent(Request $request, int $id): JsonResponse
    {
        $content = CourseContent::findOrFail($id);

        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'embed_url'        => 'nullable|url',
            'instruction_text' => 'nullable|string',
            'max_score'        => 'nullable|integer|min:0',
            'is_prerequisite'  => 'nullable|boolean',
            'order_index'      => 'nullable|integer',
        ]);

        $content->update($validated);

        return response()->json(['message' => 'Konten berhasil diperbarui.', 'data' => $content->fresh()]);
    }

    public function destroyContent(int $id): JsonResponse
    {
        $content = CourseContent::findOrFail($id);
        $content->delete();

        return response()->json(['message' => 'Konten berhasil dihapus.']);
    }
}
