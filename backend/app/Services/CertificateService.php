<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * Generate dual serial numbers sesuai pola Digibluecamp:
     * - Display: CBEC/ID/IX/20260001
     * - URL Key:  CBECIDIX20260001HBB
     */
    public function generateSerialNumbers(int $sequence, \DateTime $date = null): array
    {
        $date      = $date ?? now();
        $year      = $date->format('Y');
        $monthRoman = $this->toRoman((int)$date->format('n'));
        $seq       = str_pad($sequence, 4, '0', STR_PAD_LEFT);

        $serialNumber = "CBEC/ID/{$monthRoman}/{$year}{$seq}";
        $serialUrlKey = "CBECID{$monthRoman}{$year}{$seq}" . strtoupper(Str::random(3));

        return [
            'serial_number'  => $serialNumber,
            'serial_url_key' => $serialUrlKey,
        ];
    }

    /**
     * Dapatkan sequence berikutnya (nomor urut sertifikat selanjutnya)
     */
    public function getNextSequence(): int
    {
        $last = Certificate::orderByDesc('id')->first();

        if (! $last) {
            return 1;
        }

        // Extract 4-digit sequence dari ujung serial_number
        preg_match('/(\d{4})$/', $last->serial_number, $matches);

        return isset($matches[1]) ? ((int)$matches[1]) + 1 : 1;
    }

    /**
     * Convert integer bulan ke angka Romawi
     */
    private function toRoman(int $month): string
    {
        $map = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
            5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
            9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
        ];

        return $map[$month] ?? 'I';
    }

    /**
     * Generate QR Code PNG dan simpan ke storage
     * Return: path relatif file QR
     */
    public function generateQrCode(string $serialUrlKey): string
    {
        $verificationUrl = config('app.tbe_base_url', 'https://theblueeconomist.org')
            . "/certification/{$serialUrlKey}";

        $qrPath = "certificates/qr/{$serialUrlKey}.png";

        \QrCode::format('png')
            ->size(300)
            ->errorCorrection('H')
            ->generate($verificationUrl, storage_path("app/public/{$qrPath}"));

        return $qrPath;
    }

    /**
     * Check apakah peserta memenuhi syarat untuk terbit sertifikat
     */
    public function isEligibleForCertificate(Enrollment $enrollment): array
    {
        $course = $enrollment->course;
        $level  = $course->certificationLevel;

        // Cek apakah semua submission sudah dinilai
        $ungradedSubmissions = $enrollment->user
            ->submissions()
            ->whereHas('content', fn($q) => $q->where('section_id', function ($q2) use ($course) {
                $q2->select('id')->from('course_sections')->where('course_id', $course->id);
            }))
            ->where('status', 'submitted')
            ->whereNull('score')
            ->count();

        if ($ungradedSubmissions > 0) {
            return ['eligible' => false, 'reason' => "Masih ada {$ungradedSubmissions} tugas yang belum dinilai."];
        }

        // Cek prasyarat Field Trip / Critical Thinking (hanya Foundation)
        if ($level->is_field_trip_required && ! $enrollment->attended_field_trip) {
            // Cek apakah Critical Thinking sudah dikerjakan & dinilai
            $critThinkingPassed = $enrollment->user
                ->submissions()
                ->whereHas('content', fn($q) => $q->where('content_type', 'critical_thinking'))
                ->where('status', 'graded')
                ->whereNotNull('score')
                ->exists();

            if (! $critThinkingPassed) {
                return [
                    'eligible' => false,
                    'reason'   => 'Peserta belum hadir Field Trip dan belum menyelesaikan modul Critical Thinking.',
                ];
            }
        }

        return ['eligible' => true, 'reason' => null];
    }
}
