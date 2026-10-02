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
            'grade'         => 'required|string|in:Standard,Good,Excellent',
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
            'grade'          => 'sometimes|string|in:Standard,Good,Excellent',
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

    /** Admin: Download PDF sertifikat */
    public function download(int $id)
    {
        $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])->findOrFail($id);

        $verificationUrl = config('app.tbe_base_url', 'https://theblueeconomist.org')
            . "/certification/{$cert->serial_url_key}";

        $qrSvg = \QrCode::format('svg')->size(140)->generate($verificationUrl);
        $qrImageBase64 = base64_encode($qrSvg);

        $templatePath = resource_path('images/template_CBEc.png');
        $templateBase64 = file_exists($templatePath)
            ? base64_encode(file_get_contents($templatePath))
            : null;

        $pdf = Pdf::loadView('certificates.template', [
            'certificate'    => $cert,
            'user'           => $cert->user,
            'course'         => $cert->enrollment->course,
            'level'          => $cert->enrollment->course->certificationLevel,
            'qrImageBase64'  => $qrImageBase64,
            'templateBase64' => $templateBase64,
        ])->setPaper('a4', 'landscape');

        $filename = "Sertifikat_{$cert->user->name}_{$cert->serial_number}.pdf";
        $filename = str_replace(['/', ' '], ['_', '_'], $filename);

        return $pdf->download($filename);
    }

    /* ──────────────────────────────────────────────
       TEMPLATE DESIGNER
    ────────────────────────────────────────────── */

    /** Default field layout dalam mm (A4 landscape: 297 × 210 mm) */
    private function defaultLayout(): array
    {
        return [
            'serial_no'      => ['top' => 13.0, 'right' => 14.0, 'width' => 105, 'font_size' => 8.8, 'label' => 'Nomor Seri'],
            'recipient_name' => ['top' => 67.0, 'font_size' => 27, 'label' => 'Nama Peserta'],
            'ribbon_text'    => ['top' => 100.5, 'height' => 14.0, 'font_size' => 14.5, 'color' => '#173874', 'label' => 'Teks Spesialisasi (Ribbon Emas)'],
            'level_value'    => ['top' => 124.5, 'font_size' => 11.5, 'label' => 'Level Sertifikasi'],
            'meta_block'     => ['top' => 138.2, 'font_size' => 8.4, 'label' => 'Info Grade, Tanggal, & Tempat Terbit'],
            'qr_left'        => ['top' => 147.5, 'left' => 67.0, 'size' => 26, 'label' => 'Barcode / QR Kiri'],
            'qr_right'       => ['top' => 147.5, 'left' => 196.4, 'size' => 26, 'label' => 'Barcode / QR Kanan'],
        ];
    }

    /** Ambil layout konfigurasi saat ini */
    public function getLayout(): JsonResponse
    {
        $layoutPath = storage_path('app/cert_layout.json');
        $layout = file_exists($layoutPath)
            ? json_decode(file_get_contents($layoutPath), true)
            : $this->defaultLayout();

        return response()->json(['data' => $layout]);
    }

    /** Simpan layout konfigurasi baru */
    public function saveLayout(Request $request): JsonResponse
    {
        $validated = $request->validate(['fields' => 'required|array']);

        $layoutPath = storage_path('app/cert_layout.json');
        file_put_contents($layoutPath, json_encode($validated['fields'], JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'Layout template berhasil disimpan.',
            'data'    => $validated['fields'],
        ]);
    }

    /** Return template image sebagai base64 untuk frontend designer */
    public function getTemplateImage(): JsonResponse
    {
        $templatePath = resource_path('images/template_CBEc.png');

        if (! file_exists($templatePath)) {
            return response()->json(['message' => 'Template image tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => [
                'base64'    => base64_encode(file_get_contents($templatePath)),
                'mime_type' => 'image/png',
                'width_mm'  => 297,
                'height_mm' => 210,
            ],
        ]);
    }
}

