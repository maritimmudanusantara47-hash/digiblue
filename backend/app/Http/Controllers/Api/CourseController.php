<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /** Public: List katalog kursus aktif */
    public function index(Request $request): JsonResponse
    {
        $query = Course::with('certificationLevel')
            ->withCount('sections')
            ->where('is_active', true)
            ->orderBy('order_index');

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', $searchTerm)
                  ->orWhere('description', 'like', $searchTerm);
            });
        }

        if ($request->filled('level')) {
            $levels = explode(',', $request->level);
            if (in_array('INT_CERT', $levels)) {
                $levels = array_unique(array_merge($levels, ['FND', 'SPEC', 'INT_CERT']));
            }
            $query->whereHas('certificationLevel', fn($q) => $q->whereIn('code', $levels));
        }

        $courses = $query->get();

        return response()->json(['data' => $courses]);
    }

    /** Public: Detail kursus & silabus */
    public function show(string $slug): JsonResponse
    {
        $course = Course::with(['certificationLevel', 'sections.contents'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        // Keamanan guest access: Sembunyikan URL/path file internal serta isi modul di katalog publik
        $course->sections->each(function ($section) {
            $section->contents->makeHidden(['file_path', 'attachments', 'embed_url', 'content_body', 'instruction_text']);
        });

        return response()->json(['data' => $course]);
    }
}
