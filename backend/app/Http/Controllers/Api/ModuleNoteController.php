<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModuleNote;
use App\Models\CourseContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleNoteController extends Controller
{
    /**
     * GET /module-notes?content_id={id}
     * Ambil catatan milik user yang sedang login untuk satu konten modul.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['content_id' => 'required|integer|exists:course_contents,id']);

        $notes = ModuleNote::where('user_id', $request->user()->id)
            ->where('course_content_id', $request->content_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $notes]);
    }

    /**
     * POST /module-notes
     * Simpan catatan baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content_id'    => 'required|integer|exists:course_contents,id',
            'note_text'     => 'nullable|string|max:5000',
            'selected_text' => 'nullable|string|max:2000',
        ]);

        if (empty($validated['note_text']) && empty($validated['selected_text'])) {
            return response()->json(['message' => 'Catatan tidak boleh kosong.'], 422);
        }

        $note = ModuleNote::create([
            'user_id'           => $request->user()->id,
            'course_content_id' => $validated['content_id'],
            'note_text'         => $validated['note_text'] ?? null,
            'selected_text'     => $validated['selected_text'] ?? null,
        ]);

        return response()->json(['data' => $note], 201);
    }

    /**
     * DELETE /module-notes/{id}
     * Hapus catatan milik user.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $note = ModuleNote::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $note->delete();

        return response()->json(['message' => 'Catatan berhasil dihapus.']);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    /**
     * GET /admin/module-notes
     * Daftar semua catatan dari semua user (untuk admin).
     * Filter opsional: ?content_id=&user_id=&search=
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = ModuleNote::with([
            'user:id,name,email',
            'courseContent:id,title,content_type,section_id',
            'courseContent.section:id,title,course_id',
            'courseContent.section.course:id,title',
        ])
        ->orderByDesc('created_at');

        if ($request->filled('content_id')) {
            $query->where('course_content_id', $request->content_id);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('note_text', 'like', "%{$search}%")
                  ->orWhere('selected_text', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $paginated = $query->paginate($request->integer('per_page', 20));

        return response()->json($paginated);
    }
}
