<?php

namespace App\Jobs;

use App\Models\Certificate;
use App\Services\TheBlueEconomistService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncCertificateToTBEJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Jumlah percobaan retry jika koneksi terputus */
    public int $tries = 3;

    /** Waktu tunda sebelum retry bertahap (detik) */
    public array $backoff = [15, 60, 180];

    public function __construct(public Certificate $certificate)
    {
    }

    /**
     * Jalankan proses sinkronisasi ke The Blue Economist di background.
     */
    public function handle(TheBlueEconomistService $tbeService): void
    {
        Log::info("Menjalankan SyncCertificateToTBEJob untuk sertifikat #{$this->certificate->id}");
        $tbeService->syncCertificate($this->certificate);
    }

    /**
     * Tangani kegagalan permanen setelah semua retry habis.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("SyncCertificateToTBEJob gagal permanen untuk sertifikat #{$this->certificate->id}", [
            'error' => $exception->getMessage(),
        ]);
        $this->certificate->update(['sync_status' => 'failed']);
    }
}

