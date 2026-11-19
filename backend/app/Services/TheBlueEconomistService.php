<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificateSyncLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TheBlueEconomistService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $rawUrl = config('services.the_blue_economist.url', 'https://backend.theblueeconomist.org');
        // Normalisasi URL: hilangkan trailing slash dan akhiran /api atau /api/v1 jika tidak sengaja tertulis
        $cleanUrl = preg_replace('/\/api(\/v\d+)?\/?$/i', '', rtrim($rawUrl, '/'));
        $this->baseUrl = !empty($cleanUrl) ? $cleanUrl : 'https://backend.theblueeconomist.org';
        $this->apiKey  = config('services.the_blue_economist.key', 'digiblue_secret_sync_key_2026');
    }

    /**
     * Push data sertifikat ke The Blue Economist API agar otomatis tersimpan di database TBE
     * dan dapat langsung diverifikasi di URL publik theblueeconomist.org/certification/{routeKey}.
     */
    public function syncCertificate(Certificate $certificate): bool
    {
        $user       = $certificate->user;
        $enrollment = $certificate->enrollment;
        $course     = $enrollment ? $enrollment->course : null;
        $level      = $course ? $course->certificationLevel : null;
        $levelName  = $level ? $level->name : 'Foundation Level';
        $isExecutive= ($level && $level->code === 'EXE');
        $verificationUrl = "https://theblueeconomist.org/certification/{$certificate->serial_url_key}";
        
        $issueDateFormatted = Carbon::parse($certificate->date_of_issue)->translatedFormat('d F Y');

        $payload = [
            // Kontrak utama TBE (sesuai skema tabel certificates di The Blue Economist)
            'route_key'            => $certificate->serial_url_key,
            'certificate_id'       => $certificate->serial_number,
            'holder_name'          => $user->name,
            'recipient_email'      => $user->email,
            'certification_name'   => 'Certified Blue Economist (CBEc)',
            'level'                => $levelName,
            'type'                 => $isExecutive ? 'Executive' : 'Regular',
            'issue_date'           => $issueDateFormatted,
            'grade'                => $certificate->grade,
            'specialization_track' => ($level && $level->code === 'SPEC') ? $course->title : null,
            'verification_url'     => $verificationUrl,
            'layout'               => 'new',
            'is_published'         => config('services.the_blue_economist.auto_publish', false),

            // Data profil tambahan untuk user mapping di TBE
            'phone_number'         => $user->phone_number,
            'institution'          => $user->institution,
            'country'              => $user->country ?? 'Indonesia',

            // Kompatibilitas mundur (Legacy PRD specification)
            'recipient_name'       => $user->name,
            'serial_number'        => $certificate->serial_number,
            'serial_url_key'       => $certificate->serial_url_key,
            'program_type'         => $levelName,
            'program_name'         => 'Certified Blue Economist (CBEc)',
            'date_of_issue'        => $certificate->date_of_issue,
            'place_of_issue'       => $certificate->place_of_issue ?? 'Jakarta, Indonesia',
            'issued_by'            => 'The Blue Economist International Association',
        ];

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(20)
                ->post("{$this->baseUrl}/api/v1/certificates", $payload);

            $success = $response->successful();
            $responseData = $response->json();

            // Log setiap percobaan sinkronisasi ke tabel audit
            CertificateSyncLog::create([
                'certificate_id'   => $certificate->id,
                'status'           => $success ? 'success' : 'failed',
                'http_status_code' => $response->status(),
                'response_body'    => $response->body(),
                'error_message'    => $success ? null : "HTTP {$response->status()}: {$response->body()}",
                'attempted_at'     => now(),
            ]);

            if ($success) {
                // Ambil ID hasil simpan dari The Blue Economist
                $tbeCertId = $responseData['data']['tbe_certificate_id'] ?? null;
                $tbeUserId = $responseData['data']['tbe_user_id'] ?? null;

                $certificate->update([
                    'tbe_certificate_id' => $tbeCertId,
                    'sync_status'        => 'synced',
                    'synced_at'          => now(),
                ]);

                // Simpan juga tbe_user_id ke data user di DigiBlue
                if ($tbeUserId && $user) {
                    $user->update([
                        'tbe_user_id' => $tbeUserId,
                    ]);
                }
            } else {
                $certificate->update(['sync_status' => 'failed']);
                Log::error('TBE Sync Failed', [
                    'cert_id'  => $certificate->id,
                    'status'   => $response->status(),
                    'response' => $response->body()
                ]);
            }

            return $success;

        } catch (\Exception $e) {
            CertificateSyncLog::create([
                'certificate_id' => $certificate->id,
                'status'         => 'failed',
                'error_message'  => $e->getMessage(),
                'attempted_at'   => now(),
            ]);

            $certificate->update(['sync_status' => 'failed']);
            Log::error('TBE Sync Exception', ['cert_id' => $certificate->id, 'error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Re-sync semua sertifikat yang statusnya 'failed' atau paksa semua jika $forceAll = true
     */
    public function resyncFailed(bool $forceAll = false): array
    {
        $certs = $forceAll
            ? Certificate::all()
            : Certificate::where('sync_status', 'failed')->get();

        $results = ['success' => 0, 'failed' => 0];

        foreach ($certs as $cert) {
            $this->syncCertificate($cert) ? $results['success']++ : $results['failed']++;
        }

        return $results;
    }
}
