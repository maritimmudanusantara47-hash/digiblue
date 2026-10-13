<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateService
{
    /**
     * Generate dual serial numbers sesuai pola Digibluecamp:
     * - Display: CBEC/ID/IX/20260001
     * - URL Key:  CBECIDIX20260001HBB
     */
    public function generateSerialNumbers(int $sequence, ?\DateTimeInterface $date = null): array
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
     * Memindai semua nomor seri yang ada di database untuk menemukan angka tertinggi
     * di belakang tahun (contoh: 20260187 -> sequence 187 -> urutan selanjutnya 188 / 0188).
     */
    public function getNextSequence(?int $year = null): int
    {
        $year = $year ?? (int)date('Y');

        $serials = Certificate::whereNotNull('serial_number')->pluck('serial_number');

        $maxSeq = 0;

        foreach ($serials as $sn) {
            $sn = trim((string)$sn);
            if (empty($sn)) {
                continue;
            }

            // Pola 1: Mencari tahun diikuti separator opsional lalu angka urut, contoh: 20260187, 2026/0187, 2026-0187
            if (preg_match('/' . $year . '[\/\-_]?(\d+)/', $sn, $matches)) {
                $seqVal = (int)$matches[1];
                if ($seqVal > $maxSeq) {
                    $maxSeq = $seqVal;
                }
            } elseif (preg_match('/(\d{4})$/', $sn, $matches)) {
                // Pola 2: Fallback 4 digit di akhir string jika tidak cocok dengan tahun spesifik
                $seqVal = (int)$matches[1];
                if ($seqVal > $maxSeq) {
                    $maxSeq = $seqVal;
                }
            }
        }

        return $maxSeq > 0 ? $maxSeq + 1 : 1;
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

        QrCode::format('png')
            ->size(300)
            ->errorCorrection('H')
            ->generate($verificationUrl, storage_path("app/public/{$qrPath}"));

        return $qrPath;
    }

    /**
     * Check apakah peserta memenuhi syarat untuk terbit sertifikat (100% tuntas)
     */
    public function isEligibleForCertificate(Enrollment $enrollment): array
    {
        $course = $enrollment->course;
        $level  = $course?->certificationLevel;

        if (!$course) {
            return ['eligible' => false, 'reason' => 'Kursus tidak ditemukan.'];
        }

        // Ambil semua konten wajib dalam kursus ini
        $allSections = $course->sections()->with('contents')->get();
        $allContents = $allSections->flatMap->contents;

        if ($allContents->isEmpty()) {
            return ['eligible' => false, 'reason' => 'Kursus belum memiliki konten materi.'];
        }

        $user = $enrollment->user;
        $submissions = $user->submissions()
            ->whereIn('content_id', $allContents->pluck('id'))
            ->get()
            ->keyBy('content_id');

        $isFieldTripAttended = (bool) $enrollment->attended_field_trip;

        foreach ($allContents as $content) {
            // Jika konten ini adalah field_study:
            if ($content->content_type === 'field_study') {
                // Kehadiran bersifat opsional.
                // Jika hadir (attended_field_trip = true), peserta berhak atas sertifikat field study tambahan dan modul critical thinking dibebaskan.
                // Jika tidak hadir, modul critical thinking wajib dikerjakan dan peserta tidak mendapatkan sertifikat field study.
                continue;
            }

            // Jika konten ini adalah critical_thinking:
            if ($content->content_type === 'critical_thinking') {
                if ($isFieldTripAttended) {
                    continue; // Peserta ikut field study, dibebaskan dari modul critical thinking
                }
                // Jika tidak ikut field study, critical thinking WAJIB dikerjakan & dinilai
                $sub = $submissions->get($content->id);
                if (!$sub || $sub->score === null) {
                    return [
                        'eligible' => false,
                        'reason'   => 'Modul Critical Thinking belum diselesaikan atau belum dinilai.',
                    ];
                }
                continue;
            }

            // Untuk semua tipe konten lainnya (pdf_module, video_embed, mcq_quiz, essay_task, oral_video_task):
            $sub = $submissions->get($content->id);
            if (!$sub) {
                return [
                    'eligible' => false,
                    'reason'   => "Materi '{$content->title}' belum diselesaikan.",
                ];
            }

            if ($sub->score === null) {
                return [
                    'eligible' => false,
                    'reason'   => "Tugas '{$content->title}' masih menunggu penilaian assessor.",
                ];
            }

            // Untuk MCQ, pastikan lulus (skor >= 70)
            if ($content->content_type === 'mcq_quiz' && (float)$sub->score < 70) {
                return [
                    'eligible' => false,
                    'reason'   => "Kuis '{$content->title}' belum mencapai nilai kelulusan minimal (70).",
                ];
            }
        }

        return ['eligible' => true, 'reason' => null];
    }

    /**
     * Otomatis terbitkan sertifikat jika enrollment sudah eligible (100% selesai)
     */
    public function autoIssueCertificateIfEligible(Enrollment $enrollment): ?Certificate
    {
        // Jika sudah punya sertifikat, kembalikan sertifikat existing
        $existing = Certificate::where('enrollment_id', $enrollment->id)->first();
        if ($existing) {
            return $existing;
        }

        $eligibility = $this->isEligibleForCertificate($enrollment);
        if (!$eligibility['eligible']) {
            return null;
        }

        // Hitung rata-rata nilai submission untuk menentukan grade
        $course = $enrollment->course;
        $avgScore = (float) ($enrollment->user->submissions()
            ->whereHas('content', function ($q) use ($course) {
                $q->whereHas('section', fn($s) => $s->where('course_id', $course->id));
            })
            ->whereNotNull('score')
            ->avg('score') ?? 85);

        $grade = 'Standard';
        if ($avgScore >= 90) {
            $grade = 'Excellent';
        } elseif ($avgScore >= 75) {
            $grade = 'Good';
        }

        $dateObj  = now();
        $year     = (int)$dateObj->format('Y');
        $sequence = $this->getNextSequence($year);
        $serials  = $this->generateSerialNumbers($sequence, $dateObj);

        $certificate = Certificate::create([
            'enrollment_id'  => $enrollment->id,
            'user_id'        => $enrollment->user_id,
            'serial_number'  => $serials['serial_number'],
            'serial_url_key' => $serials['serial_url_key'],
            'grade'          => $grade,
            'date_of_issue'  => $dateObj->toDateString(),
            'place_of_issue' => 'Jakarta, Indonesia',
            'sync_status'    => 'pending',
        ]);

        $enrollment->update(['status' => 'completed']);

        // Sinkronisasi otomatis ke The Blue Economist jika konfigurasi aktif
        try {
            app(TheBlueEconomistService::class)->syncCertificate($certificate);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Auto-sync certificate {$certificate->id} ke TBE gagal: " . $e->getMessage());
        }

        return $certificate;
    }
}
