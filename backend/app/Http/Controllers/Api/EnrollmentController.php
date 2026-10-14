<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    /** Student: List semua enrollment milik user sendiri */
    public function index(Request $request): JsonResponse
    {
        $enrollments = Enrollment::with(['course.certificationLevel', 'batch'])
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
            'batch_id'  => 'nullable|exists:course_batches,id',
        ]);

        $user = $request->user();

        if (!$user->hasRole('admin') && !$user->hasVerifiedEmail()) {
            return response()->json([
                'message'          => 'Silakan verifikasi email Anda terlebih dahulu untuk mendaftar atau mengakses kursus.',
                'email_unverified' => true,
            ], 403);
        }

        // ── Cek apakah user sudah punya enrollment di kursus ini ──────────────
        $existing = Enrollment::where('user_id', $user->id)
            ->where('course_id', $validated['course_id'])
            ->first();

        if ($existing) {
            // Update batch jika dipilih saat re-checkout
            if (!empty($validated['batch_id'])) {
                $existing->update(['batch_id' => $validated['batch_id']]);
            }
            // Jika sebelumnya aktif tanpa paid_at (auto-activated 0 price) dan user mau checkout:
            if ($existing->status === 'active' && !$existing->paid_at) {
                $existing->update(['status' => 'payment_pending']);
            } elseif ($existing->status === 'active' && $existing->paid_at) {
                return response()->json([
                    'message' => 'Kamu sudah terdaftar dan kursus ini sudah aktif di akun kamu.',
                    'data'    => $existing->load(['course', 'batch']),
                ], 200);
            }
            return response()->json([
                'message' => 'Melanjutkan proses pembayaran kursus kamu.',
                'data'    => $existing->load(['course', 'batch']),
            ], 200);
        }

        $targetCourse = Course::findOrFail($validated['course_id']);

        $enrollment = Enrollment::create([
            'user_id'         => $user->id,
            'course_id'       => $validated['course_id'],
            'batch_id'        => $validated['batch_id'] ?? null,
            'enrollment_type' => 'self_paid',
            'status'          => 'payment_pending',
            'paid_at'         => null,
        ]);

        return response()->json([
            'message' => 'Pendaftaran berhasil. Silakan selesaikan pembayaran.',
            'data'    => $enrollment->load(['course', 'batch']),
        ], 201);
    }

    /** Student/Admin: Detail enrollment (dengan proteksi otorisasi kepemilikan) */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $query = Enrollment::with([
            'user',
            'course.certificationLevel',
            'course.sections.contents',
            'certificate',
            'batch',
        ]);

        if (!$user->hasRole('admin')) {
            $query->where('user_id', $user->id);
        }

        $enrollment = $query->findOrFail($id);

        return response()->json(['data' => $enrollment]);
    }

    // ─── Admin Methods ────────────────────────────────────────────────────────

    /** Admin: List semua enrollment dengan filter & pagination */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Enrollment::with(['user', 'course.certificationLevel', 'batch'])
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

        if ($request->filled('batch_id')) {
            if ($request->batch_id === 'none') {
                $query->whereNull('batch_id');
            } else {
                $query->where('batch_id', $request->batch_id);
            }
        }

        $perPage     = min((int) $request->input('per_page', 20), 100);
        $enrollments = $query->paginate($perPage);

        return response()->json(['data' => $enrollments]);
    }

    /** Admin: Manual enroll user ke kursus */
    public function adminStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id'         => 'required|exists:users,id',
            'course_id'       => 'required|exists:courses,id',
            'batch_id'        => 'nullable|exists:course_batches,id',
            'enrollment_type' => 'nullable|in:self_paid',
            'status'          => 'nullable|in:payment_pending,active,completed,rejected',
        ]);

        if (Enrollment::where('user_id', $validated['user_id'])
            ->where('course_id', $validated['course_id'])->exists()) {
            return response()->json(['message' => 'User ini sudah terdaftar di kursus tersebut.'], 409);
        }

        $enrollment = Enrollment::create([
            'user_id'         => $validated['user_id'],
            'course_id'       => $validated['course_id'],
            'batch_id'        => $validated['batch_id'] ?? null,
            'enrollment_type' => $validated['enrollment_type'] ?? 'self_paid',
            'status'          => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Enrollment manual berhasil dibuat.',
            'data'    => $enrollment->load(['user', 'course.certificationLevel', 'batch']),
        ], 201);
    }

    /** Admin: Ubah status enrollment */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status'          => 'required|in:payment_pending,active,completed,rejected',
            'enrollment_type' => 'nullable|in:self_paid',
            'batch_id'        => 'nullable',
        ]);

        $enrollment = Enrollment::findOrFail($id);

        $payload = [
            'status' => $validated['status'],
        ];

        if (isset($validated['enrollment_type'])) {
            $payload['enrollment_type'] = $validated['enrollment_type'];
        }

        if ($request->has('batch_id')) {
            $payload['batch_id'] = $request->batch_id ?: null;
        }

        $enrollment->update($payload);

        return response()->json([
            'message' => 'Status enrollment berhasil diperbarui.',
            'data'    => $enrollment->load(['user', 'course.certificationLevel', 'batch']),
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

        if ($enrollment->attended_field_trip) {
            app(\App\Services\CertificateService::class)->autoIssueCertificateIfEligible($enrollment);
        }

        return response()->json([
            'message'             => "Status Field Trip berhasil diubah menjadi: {$status}.",
            'attended_field_trip' => $enrollment->attended_field_trip,
        ]);
    }

    /** Student: Konfirmasi kehadiran Field Study (self-report) */
    public function studentConfirmFieldStudy(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->hasRole('admin') && !$request->user()->hasVerifiedEmail()) {
            return response()->json([
                'message'          => 'Email Anda belum diverifikasi. Silakan lakukan verifikasi email Anda terlebih dahulu.',
                'email_unverified' => true,
            ], 403);
        }

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
            if ($validated['attending']) {
                app(\App\Services\CertificateService::class)->autoIssueCertificateIfEligible($enrollment);
            }
        }

        return response()->json([
            'message'             => $validated['attending']
                ? 'Kehadiran Field Study berhasil dicatat. Menunggu konfirmasi admin.'
                : 'Kamu memilih untuk tidak mengikuti Field Study.',
            'attended_field_trip' => $enrollment->fresh()->attended_field_trip,
        ]);
    }

    /**
     * Student: Batalkan pesanan kursus yang masih berstatus payment_pending
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($enrollment->status !== 'payment_pending') {
            return response()->json([
                'message' => 'Hanya pesanan dengan status menunggu pembayaran yang dapat dibatalkan.',
            ], 422);
        }

        $enrollment->update([
            'status'         => 'cancelled',
            'payment_status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Pesanan berhasil dibatalkan.',
            'data'    => $enrollment,
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
