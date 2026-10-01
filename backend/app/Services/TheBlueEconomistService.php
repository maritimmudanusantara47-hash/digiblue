<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificateSyncLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TheBlueEconomistService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.the_blue_economist.url', ''), '/');
        $this->apiKey  = config('services.the_blue_economist.key', '');
    }

    /**
     * Push data sertifikat ke The Blue Economist API
     */
    public function syncCertificate(Certificate $certificate): bool
    {
        $enrollment = $certificate->enrollment;
        $course     = $enrollment->course;
        $level      = $course->certificationLevel;

        $payload = [
            'recipient_name'       => $certificate->user->name,
            'recipient_email'      => $certificate->user->email,
            'serial_number'        => $certificate->serial_number,
            'serial_url_key'       => $certificate->serial_url_key,
            'verification_url'     => "https://theblueeconomist.org/certification/{$certificate->serial_url_key}",
            'program_type'         => $level->name,
            'program_name'         => 'Certified Blue Economist (CBEc)',
            'specialization_track' => $level->code === 'SPEC' ? $course->title : null,
            'grade'                => $certificate->grade,
            'date_of_issue'        => $certificate->date_of_issue,
            'place_of_issue'       => $certificate->place_of_issue,
            'issued_by'            => 'The Blue Economist International Association',
        ];

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post("{$this->baseUrl}/api/v1/certificates", $payload);

            $success = $response->successful();

            // Log setiap percobaan sinkronisasi
            CertificateSyncLog::create([
                'certificate_id'   => $certificate->id,
                'status'           => $success ? 'success' : 'failed',
                'http_status_code' => $response->status(),
                'response_body'    => $response->body(),
                'error_message'    => $success ? null : "HTTP {$response->status()}: {$response->body()}",
                'attempted_at'     => now(),
            ]);

            if ($success) {
                $certificate->update([
                    'sync_status' => 'synced',
                    'synced_at'   => now(),
                ]);
            } else {
                $certificate->update(['sync_status' => 'failed']);
                Log::error('TBE Sync Failed', ['cert_id' => $certificate->id, 'response' => $response->body()]);
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
     * Re-sync semua sertifikat yang statusnya 'failed'
     */
    public function resyncFailed(): array
    {
        $failed = Certificate::where('sync_status', 'failed')->get();
        $results = ['success' => 0, 'failed' => 0];

        foreach ($failed as $cert) {
            $this->syncCertificate($cert) ? $results['success']++ : $results['failed']++;
        }

        return $results;
    }
}
