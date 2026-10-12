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
            $levels = explode(',', $request->level);
            if (in_array('INT_CERT', $levels)) {
                $levels = array_unique(array_merge($levels, ['FND', 'SPEC', 'INT_CERT']));
            }
            $query->whereHas('certificationLevel', fn($q) => $q->whereIn('code', $levels));
        }

        $courses = $request->boolean('paginate', false)
            ? $query->paginate((int) $request->input('per_page', 20))
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
            'message' => __('api.kursus_berhasil_dibuat'),
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
            'message' => __('api.kursus_berhasil_diperbarui'),
            'data'    => $course->load('certificationLevel'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => __('api.kursus_berhasil_dihapus')]);
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
            'message' => __('api.seksi_berhasil_ditambahkan'),
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

        return response()->json(['message' => __('api.seksi_berhasil_diperbarui'), 'data' => $section]);
    }

    public function destroySection(int $courseId, int $sectionId): JsonResponse
    {
        $section = CourseSection::where('course_id', $courseId)->findOrFail($sectionId);
        $section->delete();

        return response()->json(['message' => __('api.seksi_berhasil_dihapus')]);
    }

    // ─── Contents ─────────────────────────────────────────────────────────────

    public function storeContent(Request $request, int $sectionId): JsonResponse
    {
        $section = CourseSection::findOrFail($sectionId);

        $validated = $request->validate([
            'content_type'     => 'required|in:pdf_module,video_embed,mcq_quiz,essay_task,oral_video_task,critical_thinking,field_study',
            'title'            => 'required|string|max:255',
            'embed_url'        => 'nullable|url',
            'instruction_text' => 'nullable|string',
            'content_body'     => 'nullable|string',
            'max_score'        => 'nullable|integer|min:0',
            'is_prerequisite'  => 'nullable|boolean',
            'order_index'      => 'nullable|integer',
        ]);

        $content = $section->contents()->create($validated);

        return response()->json(['message' => __('api.konten_berhasil_ditambahkan'), 'data' => $content], 201);
    }

    public function uploadFile(Request $request, int $contentId): JsonResponse
    {
        $content = CourseContent::findOrFail($contentId);

        $request->validate(['file' => 'required|file|mimes:pdf,doc,docx|max:51200']); // max 50MB

        $path = $request->file('file')->store("course-contents/{$contentId}", 'public');

        $content->update(['file_path' => $path]);

        return response()->json([
            'message'   => __('api.file_berhasil_diupload'),
            'file_path' => $path,
            'url'       => url("storage/{$path}"),
        ]);
    }

    public function uploadAttachment(Request $request, int $contentId): JsonResponse
    {
        $content = CourseContent::findOrFail($contentId);

        $request->validate([
            'file'     => 'required|file|mimes:pdf,doc,docx,xls,xlsx,csv,zip|max:51200', // max 50MB
            'category' => 'required|in:case_study_brief,template,example_guide,additional',
            'title'    => 'nullable|string|max:255',
        ]);

        $file         = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension    = strtolower($file->getClientOriginalExtension());
        $sizeBytes    = $file->getSize();

        $path = $file->store("course-contents/{$contentId}/attachments", 'public');

        $defaultTitles = [
            'case_study_brief' => 'Naskah Soal Studi Kasus',
            'template'         => 'Template Lembar Jawaban',
            'example_guide'    => 'Contoh Pengisian / Panduan',
            'additional'       => pathinfo($originalName, PATHINFO_FILENAME),
        ];

        $title = $request->input('title') ?: ($defaultTitles[$request->category] ?? pathinfo($originalName, PATHINFO_FILENAME));

        $newAttachment = [
            'id'                  => (string) Str::uuid(),
            'category'            => $request->category,
            'title'               => $title,
            'file_name'           => $originalName,
            'file_path'           => $path,
            'url'                 => url("storage/{$path}"),
            'file_size'           => $sizeBytes,
            'file_size_formatted' => $this->formatBytes($sizeBytes),
            'extension'           => $extension,
            'created_at'          => now()->toISOString(),
        ];

        $current = $content->attachments ?? [];
        $updated = [];

        foreach ($current as $item) {
            // For standard single-slot categories, replace the previous attachment
            if (in_array($request->category, ['case_study_brief', 'template', 'example_guide']) && ($item['category'] ?? '') === $request->category) {
                if (!empty($item['file_path'])) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($item['file_path']);
                }
                continue;
            }
            $updated[] = $item;
        }

        $updated[] = $newAttachment;
        $content->update(['attachments' => $updated]);

        return response()->json([
            'message'    => 'Berkas lampiran berhasil diunggah.',
            'attachment' => $newAttachment,
            'data'       => $content->fresh(),
        ]);
    }

    public function deleteAttachment(int $contentId, string $attachmentId): JsonResponse
    {
        $content = CourseContent::findOrFail($contentId);
        $current = $content->attachments ?? [];
        $updated = [];
        $found   = false;

        foreach ($current as $item) {
            if (($item['id'] ?? '') === $attachmentId) {
                $found = true;
                if (!empty($item['file_path'])) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($item['file_path']);
                }
                continue;
            }
            $updated[] = $item;
        }

        if (!$found) {
            return response()->json(['message' => 'Berkas tidak ditemukan.'], 404);
        }

        $content->update(['attachments' => array_values($updated)]);

        return response()->json([
            'message' => 'Berkas lampiran berhasil dihapus.',
            'data'    => $content->fresh(),
        ]);
    }

    private function formatBytes(int $bytes, int $precision = 1): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow   = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow   = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp,svg|max:10240', // max 10MB
        ]);

        $path = $request->file('image')->store('course-images', 'public');

        return response()->json([
            'message'   => 'Gambar berhasil diupload.',
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
            'content_body'     => 'nullable|string',
            'max_score'        => 'nullable|integer|min:0',
            'is_prerequisite'  => 'nullable|boolean',
            'order_index'      => 'nullable|integer',
        ]);

        $content->update($validated);

        return response()->json(['message' => __('api.konten_berhasil_diperbarui'), 'data' => $content->fresh()]);
    }

    public function destroyContent(int $id): JsonResponse
    {
        $content = CourseContent::findOrFail($id);
        $content->delete();

        return response()->json(['message' => __('api.konten_berhasil_dihapus')]);
    }
}
