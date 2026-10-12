<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBatchController extends Controller
{
    /** List semua batch (bisa difilter per course_id) */
    public function index(Request $request): JsonResponse
    {
        $query = CourseBatch::with('course:id,title')
            ->withCount('enrollments')
            ->orderByDesc('id');

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $batches = $query->get();

        return response()->json(['data' => $batches]);
    }

    /** Buat batch baru */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id'               => 'required|exists:courses,id',
            'batch_name'              => 'required|string|max:100',
            'batch_code'              => 'nullable|string|max:50',
            'registration_start_date' => 'nullable|date',
            'registration_end_date'   => 'nullable|date|after_or_equal:registration_start_date',
            'start_date'              => 'nullable|date',
            'end_date'                => 'nullable|date|after_or_equal:start_date',
            'field_trip_date'         => 'nullable|date',
            'is_active'               => 'boolean',
        ]);

        $batch = CourseBatch::create($validated);

        return response()->json([
            'message' => 'Batch angkatan baru berhasil dibuat.',
            'data'    => $batch->load('course:id,title'),
        ], 201);
    }

    /** Update batch */
    public function update(Request $request, int $id): JsonResponse
    {
        $batch = CourseBatch::findOrFail($id);

        $validated = $request->validate([
            'batch_name'              => 'sometimes|required|string|max:100',
            'batch_code'              => 'nullable|string|max:50',
            'registration_start_date' => 'nullable|date',
            'registration_end_date'   => 'nullable|date',
            'start_date'              => 'nullable|date',
            'end_date'                => 'nullable|date',
            'field_trip_date'         => 'nullable|date',
            'is_active'               => 'boolean',
        ]);

        $batch->update($validated);

        return response()->json([
            'message' => 'Batch angkatan berhasil diperbarui.',
            'data'    => $batch->load('course:id,title'),
        ]);
    }

    /** Hapus batch */
    public function destroy(int $id): JsonResponse
    {
        $batch = CourseBatch::findOrFail($id);
        $batch->delete();

        return response()->json([
            'message' => 'Batch angkatan berhasil dihapus. Peserta di batch ini otomatis beralih ke jalur mandiri.',
        ]);
    }
}
