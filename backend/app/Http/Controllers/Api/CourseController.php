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
        $courses = Course::with('certificationLevel')
            ->withCount('sections')
            ->where('is_active', true)
            ->when($request->level, fn($q) => $q->whereHas('certificationLevel',
                fn($l) => $l->where('code', $request->level)))
            ->orderBy('order_index')
            ->get();

        return response()->json(['data' => $courses]);
    }

    /** Public: Detail kursus & silabus */
    public function show(string $slug): JsonResponse
    {
        $course = Course::with(['certificationLevel', 'sections.contents'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        // Keamanan guest access: Sembunyikan URL/path file internal di katalog publik
        $course->sections->each(function ($section) {
            $section->contents->makeHidden(['file_path', 'embed_url']);
        });

        return response()->json(['data' => $course]);
    }
}
