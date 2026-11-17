<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBatchController extends Controller
{
    /** List semua batch (bisa difilter per course_id atau route param courseId) */
    public function index(Request $request, ?int $courseId = null): JsonResponse
    {
        $query = CourseBatch::with('course:id,title')
            ->withCount('enrollments')
            ->orderByDesc('id');

        $filterCourseId = $courseId
            ?? $request->route('courseId')
            ?? $request->route('course_id')
            ?? $request->query('course_id');

        if ($filterCourseId) {
            $query->where('course_id', $filterCourseId);
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $batches = $query->get();

        return response()->json(['data' => $batches]);
    }

    /** Buat batch baru */
    public function store(Request $request, ?int $courseId = null): JsonResponse
    {
        if ($courseId && !$request->has('course_id')) {
            $request->merge(['course_id' => $courseId]);
        }
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
        ], [
            'registration_end_date.after_or_equal' => 'Tanggal selesai registrasi harus sama atau setelah tanggal mulai registrasi.',
            'end_date.after_or_equal'              => 'Tanggal selesai belajar harus sama atau setelah tanggal mulai belajar.',
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

        $regStart = $request->input('registration_start_date', $batch->registration_start_date ? $batch->registration_start_date->format('Y-m-d') : null);
        $learnStart = $request->input('start_date', $batch->start_date ? $batch->start_date->format('Y-m-d') : null);

        $validated = $request->validate([
            'course_id'               => 'sometimes|required|exists:courses,id',
            'batch_name'              => 'sometimes|required|string|max:100',
            'batch_code'              => 'nullable|string|max:50',
            'registration_start_date' => 'nullable|date',
            'registration_end_date'   => 'nullable|date' . ($regStart ? '|after_or_equal:' . $regStart : ''),
            'start_date'              => 'nullable|date',
            'end_date'                => 'nullable|date' . ($learnStart ? '|after_or_equal:' . $learnStart : ''),
            'field_trip_date'         => 'nullable|date',
            'is_active'               => 'boolean',
        ], [
            'registration_end_date.after_or_equal' => 'Tanggal selesai registrasi harus sama atau setelah tanggal mulai registrasi.',
            'end_date.after_or_equal'              => 'Tanggal selesai belajar harus sama atau setelah tanggal mulai belajar.',
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
