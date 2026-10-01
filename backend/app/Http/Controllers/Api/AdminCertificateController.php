<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Services\CertificateService;
use App\Services\TheBlueEconomistService;
use App\Exports\CertificatesExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class AdminCertificateController extends Controller
{
    public function __construct(
        private CertificateService $certService,
        private TheBlueEconomistService $tbeService,
    ) {}

    /** List semua sertifikat dengan filter */
    public function index(Request $request): JsonResponse
    {
        $certs = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->when($request->search, fn($q) => $q->where('serial_number', 'like', "%{$request->search}%")
                ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$request->search}%")))
            ->when($request->sync_status, fn($q) => $q->where('sync_status', $request->sync_status))
            ->when($request->level, fn($q) => $q->whereHas('enrollment.course.certificationLevel',
                fn($l) => $l->where('code', $request->level)))
            ->orderByDesc('date_of_issue')
            ->paginate(20);

        return response()->json(['data' => $certs]);
    }

    /** Terbitkan sertifikat untuk enrollment yang sudah lulus */
    public function issue(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'grade'         => 'required|string|max:50',
            'date_of_issue' => 'required|date',
            'place_of_issue'=> 'required|string|max:100',
            'serial_number' => 'nullable|string|unique:certificates,serial_number', // Admin override
        ]);

        $enrollment = Enrollment::with(['user', 'course.certificationLevel'])->findOrFail($validated['enrollment_id']);

        // Cek kelayakan sertifikat
        $eligibility = $this->certService->isEligibleForCertificate($enrollment);
        if (! $eligibility['eligible']) {
            return response()->json(['message' => $eligibility['reason']], 422);
        }

        // Cek duplikat
        if ($enrollment->certificate()->exists()) {
            return response()->json(['message' => 'Sertifikat untuk enrollment ini sudah pernah diterbitkan.'], 409);
        }

        // Generate serial number (atau pakai override dari admin)
        if (empty($validated['serial_number'])) {
            $sequence = $this->certService->getNextSequence();
            $serials  = $this->certService->generateSerialNumbers($sequence, new \DateTime($validated['date_of_issue']));
        } else {
            // Admin menginput nomor seri manual
            $baseKey  = preg_replace('/[^A-Z0-9]/', '', strtoupper($validated['serial_number']));
            $serials  = [
                'serial_number'  => $validated['serial_number'],
                'serial_url_key' => $baseKey . strtoupper(\Illuminate\Support\Str::random(3)),
            ];
        }

        $certificate = Certificate::create([
            'enrollment_id'  => $enrollment->id,
            'user_id'        => $enrollment->user_id,
            'serial_number'  => $serials['serial_number'],
            'serial_url_key' => $serials['serial_url_key'],
            'grade'          => $validated['grade'],
            'date_of_issue'  => $validated['date_of_issue'],
            'place_of_issue' => $validated['place_of_issue'],
            'sync_status'    => 'pending',
        ]);

        // Update enrollment status ke completed
        $enrollment->update(['status' => 'completed']);

        // Langsung push ke The Blue Economist
        $syncResult = $this->tbeService->syncCertificate($certificate);

        return response()->json([
            'message'     => 'Sertifikat berhasil diterbitkan.' . ($syncResult ? ' Data terkirim ke The Blue Economist.' : ' Gagal sinkronisasi ke TBE, silakan re-sync.'),
            'data'        => $certificate->load(['user', 'enrollment.course']),
            'sync_status' => $syncResult ? 'synced' : 'failed',
        ], 201);
    }

    /** Admin override nomor seri sertifikat */
    public function update(Request $request, int $id): JsonResponse
    {
        $cert = Certificate::findOrFail($id);

        $validated = $request->validate([
            'serial_number'  => "nullable|string|unique:certificates,serial_number,{$id}",
            'serial_url_key' => "nullable|string|unique:certificates,serial_url_key,{$id}",
            'grade'          => 'nullable|string|max:50',
            'date_of_issue'  => 'nullable|date',
            'place_of_issue' => 'nullable|string|max:100',
        ]);

        $cert->update(array_filter($validated));

        return response()->json(['message' => 'Sertifikat berhasil diperbarui.', 'data' => $cert]);
    }

    /** Sinkronisasi satu sertifikat ke The Blue Economist */
    public function syncToTBE(int $id): JsonResponse
    {
        $cert   = Certificate::with(['user', 'enrollment.course.certificationLevel'])->findOrFail($id);
        $result = $this->tbeService->syncCertificate($cert);

        return response()->json([
            'message' => $result ? 'Berhasil disinkronkan ke The Blue Economist.' : 'Gagal sinkronisasi. Cek log untuk detail.',
            'data'    => $cert->fresh(),
        ]);
    }

    /** Re-sync semua sertifikat yang gagal */
    public function resyncFailed(): JsonResponse
    {
        $results = $this->tbeService->resyncFailed();

        return response()->json([
            'message' => "Re-sync selesai. Berhasil: {$results['success']}, Gagal: {$results['failed']}.",
            'data'    => $results,
        ]);
    }

    /** Export semua sertifikat ke file Excel */
    public function export(Request $request)
    {
        return Excel::download(new CertificatesExport($request->all()), 'database-sertifikat-digibluecamp.xlsx');
    }
}
