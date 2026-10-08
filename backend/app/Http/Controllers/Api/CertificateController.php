<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateController extends Controller
{
    /** Student: List sertifikat milik user yang login */
    public function index(Request $request): JsonResponse
    {
        $certs = Certificate::with(['enrollment.course.certificationLevel'])
            ->where('user_id', $request->user()->id)
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
    public function download(int $id)
    {
        $cert = Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        $verificationUrl = config('app.tbe_base_url', 'https://theblueeconomist.org')
            . "/certification/{$cert->serial_url_key}";
        
        $qrSvg = QrCode::format('svg')->size(140)->generate($verificationUrl);
        $qrImageBase64 = base64_encode($qrSvg);

        // Load template background images as base64 for inline embedding in PDF
        $templatePath = file_exists(resource_path('images/template_CBEc.png'))
            ? resource_path('images/template_CBEc.png')
            : resource_path('images/cbectemplate.jpg');
        $templateBase64 = file_exists($templatePath)
            ? base64_encode(file_get_contents($templatePath))
            : null;

        $templateBackPath = resource_path('images/template_back.png');
        $templateBackBase64 = file_exists($templateBackPath)
            ? base64_encode(file_get_contents($templateBackPath))
            : null;

        $pdf = Pdf::loadView('certificates.template', [
            'certificate'        => $cert,
            'user'               => $cert->user,
            'course'             => $cert->enrollment->course,
            'level'              => $cert->enrollment->course->certificationLevel,
            'qrImageBase64'      => $qrImageBase64,
            'templateBase64'     => $templateBase64,
            'templateBackBase64' => $templateBackBase64,
        ])->setPaper('a4', 'landscape');

        $filename = "Sertifikat_{$cert->user->name}_{$cert->serial_number}.pdf";
        $filename = str_replace(['/', ' '], ['_', '_'], $filename);

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

        if (! $cert) {
            return response()->json([
                'valid'   => false,
                'message' => __('api.sertifikat_tidak_ditemukan_atau'),
            ], 404);
        }

        return response()->json([
            'valid'   => true,
            'message' => __('api.sertifikat_ini_valid_dan'),
            'data'    => [
                'recipient_name'    => $cert->user->name,
                'program_name'      => 'Certified Blue Economist (CBEc)',
                'level'             => $cert->enrollment->course->certificationLevel->name,
                'specialization'    => $cert->enrollment->course->title,
                'serial_number'     => $cert->serial_number,
                'grade'             => $cert->grade,
                'date_of_issue'     => $cert->date_of_issue,
                'place_of_issue'    => $cert->place_of_issue,
            ],
        ]);
    }
}
