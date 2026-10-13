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
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AdminCertificateController extends Controller
{
    public function __construct(
        private CertificateService $certService,
        private TheBlueEconomistService $tbeService,
    ) {
    }

    /** List semua sertifikat dengan filter */
    public function index(Request $request): JsonResponse
    {
        $certs = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->when($request->search, fn($q) => $q->where('serial_number', 'like', "%{$request->search}%")
                ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$request->search}%")))
            ->when($request->sync_status, fn($q) => $q->where('sync_status', $request->sync_status))
            ->when($request->level, fn($q) => $q->whereHas(
                'enrollment.course.certificationLevel',
                fn($l) => $l->where('code', $request->level)
            ))
            ->orderByDesc('date_of_issue')
            ->paginate(20);

        return response()->json(['data' => $certs]);
    }

    /** Terbitkan sertifikat untuk enrollment yang sudah lulus */
    public function issue(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'grade' => 'required|string|in:Standard,Good,Excellent',
            'date_of_issue' => 'required|date',
            'place_of_issue' => 'required|string|max:100',
            'serial_number' => 'nullable|string|unique:certificates,serial_number', // Admin override
        ]);

        $enrollment = Enrollment::with(['user', 'course.certificationLevel'])->findOrFail($validated['enrollment_id']);

        // Cek kelayakan sertifikat
        $eligibility = $this->certService->isEligibleForCertificate($enrollment);
        if (!$eligibility['eligible']) {
            return response()->json(['message' => $eligibility['reason']], 422);
        }

        // Cek duplikat
        if ($enrollment->certificate()->exists()) {
            return response()->json(['message' => __('api.sertifikat_untuk_enrollment_ini')], 409);
        }

        // Generate serial number (atau pakai override dari admin)
        if (empty($validated['serial_number'])) {
            $dateObj = new \DateTime($validated['date_of_issue']);
            $year = (int) $dateObj->format('Y');
            $sequence = $this->certService->getNextSequence($year);
            $serials = $this->certService->generateSerialNumbers($sequence, $dateObj);
        } else {
            // Admin menginput nomor seri manual
            $baseKey = preg_replace('/[^A-Z0-9]/', '', strtoupper($validated['serial_number']));
            $serials = [
                'serial_number' => $validated['serial_number'],
                'serial_url_key' => $baseKey . strtoupper(\Illuminate\Support\Str::random(3)),
            ];
        }

        $certificate = Certificate::create([
            'enrollment_id' => $enrollment->id,
            'user_id' => $enrollment->user_id,
            'serial_number' => $serials['serial_number'],
            'serial_url_key' => $serials['serial_url_key'],
            'grade' => $validated['grade'],
            'date_of_issue' => $validated['date_of_issue'],
            'place_of_issue' => $validated['place_of_issue'],
            'sync_status' => 'pending',
        ]);

        // Update enrollment status ke completed
        $enrollment->update(['status' => 'completed']);

        // Langsung push ke The Blue Economist
        $syncResult = $this->tbeService->syncCertificate($certificate);

        return response()->json([
            'message' => __('api.sertifikat_berhasil_diterbitkan') . ($syncResult ? ' Data terkirim ke The Blue Economist.' : ' Gagal sinkronisasi ke TBE, silakan re-sync.'),
            'data' => $certificate->load(['user', 'enrollment.course']),
            'sync_status' => $syncResult ? 'synced' : 'failed',
        ], 201);
    }

    /** Admin override nomor seri sertifikat */
    public function update(Request $request, int $id): JsonResponse
    {
        $cert = Certificate::findOrFail($id);

        $validated = $request->validate([
            'serial_number' => "nullable|string|unique:certificates,serial_number,{$id}",
            'serial_url_key' => "nullable|string|unique:certificates,serial_url_key,{$id}",
            'grade' => 'sometimes|string|in:Standard,Good,Excellent',
            'date_of_issue' => 'nullable|date',
            'place_of_issue' => 'nullable|string|max:100',
        ]);

        $cert->update(array_filter($validated));

        return response()->json(['message' => __('api.sertifikat_berhasil_diperbarui'), 'data' => $cert]);
    }

    /** Sinkronisasi satu sertifikat ke The Blue Economist */
    public function syncToTBE(int $id): JsonResponse
    {
        $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])->findOrFail($id);
        $result = $this->tbeService->syncCertificate($cert);

        return response()->json([
            'message' => $result ? 'Berhasil disinkronkan ke The Blue Economist.' : 'Gagal sinkronisasi. Cek log untuk detail.',
            'data' => $cert->fresh(),
        ]);
    }

    /** Re-sync semua sertifikat yang gagal */
    public function resyncFailed(): JsonResponse
    {
        $results = $this->tbeService->resyncFailed();

        return response()->json([
            'message' => "Re-sync selesai. Berhasil: {$results['success']}, Gagal: {$results['failed']}.",
            'data' => $results,
        ]);
    }

    /** Export semua sertifikat ke file Excel */
    public function export(Request $request)
    {
        return Excel::download(new CertificatesExport($request->all()), 'database-sertifikat-digibluecamp.xlsx');
    }

    /** Admin: Download PDF sertifikat */
    public function download(Request $request, int $id)
    {
        $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])->findOrFail($id);

        if ($request->query('type') === 'critical_thinking' || $request->query('type') === 'field_study') {
            return $this->downloadCriticalThinking($cert);
        }

        $verificationUrl = config('app.tbe_base_url', 'https://theblueeconomist.org')
            . "/certification/{$cert->serial_url_key}";

        $qrSvg = QrCode::format('svg')->size(140)->generate($verificationUrl);
        $qrImageBase64 = base64_encode($qrSvg);

        $courseTitle = $cert->enrollment->course->title ?? '';
        $levelName = $cert->enrollment->course->certificationLevel->name ?? '';
        $levelCode = $cert->enrollment->course->certificationLevel->code ?? '';

        $isFoundation = str_contains(strtolower($courseTitle), 'foundation')
            || str_contains(strtolower($levelName), 'foundation')
            || strtolower($levelCode) === 'fnd'
            || strtolower($levelCode) === 'foundation';

        $frontTemplateName = $isFoundation ? 'template_foundation.png' : 'template_CBEc.png';
        $templatePath = file_exists(resource_path("images/{$frontTemplateName}"))
            ? resource_path("images/{$frontTemplateName}")
            : (file_exists(resource_path('images/template_CBEc.png'))
                ? resource_path('images/template_CBEc.png')
                : resource_path('images/cbectemplate.jpg'));
        $templateBase64 = file_exists($templatePath)
            ? base64_encode(file_get_contents($templatePath))
            : null;

        $templateBackPath = resource_path('images/template_back.png');
        $templateBackBase64 = file_exists($templateBackPath)
            ? base64_encode(file_get_contents($templateBackPath))
            : null;

        $pdf = Pdf::loadView('certificates.template', [
            'certificate' => $cert,
            'user' => $cert->user,
            'course' => $cert->enrollment->course,
            'level' => $cert->enrollment->course->certificationLevel,
            'qrImageBase64' => $qrImageBase64,
            'templateBase64' => $templateBase64,
            'templateBackBase64' => $templateBackBase64,
        ])->setPaper('a4', 'landscape');

        $filename = "Sertifikat_{$cert->user->name}_{$cert->serial_number}.pdf";
        $filename = str_replace(['/', ' '], ['_', '_'], $filename);

        return $pdf->download($filename);
    }

    /** Download PDF Critical Thinking (Certificate of Completion) */
    public function downloadCriticalThinking(Certificate $cert)
    {
        $layoutPath = storage_path('app/cert_layout.json');
        $layout = file_exists($layoutPath)
            ? json_decode(file_get_contents($layoutPath), true)
            : $this->defaultLayout();

        $frontTemplatePath = file_exists(resource_path('images/template_critical_thinking_front.png'))
            ? resource_path('images/template_critical_thinking_front.png')
            : (file_exists(resource_path('images/template_field_study_front.png'))
                ? resource_path('images/template_field_study_front.png')
                : resource_path('images/Foundation.png'));
        $frontBase64 = file_exists($frontTemplatePath)
            ? base64_encode(file_get_contents($frontTemplatePath))
            : null;

        $backTemplatePath = file_exists(resource_path('images/template_critical_thinking_back.png'))
            ? resource_path('images/template_critical_thinking_back.png')
            : (file_exists(resource_path('images/template_field_study_back.png'))
                ? resource_path('images/template_field_study_back.png')
                : resource_path('images/Foundation (2).png'));
        $backBase64 = file_exists($backTemplatePath)
            ? base64_encode(file_get_contents($backTemplatePath))
            : null;

        $issueCarbon = \Carbon\Carbon::parse($cert->date_of_issue);
        $seq = preg_match('/(\d{3,4})$/', $cert->serial_number, $m) ? $m[1] : '001';
        $regNo = 'CBETC' . ltrim($seq, '0') . $issueCarbon->format('mY');

        $viewName = view()->exists('certificates.template_critical_thinking')
            ? 'certificates.template_critical_thinking'
            : 'certificates.template_field_study';

        $pdf = Pdf::loadView($viewName, [
            'certificate' => $cert,
            'user' => $cert->user,
            'course' => $cert->enrollment->course,
            'regNo' => $regNo,
            'templateFrontBase64' => $frontBase64,
            'templateBackBase64' => $backBase64,
            'layout' => $layout,
        ])->setPaper('a4', 'landscape');

        $filename = "Sertifikat_Critical_Thinking_{$cert->user->name}_{$cert->serial_number}.pdf";
        $filename = str_replace(['/', ' '], ['_', '_'], $filename);

        return $pdf->download($filename);
    }

    /** Download PDF Field Study (Alias ke Completion / Critical Thinking) */
    public function downloadFieldStudy(Certificate $cert)
    {
        return $this->downloadCriticalThinking($cert);
    }

    /* ──────────────────────────────────────────────
       TEMPLATE DESIGNER
    ────────────────────────────────────────────── */

    /** Default field layout dalam mm (A4 landscape: 297 × 210 mm) */
    private function defaultLayout(): array
    {
        return [
            'serial_no' => ['top' => 13.0, 'right' => 16.5, 'width' => 105, 'font_size' => 11.0, 'label' => 'Nomor Seri'],
            'recipient_name' => ['top' => 69.5, 'font_size' => 32.5, 'label' => 'Nama Peserta'],
            'ribbon_text' => ['top' => 100.5, 'height' => 14.0, 'font_size' => 22.5, 'color' => '#173874', 'label' => 'Teks Spesialisasi (Ribbon Emas)'],
            'level_value' => ['top' => 124.5, 'font_size' => 14.5, 'label' => 'Level Sertifikasi'],
            'meta_block' => ['top' => 138.2, 'font_size' => 11.5, 'label' => 'Info Grade, Tanggal, & Tempat Terbit'],
            'qr_left' => ['top' => 147.5, 'left' => 67.0, 'size' => 26, 'label' => 'Barcode / QR Kiri'],
            'qr_right' => ['top' => 147.5, 'left' => 196.4, 'size' => 26, 'label' => 'Barcode / QR Kanan'],
            'back_title' => ['top' => 20.0, 'font_size' => 15.0, 'label' => 'Judul Halaman Belakang'],

            // Critical Thinking & Field Study / Completion template fields
            'fs_recipient_name' => ['top' => 70.0, 'font_size' => 33.0, 'label' => 'Critical Thinking: Nama Peserta'],
            'fs_course_title' => ['top' => 108.5, 'font_size' => 19.0, 'label' => 'Critical Thinking: Judul Pelatihan'],
            'fs_date_participation' => ['top' => 134.5, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tanggal Partisipasi'],
            'fs_date_issue' => ['top' => 141.5, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tempat & Tanggal Terbit'],
            'fs_back_name' => ['top' => 25.0, 'left' => 32.0, 'font_size' => 13.0, 'label' => 'Critical Thinking Belakang: Nama'],
            'fs_back_reg_no' => ['top' => 29.5, 'left' => 57.0, 'font_size' => 13.0, 'label' => 'Critical Thinking Belakang: No. Reg'],

            // Alias ct_
            'ct_recipient_name' => ['top' => 70.0, 'font_size' => 33.0, 'label' => 'Critical Thinking: Nama Peserta'],
            'ct_course_title' => ['top' => 108.5, 'font_size' => 19.0, 'label' => 'Critical Thinking: Judul Pelatihan'],
            'ct_date_participation' => ['top' => 134.5, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tanggal Partisipasi'],
            'ct_date_issue' => ['top' => 141.5, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tempat & Tanggal Terbit'],
            'ct_back_name' => ['top' => 25.0, 'left' => 32.0, 'font_size' => 13.0, 'label' => 'Critical Thinking Belakang: Nama'],
            'ct_back_reg_no' => ['top' => 29.5, 'left' => 57.0, 'font_size' => 13.0, 'label' => 'Critical Thinking Belakang: No. Reg'],
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
            'message' => __('api.layout_template_berhasil_disimpan'),
            'data' => $validated['fields'],
        ]);
    }

    /** Return template image sebagai base64 untuk frontend designer */
    public function getTemplateImage(): JsonResponse
    {
        $templatePath = file_exists(resource_path('images/template_CBEc.png'))
            ? resource_path('images/template_CBEc.png')
            : (file_exists(resource_path('images/cbectemplate.jpg'))
                ? resource_path('images/cbectemplate.jpg')
                : null);

        if (!$templatePath || !file_exists($templatePath)) {
            return response()->json(['message' => __('api.template_image_tidak_ditemukan')], 404);
        }

        $extension = strtolower(pathinfo($templatePath, PATHINFO_EXTENSION));
        $mimeType = ($extension === 'jpg' || $extension === 'jpeg') ? 'image/jpeg' : 'image/png';

        $foundPath = file_exists(resource_path('images/template_foundation.png'))
            ? resource_path('images/template_foundation.png')
            : $templatePath;
        $foundBase64 = file_exists($foundPath)
            ? base64_encode(file_get_contents($foundPath))
            : null;

        $templateBackPath = resource_path('images/template_back.png');
        $backBase64 = file_exists($templateBackPath)
            ? base64_encode(file_get_contents($templateBackPath))
            : null;

        $ctFrontPath = file_exists(resource_path('images/template_critical_thinking_front.png'))
            ? resource_path('images/template_critical_thinking_front.png')
            : (file_exists(resource_path('images/template_field_study_front.png'))
                ? resource_path('images/template_field_study_front.png')
                : resource_path('images/Foundation.png'));
        $ctFrontBase64 = file_exists($ctFrontPath)
            ? base64_encode(file_get_contents($ctFrontPath))
            : null;

        $ctBackPath = file_exists(resource_path('images/template_critical_thinking_back.png'))
            ? resource_path('images/template_critical_thinking_back.png')
            : (file_exists(resource_path('images/template_field_study_back.png'))
                ? resource_path('images/template_field_study_back.png')
                : resource_path('images/Foundation (2).png'));
        $ctBackBase64 = file_exists($ctBackPath)
            ? base64_encode(file_get_contents($ctBackPath))
            : null;

        return response()->json([
            'data' => [
                'base64' => base64_encode(file_get_contents($templatePath)),
                'mime_type' => $mimeType,
                'foundation_base64' => $foundBase64,
                'back_base64' => $backBase64,
                'back_mime_type' => 'image/png',
                'critical_thinking_front_base64' => $ctFrontBase64,
                'critical_thinking_back_base64' => $ctBackBase64,
                'field_study_front_base64' => $ctFrontBase64,
                'field_study_back_base64' => $ctBackBase64,
                'width_mm' => 297,
                'height_mm' => 210,
            ],
        ]);
    }

    /** Ambil nomor seri berikutnya yang diestimasi */
    public function getNextSerial(Request $request): JsonResponse
    {
        $dateObj = $request->query('date') ? new \DateTime($request->query('date')) : now();
        $year = (int) $dateObj->format('Y');
        $sequence = $this->certService->getNextSequence($year);
        $serials = $this->certService->generateSerialNumbers($sequence, $dateObj);

        return response()->json([
            'data' => [
                'next_sequence' => $sequence,
                'next_serial_number' => $serials['serial_number'],
                'next_serial_url_key' => $serials['serial_url_key'],
            ],
        ]);
    }
}

