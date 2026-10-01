<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    /** Student: List semua enrollment milik user sendiri */
    public function index(Request $request): JsonResponse
    {
        $enrollments = Enrollment::with(['course.certificationLevel', 'scholarshipApplication'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['data' => $enrollments]);
    }

    /** Student: Daftar ke kursus (Self-Paid) */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        if (Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $validated['course_id'])->exists()) {
            return response()->json(['message' => 'Kamu sudah terdaftar di kursus ini.'], 409);
        }

        $enrollment = Enrollment::create([
            'user_id'         => $request->user()->id,
            'course_id'       => $validated['course_id'],
            'enrollment_type' => 'self_paid',
            'status'          => 'payment_pending',
        ]);

        return response()->json([
            'message' => 'Pendaftaran berhasil. Lanjutkan ke pembayaran.',
            'data'    => $enrollment->load('course'),
        ], 201);
    }

    /** Student/Admin: Detail enrollment */
    public function show(int $id): JsonResponse
    {
        $enrollment = Enrollment::with([
            'user',
            'course.certificationLevel',
            'course.sections.contents',
            'scholarshipApplication.appeals',
            'certificate',
        ])->findOrFail($id);

        return response()->json(['data' => $enrollment]);
    }

    // ─── Admin Methods ────────────────────────────────────────────────────────

    /** Admin: List semua enrollment dengan filter & pagination */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Enrollment::with(['user', 'course.certificationLevel', 'scholarshipApplication'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        $perPage     = min((int) $request->get('per_page', 20), 100);
        $enrollments = $query->paginate($perPage);

        return response()->json(['data' => $enrollments]);
    }

    /** Admin: Manual enroll user ke kursus */
    public function adminStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id'         => 'required|exists:users,id',
            'course_id'       => 'required|exists:courses,id',
            'enrollment_type' => 'nullable|in:self_paid,scholarship_fully,scholarship_partial_a,scholarship_partial_b',
            'status'          => 'nullable|in:pending_review,payment_pending,active,completed,rejected',
        ]);

        if (Enrollment::where('user_id', $validated['user_id'])
            ->where('course_id', $validated['course_id'])->exists()) {
            return response()->json(['message' => 'User ini sudah terdaftar di kursus tersebut.'], 409);
        }

        $enrollment = Enrollment::create([
            'user_id'         => $validated['user_id'],
            'course_id'       => $validated['course_id'],
            'enrollment_type' => $validated['enrollment_type'] ?? 'self_paid',
            'status'          => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Enrollment manual berhasil dibuat.',
            'data'    => $enrollment->load(['user', 'course.certificationLevel']),
        ], 201);
    }

    /** Admin: Ubah status enrollment */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status'          => 'required|in:pending_review,payment_pending,active,completed,rejected',
            'enrollment_type' => 'nullable|in:self_paid,scholarship_fully,scholarship_partial_a,scholarship_partial_b',
        ]);

        $enrollment = Enrollment::findOrFail($id);
        $enrollment->update($validated);

        return response()->json([
            'message' => 'Status enrollment berhasil diperbarui.',
            'data'    => $enrollment->load(['user', 'course.certificationLevel']),
        ]);
    }

    /** Assessor/Admin: Toggle kehadiran Field Trip */
    public function toggleFieldTrip(Request $request, int $id): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($id);

        $enrollment->update([
            'attended_field_trip' => ! $enrollment->attended_field_trip,
        ]);

        $status = $enrollment->fresh()->attended_field_trip ? 'Hadir' : 'Tidak Hadir';

        return response()->json([
            'message'             => "Status Field Trip berhasil diubah menjadi: {$status}.",
            'attended_field_trip' => $enrollment->attended_field_trip,
        ]);
    }

    /** Student: Konfirmasi kehadiran Field Study (self-report) */
    public function studentConfirmFieldStudy(Request $request, int $id): JsonResponse
    {
        $enrollment = Enrollment::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'attending' => 'required|boolean', // true = hadir, false = tidak hadir
        ]);

        // Hanya boleh set ke true jika admin belum mengkonfirmasi
        // Student tidak bisa membatalkan konfirmasi admin
        if (! $enrollment->attended_field_trip) {
            $enrollment->update([
                'attended_field_trip' => $validated['attending'],
            ]);
        }

        return response()->json([
            'message'             => $validated['attending']
                ? 'Kehadiran Field Study berhasil dicatat. Menunggu konfirmasi admin.'
                : 'Kamu memilih untuk tidak mengikuti Field Study.',
            'attended_field_trip' => $enrollment->fresh()->attended_field_trip,
        ]);
    }

    /** Admin: Hapus enrollment */
    public function destroy(int $id): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($id);
        $enrollment->delete();

        return response()->json(['message' => 'Enrollment berhasil dihapus.']);
    }
}
