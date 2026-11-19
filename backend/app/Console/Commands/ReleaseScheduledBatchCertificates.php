<?php

namespace App\Console\Commands;

use App\Models\Enrollment;
use App\Services\CertificateService;
use Illuminate\Console\Command;

class ReleaseScheduledBatchCertificates extends Command
{
    protected $signature = 'certificates:release-scheduled-batches';

    protected $description = 'Otomatis menerbitkan sertifikat untuk peserta batch yang tanggal terbit sertifikatnya telah tiba';

    public function handle(CertificateService $certService): int
    {
        $this->info('Memeriksa penerbitan sertifikat angkatan (batch) yang terjadwal...');

        $enrollments = Enrollment::whereIn('status', ['active', 'completed'])
            ->whereNotNull('batch_id')
            ->whereDoesntHave('certificate')
            ->whereHas('batch', function ($q) {
                $q->whereNotNull('certificate_issue_date')
                  ->where('certificate_issue_date', '<=', now()->toDateString());
            })
            ->with(['course.certificationLevel', 'user', 'batch'])
            ->get();

        if ($enrollments->isEmpty()) {
            $this->info('Tidak ada sertifikat batch yang perlu diterbitkan saat ini.');
            return Command::SUCCESS;
        }

        $issuedCount = 0;
        foreach ($enrollments as $enrollment) {
            $cert = $certService->autoIssueCertificateIfEligible($enrollment);
            if ($cert) {
                $issuedCount++;
                $this->line("  [OK] Sertifikat diterbitkan: {$enrollment->user->name} ({$enrollment->course->title} - {$enrollment->batch->batch_name})");
            }
        }

        $this->info("Penerbitan sertifikat selesai. {$issuedCount} sertifikat berhasil diterbitkan.");
        return Command::SUCCESS;
    }
}
