<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\CertificationLevel;
use App\Models\User;
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
            $course = $enrollment->course;
            $trackCode = $this->certService->getTrackCode($course);
            $dateObj = new \DateTime($validated['date_of_issue']);
            $year = (int) $dateObj->format('Y');
            $sequence = $this->certService->getNextSequence($year, $trackCode);
            $serials = $this->certService->generateSerialNumbers($sequence, $dateObj, $trackCode);
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

        // Notifikasi ke Peserta bahwa sertifikat resmi telah diterbitkan oleh Admin
        try {
            $courseTitle = $enrollment->course->title ?? 'Kursus Kompetensi';
            app(\App\Services\NotificationService::class)->send(
                $enrollment->user_id,
                "Selamat! Sertifikat Resmi Anda Telah Terbit",
                "Sertifikat kompetensi '{$courseTitle}' (No: {$certificate->serial_number}) telah resmi diterbitkan oleh Admin. Silakan periksa di menu Sertifikat Anda.",
                'certificate_issued',
                '/student/certificates',
                'certificate-badge-1'
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Notification trigger manual certificate_issued error: " . $e->getMessage());
        }

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

    /** Hapus sertifikat (jika salah terbit atau ingin reset untuk terbit ulang) */
    public function destroy(int $id): JsonResponse
    {
        $cert = Certificate::findOrFail($id);

        if ($cert->enrollment) {
            $cert->enrollment->update(['status' => 'in_progress']);
        }

        $cert->delete();

        return response()->json([
            'message' => 'Sertifikat berhasil dihapus. Enrollment dapat diterbitkan ulang.',
        ]);
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

    /** Re-sync semua sertifikat yang gagal (atau force semua jika query param ?force=1) */
    public function resyncFailed(Request $request): JsonResponse
    {
        $force = $request->boolean('force', false);
        $results = $this->tbeService->resyncFailed($force);

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
        if ($id <= 0 || $request->boolean('sample') || $request->filled('name')) {
            $cert = $this->sampleCertificate($request);
        } else {
            try {
                $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])->find($id);
            } catch (\Throwable $e) {
                $cert = null;
            }

            if (! $cert) {
                $cert = $this->sampleCertificate($request);
            }
        }

        if ($request->filled('name') && $cert && $cert->user) {
            $cert->user->name = $request->query('name');
        }

        if ($request->query('type') === 'field_study') {
            return $this->downloadFieldStudy($cert, $request);
        }

        if ($request->query('type') === 'critical_thinking') {
            return $this->downloadCriticalThinking($cert, $request);
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

        $courseSlug = $cert->enrollment->course->slug ?? '';
        $specBackPath = resource_path("images/template_cbec_back_{$courseSlug}.png");
        $hasCustomBackTemplate = false;

        if (! $isFoundation && file_exists($specBackPath)) {
            $templateBackPath = $specBackPath;
            $hasCustomBackTemplate = true;
        } else {
            $templateBackPath = resource_path('images/template_back.png');
        }

        $templateBackBase64 = file_exists($templateBackPath)
            ? base64_encode(file_get_contents($templateBackPath))
            : null;

        $pdf = Pdf::loadView('certificates.template', [
            'certificate'           => $cert,
            'user'                  => $cert->user,
            'course'                => $cert->enrollment->course,
            'level'                 => $cert->enrollment->course->certificationLevel,
            'qrImageBase64'         => $qrImageBase64,
            'templateBase64'        => $templateBase64,
            'templateBackBase64'    => $templateBackBase64,
            'hasCustomBackTemplate' => $hasCustomBackTemplate,
        ])->setPaper('a4', 'landscape');

        $filename = $this->certService->generateCertificateFileName($cert);

        return $pdf->download($filename);
    }

    /** Download PDF Critical Thinking (Certificate of Completion) */
    public function downloadCriticalThinking(Certificate $cert, ?Request $request = null)
    {
        $req = $request ?? request();
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

        $requestedTrack = $req->query('track');
        $rawCourseTitle = $cert->enrollment->course->title ?? '';
        $levelName = $cert->enrollment->course->certificationLevel->name ?? '';
        $levelCode = $cert->enrollment->course->certificationLevel->code ?? '';

        if ($requestedTrack) {
            $courseSlug = $requestedTrack;
            $isFoundation = ($courseSlug === 'foundation');
        } else {
            $isFoundation = str_contains(strtolower($rawCourseTitle), 'foundation')
                || str_contains(strtolower($levelName), 'foundation')
                || strtolower($levelCode) === 'fnd'
                || strtolower($levelCode) === 'foundation';
            $courseSlug = $cert->enrollment->course->slug ?? '';
        }

        $blankBackPath = resource_path('images/template_fs_back_blank.png');
        if (file_exists($blankBackPath)) {
            $backTemplatePath = $blankBackPath;
        } else {
            $backTemplatePath = file_exists(resource_path('images/template_critical_thinking_back.png'))
                ? resource_path('images/template_critical_thinking_back.png')
                : (file_exists(resource_path('images/template_field_study_back.png'))
                    ? resource_path('images/template_field_study_back.png')
                    : resource_path('images/Foundation (2).png'));
        }
        $backBase64 = file_exists($backTemplatePath)
            ? base64_encode(file_get_contents($backTemplatePath))
            : null;

        $customDate = request()->query('date') ? new \DateTime(request()->query('date')) : null;
        $regNo = $req->query('reg_no') ?: $this->certService->getCbetcRegNoForCertificate($cert, $customDate);

        $viewName = view()->exists('certificates.template_critical_thinking')
            ? 'certificates.template_critical_thinking'
            : 'certificates.template_field_study';

        $curriculum = $this->certService->getCurriculumForCourse($cert->enrollment->course, 'critical_thinking');

        $pdf = Pdf::loadView($viewName, [
            'certificate' => $cert,
            'user' => $cert->user,
            'course' => $cert->enrollment->course,
            'courseSlug' => $courseSlug,
            'regNo' => $regNo,
            'templateFrontBase64' => $frontBase64,
            'templateBackBase64' => $backBase64,
            'layout' => $layout,
            'curriculum' => $curriculum,
        ])->setPaper('a4', 'landscape');

        $filename = $this->certService->generateCertificateFileName($cert, 'critical_thinking', $regNo);

        return $pdf->download($filename);
    }

    /** Download PDF Field Study */
    public function downloadFieldStudy(Certificate $cert, ?Request $request = null)
    {
        $req = $request ?? request();
        $layoutPath = storage_path('app/cert_layout.json');
        $layout = file_exists($layoutPath)
            ? json_decode(file_get_contents($layoutPath), true)
            : $this->defaultLayout();

        $frontTemplatePath = file_exists(resource_path('images/template_field_study_front.png'))
            ? resource_path('images/template_field_study_front.png')
            : resource_path('images/Foundation.png');
        $frontBase64 = file_exists($frontTemplatePath)
            ? base64_encode(file_get_contents($frontTemplatePath))
            : null;

        $requestedTrack = $req->query('track');
        $rawCourseTitle = $cert->enrollment->course->title ?? '';
        $levelName = $cert->enrollment->course->certificationLevel->name ?? '';
        $levelCode = $cert->enrollment->course->certificationLevel->code ?? '';

        if ($requestedTrack) {
            $courseSlug = $requestedTrack;
            $isFoundation = ($courseSlug === 'foundation');
        } else {
            $isFoundation = str_contains(strtolower($rawCourseTitle), 'foundation')
                || str_contains(strtolower($levelName), 'foundation')
                || strtolower($levelCode) === 'fnd'
                || strtolower($levelCode) === 'foundation';
            $courseSlug = $cert->enrollment->course->slug ?? '';
        }

        $blankBackPath = resource_path('images/template_fs_back_blank.png');
        if (file_exists($blankBackPath)) {
            $backTemplatePath = $blankBackPath;
        } else {
            $specFsBackPath = resource_path("images/template_fs_back_{$courseSlug}.png");
            $backTemplatePath = file_exists($specFsBackPath)
                ? $specFsBackPath
                : (file_exists(resource_path('images/template_field_study_back.png'))
                    ? resource_path('images/template_field_study_back.png')
                    : resource_path('images/Foundation (2).png'));
        }
        $backBase64 = file_exists($backTemplatePath)
            ? base64_encode(file_get_contents($backTemplatePath))
            : null;

        $customDate = request()->query('date') ? new \DateTime(request()->query('date')) : null;
        $regNo = $req->query('reg_no') ?: $this->certService->getCbetcRegNoForCertificate($cert, $customDate);

        $viewName = view()->exists('certificates.template_field_study')
            ? 'certificates.template_field_study'
            : 'certificates.template_critical_thinking';

        $curriculum = $this->certService->getCurriculumForCourse($cert->enrollment->course, 'field_study');

        $pdf = Pdf::loadView($viewName, [
            'certificate' => $cert,
            'user' => $cert->user,
            'course' => $cert->enrollment->course,
            'courseSlug' => $courseSlug,
            'regNo' => $regNo,
            'templateFrontBase64' => $frontBase64,
            'templateBackBase64' => $backBase64,
            'layout' => $layout,
            'curriculum' => $curriculum,
        ])->setPaper('a4', 'landscape');

        $filename = $this->certService->generateCertificateFileName($cert, 'field_study', $regNo);

        return $pdf->download($filename);
    }

    /** Buat mock certificate untuk keperluan preview unduh PDF di Template Designer saat database kosong */
    private function sampleCertificate(Request $request): Certificate
    {
        $track = $request->query('track', 'foundation');
        $type = $request->query('type');
        $isFnd = ($track === 'foundation');
        
        $specMap = [
            'blue-business-development' => ['title' => 'Blue Business Development', 'acronym' => 'CBEc. (BizDev.)', 'code' => 'BZD'],
            'blue-carbon'               => ['title' => 'Blue Carbon',               'acronym' => 'CBEc. (Carb.)',    'code' => 'BCB'],
            'blue-community-development'=> ['title' => 'Blue Community Development','acronym' => 'CBEc. (CommDev.)', 'code' => 'BCD'],
            'blue-circular-economy'     => ['title' => 'Blue Circular Economy',     'acronym' => 'CBEc. (CirEc.)',   'code' => 'BCE'],
            'blue-data-intelligence'    => ['title' => 'Blue Data Intelligence',    'acronym' => 'CBEc. (DataIntel.)','code' => 'BDI'],
            'blue-energy'               => ['title' => 'Blue Energy',               'acronym' => 'CBEc. (Ener.)',    'code' => 'BEC'],
            'blue-farming'              => ['title' => 'Blue Farming',              'acronym' => 'CBEc. (Farm.)',    'code' => 'BFM'],
            'blue-finance'              => ['title' => 'Blue Finance',              'acronym' => 'CBEc. (Fin.)',     'code' => 'BFN'],
            'blue-food'                 => ['title' => 'Blue Food',                 'acronym' => 'CBEc. (Food.)',    'code' => 'BFD'],
            'blue-port'                 => ['title' => 'Blue Port',                 'acronym' => 'CBEc. (Port.)',    'code' => 'BPT'],
            'blue-shipping'             => ['title' => 'Blue Shipping',             'acronym' => 'CBEc. (Ship.)',    'code' => 'BSP'],
            'blue-tourism'              => ['title' => 'Blue Tourism',              'acronym' => 'CBEc. (Tour.)',    'code' => 'BTR'],
        ];

        if ($type === 'critical_thinking' || $type === 'field_study') {
            $trackTitle = $isFnd
                ? 'International Blue Economist Certification Training Course'
                : 'International Blue Economist Certification Training Course - ' . ucwords(str_replace(['blue-', '-'], ['Blue ', ' '], $track)) . ' Specialization';
            $levelCode = $isFnd ? 'FND' : 'SPEC';
            $levelName = $isFnd ? 'Foundation Level' : 'Specialization Level';
            $serialNumber = $request->query('reg_no', $request->query('serial', 'CBETC001062026'));
        } else {
            // Certificate of Competence
            if ($isFnd) {
                $trackTitle = 'Certified Blue Economist (CBEc) — Foundation Level';
                $levelCode = 'FND';
                $levelName = 'Foundation Level';
                $serialNumber = $request->query('serial', 'CBEC/ID/VI/20260001');
            } else {
                $spec = $specMap[$track] ?? [
                    'title' => ucwords(str_replace(['blue-', '-'], ['Blue ', ' '], $track)),
                    'acronym' => 'CBEc. (Spec.)',
                    'code' => 'SPEC',
                ];
                $trackTitle = "Certified Blue Economist in {$spec['title']} - {$spec['acronym']}";
                $levelCode = 'SPEC';
                $levelName = 'Specialization Level';
                $serialNumber = $request->query('serial', "CBEC/{$spec['code']}/ID/VI/20260001");
            }
        }

        $course = new Course([
            'title' => $trackTitle,
            'slug' => $track,
        ]);
        $level = new CertificationLevel([
            'name' => $levelName,
            'code' => $levelCode,
        ]);
        $course->setRelation('certificationLevel', $level);

        $enrollment = new Enrollment();
        $enrollment->setRelation('course', $course);

        $sampleName = $request->query('name', 'Nabila Azzahro Widodo');
        $user = new User([
            'name' => $sampleName,
            'email' => 'sample@digibluecamp.id',
        ]);

        $cert = new Certificate([
            'serial_number' => $serialNumber,
            'serial_url_key' => 'sample-preview-cert',
            'date_of_issue' => now()->toDateString(),
            'place_of_issue' => 'Jakarta, Indonesia',
            'grade' => 'Excellent',
        ]);
        $cert->id = 1;
        $cert->setRelation('user', $user);
        $cert->setRelation('enrollment', $enrollment);

        return $cert;
    }

    /* ──────────────────────────────────────────────
       TEMPLATE DESIGNER
    ────────────────────────────────────────────── */

    /** Default field layout dalam mm (A4 landscape: 297 × 210 mm) */
    private function defaultLayout(): array
    {
        return [
            'serial_no' => ['top' => 13.0, 'right' => 16.5, 'width' => 105, 'font_size' => 11.0, 'label' => 'Nomor Seri'],
            'recipient_name' => ['top' => 69.5, 'left' => 0, 'font_size' => 32.5, 'label' => 'Nama Peserta'],
            'ribbon_text' => ['top' => 100.5, 'left' => 0, 'height' => 14.0, 'font_size' => 22.5, 'color' => '#173874', 'label' => 'Teks Spesialisasi (Ribbon Emas)'],
            'level_value' => ['top' => 124.5, 'left' => 0, 'font_size' => 14.5, 'label' => 'Level Sertifikasi'],
            'meta_block' => ['top' => 137.5, 'left' => 98.5, 'width' => 100, 'font_size' => 8.5, 'label' => 'Info Grade, Tanggal Terbit, Expiry, & Tempat'],
            'qr_left' => ['top' => 147.5, 'left' => 67.0, 'size' => 26, 'label' => 'Barcode / QR Kiri'],
            'qr_right' => ['top' => 147.5, 'left' => 196.4, 'size' => 26, 'label' => 'Barcode / QR Kanan'],
            'back_title' => ['top' => 20.0, 'left' => 0, 'font_size' => 15.0, 'label' => 'Judul Halaman Belakang'],

            // Critical Thinking & Field Study / Completion template fields
            // Critical Thinking & Field Study / Completion template fields
            'fs_recipient_name' => ['top' => 70.0, 'left' => 0, 'font_size' => 33.0, 'label' => 'Critical Thinking: Nama Peserta'],
            'fs_course_title' => ['top' => 108.5, 'left' => 0, 'font_size' => 19.0, 'label' => 'Critical Thinking: Judul Pelatihan'],
            'fs_date_participation' => ['top' => 134.5, 'left' => 0, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tanggal Partisipasi'],
            'fs_date_issue' => ['top' => 141.5, 'left' => 0, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tempat & Tanggal Terbit'],
            'fs_back_title' => ['top' => 14.5, 'left' => 0, 'font_size' => 16.0, 'label' => 'Field Study Belakang: Judul Kurikulum'],
            'fs_back_name' => ['top' => 25.5, 'left' => 19.0, 'font_size' => 11.0, 'label' => 'Field Study Belakang: Nama', 'prefix' => 'Name : '],
            'fs_back_reg_no' => ['top' => 30.8, 'left' => 19.0, 'font_size' => 11.0, 'label' => 'Field Study Belakang: No. Reg', 'prefix' => 'Registration Number : '],

            // Alias ct_
            'ct_recipient_name' => ['top' => 70.0, 'left' => 0, 'font_size' => 33.0, 'label' => 'Critical Thinking: Nama Peserta'],
            'ct_course_title' => ['top' => 108.5, 'left' => 0, 'font_size' => 19.0, 'label' => 'Critical Thinking: Judul Pelatihan'],
            'ct_date_participation' => ['top' => 134.5, 'left' => 0, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tanggal Partisipasi'],
            'ct_date_issue' => ['top' => 141.5, 'left' => 0, 'font_size' => 14.0, 'label' => 'Critical Thinking: Tempat & Tanggal Terbit'],
            'ct_back_title' => ['top' => 14.5, 'left' => 0, 'font_size' => 16.0, 'label' => 'Field Study Belakang: Judul Kurikulum'],
            'ct_back_name' => ['top' => 25.5, 'left' => 19.0, 'font_size' => 11.0, 'label' => 'Field Study Belakang: Nama', 'prefix' => 'Name : '],
            'ct_back_reg_no' => ['top' => 30.8, 'left' => 19.0, 'font_size' => 11.0, 'label' => 'Field Study Belakang: No. Reg', 'prefix' => 'Registration Number : '],
        ];
    }

    /** Default curriculum data */
    private function defaultCurriculum(): array
    {
        return [
            'foundation' => [
                'title' => 'CURRICULUM STRUCTURE',
                'modules' => [
                    [
                        'no' => 1,
                        'title' => 'Integrated Blue Economy and Ocean Governance',
                        'topics' => [
                            'Integrated frameworks and global principles of blue economy governance',
                            'Cross-sector coordination among fisheries, energy, and maritime industries',
                            'Inclusive and transparent governance models for sustainable ocean management',
                            'Best practices in policy implementation and stakeholder collaboration',
                            'Indonesia\'s role in global ocean governance initiatives',
                        ],
                        'hours' => '5',
                    ],
                    [
                        'no' => 2,
                        'title' => 'Blue Industry and ESG Alignment',
                        'topics' => [
                            'ESG (Environmental, Social, and Governance) principles in marine-based sectors',
                            'Sustainability standards and responsible business frameworks in blue industries',
                            'ESG-driven innovations across fisheries, aquaculture, shipping, and tourism',
                            'Risk management and sustainability reporting mechanisms',
                            'Investment trends and opportunities in ESG-aligned blue enterprises',
                        ],
                        'hours' => '5',
                    ],
                    [
                        'no' => 3,
                        'title' => 'Blue Ecosystem and Resources Valuation',
                        'topics' => [
                            'Assessment of key ecosystem services in marine and coastal environments',
                            'Valuation methods to quantify the economic and ecological benefits of blue ecosystems',
                            'Natural capital accounting into sustainable ocean policies and strategies',
                            'Real-world examples of ecosystem-based management and valuation',
                            'Valuation outcomes to inform blue economy investment and conservation planning',
                        ],
                        'hours' => '5',
                    ],
                    [
                        'no' => 4,
                        'title' => 'Blue Economy Field Study',
                        'topics' => [
                            'Practical insights into sustainable marine and coastal resource management through direct field observation, case studies, and applied learning activities',
                            'Systems thinking for sustainable marine and coastal development',
                            'Problem-solving for real-world blue economy challenges',
                        ],
                        'hours' => '15',
                    ],
                ],
                'total_hours' => '30',
                'total_credits' => '1.5 ECTS',
            ],
        ];
    }

    /** Ambil kurikulum saat ini */
    public function getCurriculum(): JsonResponse
    {
        $path = storage_path('app/cert_curriculum.json');
        $curriculum = file_exists($path)
            ? json_decode(file_get_contents($path), true)
            : $this->defaultCurriculum();

        return response()->json(['data' => $curriculum]);
    }

    /** Simpan kurikulum baru */
    public function saveCurriculum(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'curriculum' => 'required|array',
        ]);

        $path = storage_path('app/cert_curriculum.json');
        file_put_contents($path, json_encode($validated['curriculum'], JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'Kurikulum sertifikat berhasil disimpan.',
            'data' => $validated['curriculum'],
        ]);
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

        $fsFrontPath = file_exists(resource_path('images/template_field_study_front.png'))
            ? resource_path('images/template_field_study_front.png')
            : $ctFrontPath;
        $fsFrontBase64 = file_exists($fsFrontPath)
            ? base64_encode(file_get_contents($fsFrontPath))
            : null;

        $fsBackPath = file_exists(resource_path('images/template_field_study_back.png'))
            ? resource_path('images/template_field_study_back.png')
            : $ctBackPath;
        $fsBackBase64 = file_exists($fsBackPath)
            ? base64_encode(file_get_contents($fsBackPath))
            : null;

        $specBacks = [];
        $specFiles = glob(resource_path('images/template_cbec_back_*.png'));
        if ($specFiles) {
            foreach ($specFiles as $sFile) {
                $fName = basename($sFile);
                if (preg_match('/template_cbec_back_(.+)\.png$/', $fName, $matches)) {
                    $specBacks[$matches[1]] = base64_encode(file_get_contents($sFile));
                }
            }
        }

        $fsBacks = [];
        $fsFiles = glob(resource_path('images/template_fs_back_*.png'));
        if ($fsFiles) {
            foreach ($fsFiles as $fFile) {
                $fName = basename($fFile);
                if (preg_match('/template_fs_back_(.+)\.png$/', $fName, $matches)) {
                    $fsBacks[$matches[1]] = base64_encode(file_get_contents($fFile));
                }
            }
        }

        return response()->json([
            'data' => [
                'base64' => base64_encode(file_get_contents($templatePath)),
                'mime_type' => $mimeType,
                'foundation_base64' => $foundBase64,
                'back_base64' => $backBase64,
                'back_mime_type' => 'image/png',
                'critical_thinking_front_base64' => $ctFrontBase64,
                'critical_thinking_back_base64' => $ctBackBase64,
                'field_study_front_base64' => $fsFrontBase64,
                'field_study_back_base64' => $fsBackBase64,
                'specialization_backs' => $specBacks,
                'field_study_backs' => $fsBacks,
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

        $course = null;
        if ($request->filled('enrollment_id')) {
            $enrollment = Enrollment::with('course.certificationLevel')->find($request->query('enrollment_id'));
            $course = $enrollment?->course;
        } elseif ($request->filled('course_id')) {
            $course = \App\Models\Course::with('certificationLevel')->find($request->query('course_id'));
        }

        $trackCode = $this->certService->getTrackCode($course);
        $sequence = $this->certService->getNextSequence($year, $trackCode);
        $serials = $this->certService->generateSerialNumbers($sequence, $dateObj, $trackCode);
        $cbetcRegNo = $this->certService->generateCbetcRegNo($sequence, $dateObj, $trackCode);

        return response()->json([
            'data' => [
                'next_sequence' => $sequence,
                'next_serial_number' => $serials['serial_number'],
                'next_serial_url_key' => $serials['serial_url_key'],
                'next_cbetc_reg_no' => $cbetcRegNo,
                'track_code' => $trackCode,
            ],
        ]);
    }
}

