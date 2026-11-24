<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        // Filter untuk dropdown checkout siswa: hanya batch yang pendaftarannya masih buka atau belajarnya belum berakhir
        if ($request->boolean('open_only')) {
            $today = now()->toDateString();
            $query->where(function ($q) use ($today) {
                $q->whereNull('registration_end_date')->orWhere('registration_end_date', '>=', $today);
            })->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            });
        }

        if ($request->has('limit')) {
            $limit = max(1, (int) $request->query('limit'));
            $query->limit($limit);
        }

        $batches = $query->get();

        return response()->json(['data' => $batches]);
    }

    /**
     * Dapatkan template jadwal batch sejenis berdasarkan nama atau kode batch.
     * Digunakan untuk fitur Smart Auto-Fill & Pengecekan Inkonsistensi Jadwal.
     */
    public function template(Request $request): JsonResponse
    {
        $name = trim((string) $request->query('batch_name', ''));
        $code = trim((string) $request->query('batch_code', ''));
        $excludeId = $request->query('exclude_id');

        if ($name === '' && $code === '') {
            return response()->json(['data' => null]);
        }

        $query = CourseBatch::with('course:id,title');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $terms = array_values(array_unique(array_filter([
            mb_strtolower($name),
            mb_strtolower($code),
        ])));

        $query->where(function ($q) use ($terms) {
            foreach ($terms as $term) {
                $q->orWhereRaw('LOWER(batch_name) = ?', [$term])
                  ->orWhereRaw('LOWER(batch_code) = ?', [$term]);
            }
        });

        // Utamakan batch yang memiliki jadwal tanggal lengkap dan ID terbaru
        $batch = $query->orderByRaw('CASE WHEN start_date IS NOT NULL THEN 0 ELSE 1 END')
            ->orderByDesc('id')
            ->first();

        return response()->json([
            'data' => $batch,
        ]);
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
            'in_class_learning_date'  => 'nullable|date',
            'exam_mcq_date'           => 'nullable|date',
            'exam_essay_start_date'   => 'nullable|date',
            'exam_essay_end_date'     => 'nullable|date|after_or_equal:exam_essay_start_date',
            'exam_presentation_date'  => 'nullable|date',
            'field_trip_date'         => 'nullable|date',
            'certificate_issue_date'  => 'nullable|date',
            'is_active'               => 'boolean',
        ], [
            'registration_end_date.after_or_equal' => 'Tanggal selesai registrasi harus sama atau setelah tanggal mulai registrasi.',
            'end_date.after_or_equal'              => 'Tanggal selesai belajar harus sama atau setelah tanggal mulai belajar.',
            'exam_essay_end_date.after_or_equal'   => 'Tenggat submit essay harus sama atau setelah tanggal mulai submit essay.',
        ]);

        $batch = CourseBatch::create($validated);

        return response()->json([
            'message' => 'Batch angkatan baru berhasil dibuat.',
            'data'    => $batch->load('course:id,title'),
        ], 201);
    }

    /**
     * Buat batch angkatan baru secara massal (bulk) untuk banyak kursus sekaligus.
     * Mendukung target_scope:
     * - 'all_specialization': seluruh kursus dengan sertifikasi SPEC aktif (12 tracks)
     * - 'all_courses': seluruh kursus aktif
     * - 'custom': array course_ids tertentu
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_scope'            => 'required|string|in:all_specialization,all_courses,custom',
            'course_ids'              => 'required_if:target_scope,custom|array',
            'course_ids.*'            => 'integer|exists:courses,id',
            'batch_name'              => 'required|string|max:100',
            'batch_code'              => 'nullable|string|max:50',
            'registration_start_date' => 'nullable|date',
            'registration_end_date'   => 'nullable|date|after_or_equal:registration_start_date',
            'start_date'              => 'nullable|date',
            'end_date'                => 'nullable|date|after_or_equal:start_date',
            'in_class_learning_date'  => 'nullable|date',
            'exam_mcq_date'           => 'nullable|date',
            'exam_essay_start_date'   => 'nullable|date',
            'exam_essay_end_date'     => 'nullable|date|after_or_equal:exam_essay_start_date',
            'exam_presentation_date'  => 'nullable|date',
            'field_trip_date'         => 'nullable|date',
            'certificate_issue_date'  => 'nullable|date',
            'is_active'               => 'boolean',
        ], [
            'target_scope.required'                => 'Target cakupan kursus wajib dipilih.',
            'target_scope.in'                      => 'Pilihan target cakupan kursus tidak valid.',
            'course_ids.required_if'               => 'Daftar kursus wajib dipilih jika memilih custom.',
            'registration_end_date.after_or_equal' => 'Tanggal selesai registrasi harus sama atau setelah tanggal mulai registrasi.',
            'end_date.after_or_equal'              => 'Tanggal selesai belajar harus sama atau setelah tanggal mulai belajar.',
            'exam_essay_end_date.after_or_equal'   => 'Tenggat submit essay harus sama atau setelah tanggal mulai submit essay.',
        ]);

        $scope = $validated['target_scope'];
        $courseIds = collect();

        if ($scope === 'all_specialization') {
            $courseIds = Course::whereHas('certificationLevel', fn($q) => $q->where('code', 'SPEC'))
                ->where('is_active', true)
                ->orderBy('order_index')
                ->pluck('id');
        } elseif ($scope === 'all_courses') {
            $courseIds = Course::where('is_active', true)
                ->orderBy('order_index')
                ->pluck('id');
        } elseif ($scope === 'custom') {
            $courseIds = collect($validated['course_ids'] ?? [])->unique()->values();
        }

        if ($courseIds->isEmpty()) {
            return response()->json([
                'message' => 'Tidak ada kursus aktif yang ditemukan untuk target ini.',
            ], 422);
        }

        $batchData = [
            'batch_name'              => $validated['batch_name'],
            'batch_code'              => $validated['batch_code'] ?? null,
            'registration_start_date' => $validated['registration_start_date'] ?? null,
            'registration_end_date'   => $validated['registration_end_date'] ?? null,
            'start_date'              => $validated['start_date'] ?? null,
            'end_date'                => $validated['end_date'] ?? null,
            'in_class_learning_date'  => $validated['in_class_learning_date'] ?? null,
            'exam_mcq_date'           => $validated['exam_mcq_date'] ?? null,
            'exam_essay_start_date'   => $validated['exam_essay_start_date'] ?? null,
            'exam_essay_end_date'     => $validated['exam_essay_end_date'] ?? null,
            'exam_presentation_date'  => $validated['exam_presentation_date'] ?? null,
            'field_trip_date'         => $validated['field_trip_date'] ?? null,
            'certificate_issue_date'  => $validated['certificate_issue_date'] ?? null,
            'is_active'               => $validated['is_active'] ?? true,
        ];

        $createdBatches = DB::transaction(function () use ($courseIds, $batchData) {
            $batches = [];
            foreach ($courseIds as $cid) {
                $batches[] = CourseBatch::updateOrCreate(
                    [
                        'course_id'  => $cid,
                        'batch_name' => $batchData['batch_name'],
                    ],
                    $batchData
                );
            }
            return $batches;
        });

        $count = count($createdBatches);
        $scopeLabel = match ($scope) {
            'all_specialization' => 'semua kursus spesialisasi',
            'all_courses'        => 'semua kursus',
            default              => "{$count} kursus terpilih",
        };

        return response()->json([
            'message'       => "Berhasil membuat {$validated['batch_name']} untuk {$scopeLabel} ({$count} kursus).",
            'created_count' => $count,
            'data'          => $createdBatches,
        ], 201);
    }

    /** Update batch */
    public function update(Request $request, int $id): JsonResponse
    {
        $batch = CourseBatch::findOrFail($id);

        $regStart = $request->input('registration_start_date', $batch->registration_start_date ? $batch->registration_start_date->format('Y-m-d') : null);
        $learnStart = $request->input('start_date', $batch->start_date ? $batch->start_date->format('Y-m-d') : null);
        $essayStart = $request->input('exam_essay_start_date', $batch->exam_essay_start_date ? $batch->exam_essay_start_date->format('Y-m-d') : null);

        $validated = $request->validate([
            'course_id'               => 'sometimes|required|exists:courses,id',
            'batch_name'              => 'sometimes|required|string|max:100',
            'batch_code'              => 'nullable|string|max:50',
            'registration_start_date' => 'nullable|date',
            'registration_end_date'   => 'nullable|date' . ($regStart ? '|after_or_equal:' . $regStart : ''),
            'start_date'              => 'nullable|date',
            'end_date'                => 'nullable|date' . ($learnStart ? '|after_or_equal:' . $learnStart : ''),
            'in_class_learning_date'  => 'nullable|date',
            'exam_mcq_date'           => 'nullable|date',
            'exam_essay_start_date'   => 'nullable|date',
            'exam_essay_end_date'     => 'nullable|date' . ($essayStart ? '|after_or_equal:' . $essayStart : ''),
            'exam_presentation_date'  => 'nullable|date',
            'field_trip_date'         => 'nullable|date',
            'certificate_issue_date'  => 'nullable|date',
            'is_active'               => 'boolean',
        ], [
            'registration_end_date.after_or_equal' => 'Tanggal selesai registrasi harus sama atau setelah tanggal mulai registrasi.',
            'end_date.after_or_equal'              => 'Tanggal selesai belajar harus sama atau setelah tanggal mulai belajar.',
            'exam_essay_end_date.after_or_equal'   => 'Tenggat submit essay harus sama atau setelah tanggal mulai submit essay.',
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
