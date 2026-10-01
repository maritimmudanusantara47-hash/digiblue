<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\ScholarshipApplication;
use App\Models\ScholarshipAppeal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ScholarshipController extends Controller
{
    /** Peserta: Ajukan beasiswa — upload berkas & surat motivasi */
    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id'          => 'required|exists:courses,id',
            'motivation_letter'  => 'required|string|min:100',
            'document'           => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // maks 5MB
        ]);

        // Buat atau ambil enrollment yang sudah ada
        $enrollment = Enrollment::firstOrCreate(
            ['user_id' => $request->user()->id, 'course_id' => $validated['course_id']],
            ['status' => 'pending_review']
        );

        if ($enrollment->status === 'active' || $enrollment->status === 'completed') {
            return response()->json(['message' => 'Kamu sudah memiliki akses aktif untuk kursus ini.'], 409);
        }

        // Upload dokumen
        $docPath = $request->file('document')->store('scholarships/documents', 'public');

        $application = ScholarshipApplication::updateOrCreate(
            ['enrollment_id' => $enrollment->id],
            [
                'motivation_letter' => $validated['motivation_letter'],
                'document_url'      => $docPath,
                'decision_status'   => 'pending',
            ]
        );

        return response()->json([
            'message' => 'Pengajuan beasiswa berhasil dikirim. Tunggu kurasi dari tim kami.',
            'data'    => $application,
        ], 201);
    }

    /** Peserta: Ajukan negosiasi / keringanan biaya */
    public function appeal(Request $request, int $applicationId): JsonResponse
    {
        $application = ScholarshipApplication::where('id', $applicationId)
            ->whereHas('enrollment', fn($q) => $q->where('user_id', $request->user()->id))
            ->whereIn('decision_status', ['approved_partial_a', 'approved_partial_b'])
            ->firstOrFail();

        // Tolak jika sudah ada appeal yang pending
        if ($application->appeals()->where('status', 'pending')->exists()) {
            return response()->json(['message' => 'Pengajuan negosiasi kamu sedang dalam proses review.'], 409);
        }

        $validated = $request->validate([
            'reason'            => 'required|string|min:50',
            'proposed_amount'   => 'nullable|numeric|min:0',
            'supporting_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $docPath = null;
        if ($request->hasFile('supporting_document')) {
            $docPath = $request->file('supporting_document')->store('scholarships/appeals', 'public');
        }

        $appeal = ScholarshipAppeal::create([
            'scholarship_application_id' => $application->id,
            'reason'                     => $validated['reason'],
            'proposed_amount'            => $validated['proposed_amount'] ?? null,
            'supporting_document_url'    => $docPath,
            'status'                     => 'pending',
        ]);

        return response()->json([
            'message' => 'Pengajuan keringanan biaya berhasil dikirim. Kami akan segera meninjau permohonanmu.',
            'data'    => $appeal,
        ], 201);
    }

    /** Admin: List semua pengajuan beasiswa */
    public function adminIndex(Request $request): JsonResponse
    {
        $apps = ScholarshipApplication::with([
            'enrollment.user',
            'enrollment.course.certificationLevel',
            'appeals',
        ])
        ->when($request->status, fn($q) => $q->where('decision_status', $request->status))
        ->when($request->search, fn($q) => $q->whereHas('enrollment.user',
            fn($u) => $u->where('name', 'like', "%{$request->search}%")))
        ->orderByDesc('created_at')
        ->paginate(15);

        return response()->json(['data' => $apps]);
    }

    /** Admin: Buat keputusan beasiswa (Fully/Partial A/Partial B/Reject) */
    public function decide(Request $request, int $id): JsonResponse
    {
        $application = ScholarshipApplication::with('enrollment')->findOrFail($id);

        $validated = $request->validate([
            'decision'       => 'required|in:approved_fully,approved_partial_a,approved_partial_b,rejected',
            'reviewer_notes' => 'nullable|string|max:1000',
        ]);

        $application->update([
            'decision_status' => $validated['decision'],
            'reviewer_notes'  => $validated['reviewer_notes'] ?? null,
            'reviewed_by'     => $request->user()->id,
            'reviewed_at'     => now(),
        ]);

        $enrollment = $application->enrollment;

        // Jika Fully Funded: langsung aktifkan kursus
        if ($validated['decision'] === 'approved_fully') {
            $enrollment->update([
                'status'          => 'active',
                'enrollment_type' => 'scholarship_fully',
            ]);
        } elseif (in_array($validated['decision'], ['approved_partial_a', 'approved_partial_b'])) {
            $amount = $validated['decision'] === 'approved_partial_a' ? 1000000 : 1500000;
            $enrollType = $validated['decision'] === 'approved_partial_a' ? 'scholarship_partial_a' : 'scholarship_partial_b';
            $enrollment->update([
                'status'               => 'payment_pending',
                'enrollment_type'      => $enrollType,
                'final_payment_amount' => $amount,
            ]);
        } elseif ($validated['decision'] === 'rejected') {
            $enrollment->update(['status' => 'rejected']);
        }

        return response()->json([
            'message' => 'Keputusan beasiswa berhasil disimpan.',
            'data'    => $application->fresh(['enrollment.user', 'enrollment.course']),
        ]);
    }

    /** Admin: Setujui / tolak negosiasi biaya peserta */
    public function resolveAppeal(Request $request, int $id, int $appealId): JsonResponse
    {
        $application = ScholarshipApplication::with('enrollment')->findOrFail($id);
        $appeal      = ScholarshipAppeal::where('scholarship_application_id', $id)
            ->findOrFail($appealId);

        $validated = $request->validate([
            'decision'             => 'required|in:approved,rejected',
            'final_agreed_amount'  => 'required_if:decision,approved|nullable|numeric|min:0',
            'admin_response_notes' => 'nullable|string|max:1000',
        ]);

        $appeal->update([
            'status'               => $validated['decision'],
            'final_agreed_amount'  => $validated['final_agreed_amount'] ?? null,
            'admin_response_notes' => $validated['admin_response_notes'] ?? null,
            'resolved_by'          => $request->user()->id,
            'resolved_at'          => now(),
        ]);

        // Jika disetujui, update final_payment_amount di enrollment
        if ($validated['decision'] === 'approved' && isset($validated['final_agreed_amount'])) {
            $finalAmount = (float)$validated['final_agreed_amount'];

            $application->enrollment->update([
                'final_payment_amount' => $finalAmount,
                // Jika disepakati Rp 0 = Fully Funded
                'status'               => $finalAmount === 0.0 ? 'active' : 'payment_pending',
                'enrollment_type'      => $finalAmount === 0.0 ? 'scholarship_fully' : $application->enrollment->enrollment_type,
            ]);
        }

        return response()->json([
            'message' => $validated['decision'] === 'approved'
                ? "Negosiasi disetujui. Tagihan diperbarui menjadi Rp " . number_format($validated['final_agreed_amount'] ?? 0, 0, ',', '.')
                : 'Pengajuan negosiasi ditolak.',
            'data' => $appeal->fresh(),
        ]);
    }
}
