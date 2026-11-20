<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Services\CertificateService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateController extends Controller
{
    public function __construct(
        private CertificateService $certService
    ) {}

    /** Student: List sertifikat milik user yang login (dengan auto-issue jika sudah eligible) */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Periksa apakah user memiliki enrollment yang sudah 100% tuntas tapi belum terbit sertifikat
        $enrollments = Enrollment::with(['course.certificationLevel', 'user'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['active', 'completed'])
            ->get();

        foreach ($enrollments as $enrollment) {
            /** @var Enrollment $enrollment */
            $this->certService->autoIssueCertificateIfEligible($enrollment);
        }

        $certs = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->where('user_id', $user->id)
            ->orderByDesc('date_of_issue')
            ->get();

        return response()->json(['data' => $certs]);
    }

    /** Student: Detail satu sertifikat */
    public function show(int $id): JsonResponse
    {
        $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        return response()->json(['data' => $cert]);
    }

    /** Student: Download PDF sertifikat */
    public function download(Request $request, int $id)
    {
        $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        return $this->generatePdfForCertificate($cert, $request);
    }

    /** Public: Download PDF sertifikat via serial URL key atau serial number */
    public function downloadPublic(Request $request, string $serialUrlKey)
    {
        $lookupKey = trim($serialUrlKey);
        $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->where(function ($q) use ($lookupKey) {
                $q->where('serial_url_key', $lookupKey)
                  ->orWhere('serial_number', $lookupKey);
            })
            ->firstOrFail();

        return $this->generatePdfForCertificate($cert, $request);
    }

    /** Helper: Render PDF untuk sertifikat */
    private function generatePdfForCertificate(Certificate $cert, Request $request)
    {
        $type = $request->query('type');
        if (! $type) {
            // Hanya fallback ke tipe sertifikat pelatihan jika nomor seri memang berawalan CBETC
            if (str_starts_with(strtoupper($cert->serial_number ?? ''), 'CBETC')) {
                $type = ($cert->enrollment && $cert->enrollment->attended_field_trip)
                    ? 'field_study'
                    : 'critical_thinking';
            }
        }

        if ($type === 'field_study') {
            if (! $cert->enrollment || ! $cert->enrollment->attended_field_trip) {
                return response()->json([
                    'message' => 'Peserta tidak terdaftar atau belum menyelesaikan Field Study.',
                ], 403);
            }

            $layoutPath = storage_path('app/cert_layout.json');
            $layout = file_exists($layoutPath)
                ? json_decode(file_get_contents($layoutPath), true)
                : [];

            $frontTemplatePath = file_exists(resource_path('images/template_field_study_front.png'))
                ? resource_path('images/template_field_study_front.png')
                : resource_path('images/Foundation.png');
            $frontBase64 = file_exists($frontTemplatePath)
                ? base64_encode(file_get_contents($frontTemplatePath))
                : null;

            $courseSlug = $cert->enrollment->course->slug ?? '';
            $blankBackPath = resource_path('images/template_fs_back_blank.png');
            $backTemplatePath = file_exists($blankBackPath)
                ? $blankBackPath
                : (file_exists(resource_path('images/template_field_study_back.png'))
                    ? resource_path('images/template_field_study_back.png')
                    : resource_path('images/Foundation (2).png'));
            $backBase64 = file_exists($backTemplatePath)
                ? base64_encode(file_get_contents($backTemplatePath))
                : null;

            $customDate = $request->query('date') ? new \DateTime($request->query('date')) : null;
            $regNo = $this->certService->getCbetcRegNoForCertificate($cert, $customDate);
            $curriculum = $this->certService->getCurriculumForCourse($cert->enrollment->course, 'field_study');

            $viewName = view()->exists('certificates.template_field_study')
                ? 'certificates.template_field_study'
                : 'certificates.template_critical_thinking';

            $pdf = Pdf::loadView($viewName, [
                'certificate'         => $cert,
                'user'                => $cert->user,
                'course'              => $cert->enrollment->course,
                'courseSlug'          => $courseSlug,
                'regNo'               => $regNo,
                'templateFrontBase64' => $frontBase64,
                'templateBackBase64'  => $backBase64,
                'layout'              => $layout,
                'curriculum'          => $curriculum,
            ])->setPaper('a4', 'landscape');

            $filename = $this->certService->generateCertificateFileName($cert, 'field_study', $regNo);

            if ($request->query('stream') === '1') {
                return $pdf->stream($filename);
            }

            return $pdf->download($filename);
        }

        if ($type === 'critical_thinking') {
            if (! $cert->enrollment || $cert->enrollment->attended_field_trip) {
                return response()->json([
                    'message' => 'Peserta mengikuti Field Study (bukan jalur Critical Thinking).',
                ], 403);
            }

            $layoutPath = storage_path('app/cert_layout.json');
            $layout = file_exists($layoutPath)
                ? json_decode(file_get_contents($layoutPath), true)
                : [];

            $frontTemplatePath = file_exists(resource_path('images/template_critical_thinking_front.png'))
                ? resource_path('images/template_critical_thinking_front.png')
                : (file_exists(resource_path('images/template_field_study_front.png'))
                    ? resource_path('images/template_field_study_front.png')
                    : resource_path('images/Foundation.png'));
            $frontBase64 = file_exists($frontTemplatePath)
                ? base64_encode(file_get_contents($frontTemplatePath))
                : null;

            $courseSlug = $cert->enrollment->course->slug ?? '';
            $blankBackPath = resource_path('images/template_fs_back_blank.png');
            $backTemplatePath = file_exists($blankBackPath)
                ? $blankBackPath
                : (file_exists(resource_path('images/template_critical_thinking_back.png'))
                    ? resource_path('images/template_critical_thinking_back.png')
                    : resource_path('images/Foundation (2).png'));
            $backBase64 = file_exists($backTemplatePath)
                ? base64_encode(file_get_contents($backTemplatePath))
                : null;

            $customDate = $request->query('date') ? new \DateTime($request->query('date')) : null;
            $regNo = $this->certService->getCbetcRegNoForCertificate($cert, $customDate);
            $curriculum = $this->certService->getCurriculumForCourse($cert->enrollment->course, 'critical_thinking');

            $viewName = view()->exists('certificates.template_critical_thinking')
                ? 'certificates.template_critical_thinking'
                : 'certificates.template_field_study';

            $pdf = Pdf::loadView($viewName, [
                'certificate'         => $cert,
                'user'                => $cert->user,
                'course'              => $cert->enrollment->course,
                'courseSlug'          => $courseSlug,
                'regNo'               => $regNo,
                'templateFrontBase64' => $frontBase64,
                'templateBackBase64'  => $backBase64,
                'layout'              => $layout,
                'curriculum'          => $curriculum,
            ])->setPaper('a4', 'landscape');

            $filename = $this->certService->generateCertificateFileName($cert, 'critical_thinking', $regNo);

            if ($request->query('stream') === '1') {
                return $pdf->stream($filename);
            }

            return $pdf->download($filename);
        }

        $verificationUrl = config('app.tbe_base_url', 'https://theblueeconomist.org')
            . "/certification/{$cert->serial_url_key}";
        
        $qrSvg = QrCode::format('svg')->size(140)->generate($verificationUrl);
        $qrImageBase64 = base64_encode($qrSvg);

        $courseTitle = $cert->enrollment->course->title ?? '';
        $levelName   = $cert->enrollment->course->certificationLevel->name ?? '';
        $levelCode   = $cert->enrollment->course->certificationLevel->code ?? '';

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

        if ($request->query('stream') === '1') {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }

    /** PUBLIC: Verifikasi sertifikat via serial URL key atau serial number */
    public function verify(Request $request, ?string $serialUrlKey = null): JsonResponse
    {
        $lookupKey = trim($serialUrlKey ?? $request->query('code', $request->query('serial', '')));

        if (! $lookupKey) {
            return response()->json([
                'valid'   => false,
                'message' => __('api.sertifikat_tidak_ditemukan_atau'),
            ], 404);
        }

            $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->where(function ($q) use ($lookupKey) {
                $q->where('serial_url_key', $lookupKey)
                  ->orWhere('serial_number', $lookupKey);
            })
            ->first();

        if (! $cert && str_starts_with(strtoupper($lookupKey), 'CBETC')) {
            $allCerts = Certificate::with(['user', 'enrollment.course.certificationLevel'])->get();
            foreach ($allCerts as $candidate) {
                if (strtoupper($this->certService->getCbetcRegNoForCertificate($candidate)) === strtoupper($lookupKey)) {
                    $cert = $candidate;
                    break;
                }
            }
        }

        if (! $cert) {
            return response()->json([
                'valid'   => false,
                'message' => __('api.sertifikat_tidak_ditemukan_atau'),
            ], 404);
        }

        $verificationUrl = config('app.tbe_base_url', 'https://theblueeconomist.org')
            . "/certification/{$cert->serial_url_key}";

        $qrSvg = (string) QrCode::format('svg')->size(140)->generate($verificationUrl);
        $qrImageBase64 = base64_encode($qrSvg);

        return response()->json([
            'valid'   => true,
            'message' => __('api.sertifikat_ini_valid_dan'),
            'data'    => [
                'recipient_name'    => $cert->user->name,
                'program_name'      => 'Certified Blue Economist (CBEc)',
                'level'             => $cert->enrollment->course->certificationLevel->name,
                'specialization'    => $cert->enrollment->course->title,
                'serial_number'     => $cert->serial_number,
                'serial_url_key'    => $cert->serial_url_key,
                'grade'             => $cert->grade,
                'date_of_issue'     => $cert->date_of_issue,
                'place_of_issue'    => $cert->place_of_issue,
                'verification_url'  => $verificationUrl,
                'qr_code_svg'       => $qrSvg,
                'qr_code_base64'    => $qrImageBase64,
                'pdf_download_url'  => url("api/v1/verify/{$cert->serial_url_key}/download"),
            ],
        ]);
    }
}
