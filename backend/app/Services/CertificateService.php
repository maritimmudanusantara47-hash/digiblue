<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateService
{
    /**
     * Dapatkan kode track 3 huruf sesuai peminatan/kursus
     * - Foundation: null
     * - Blue Business Development (BizDev): BZD
     * - Blue Carbon: BCB
     * - Blue Community Development: BCD
     * - Blue Circular Economy: BCE
     * - Blue Data Intelligence: BDI
     * - Blue Energy: BEC
     * - Blue Farming: BFM
     * - Blue Finance: BFN
     * - Blue Food: BFD
     * - Blue Shipping: BSP
     * - Blue Tourism: BTR
     * - Blue Port: BPT
     * - Executive / Lainnya: EXE
     */
    public function getTrackCode(?\App\Models\Course $course): ?string
    {
        if (!$course) {
            return null;
        }

        $title = strtolower($course->title ?? '');
        $slug  = strtolower($course->slug ?? '');
        $levelCode = strtolower($course->certificationLevel->code ?? '');

        if ($levelCode === 'fnd' || str_contains($slug, 'foundation') || str_contains($title, 'foundation')) {
            return null;
        }

        if (str_contains($slug, 'business') || str_contains($title, 'business') || str_contains($slug, 'bizdev') || str_contains($title, 'bizdev')) {
            return 'BZD';
        }
        if (str_contains($slug, 'carbon') || str_contains($title, 'carbon')) {
            return 'BCB';
        }
        if (str_contains($slug, 'community') || str_contains($title, 'community')) {
            return 'BCD';
        }
        if (str_contains($slug, 'circular') || str_contains($title, 'circular')) {
            return 'BCE';
        }
        if (str_contains($slug, 'data') || str_contains($title, 'data')) {
            return 'BDI';
        }
        if (str_contains($slug, 'energy') || str_contains($title, 'energy')) {
            return 'BEC';
        }
        if (str_contains($slug, 'farming') || str_contains($title, 'farming')) {
            return 'BFM';
        }
        if (str_contains($slug, 'finance') || str_contains($title, 'finance')) {
            return 'BFN';
        }
        if (str_contains($slug, 'food') || str_contains($title, 'food')) {
            return 'BFD';
        }
        if (str_contains($slug, 'shipping') || str_contains($title, 'shipping')) {
            return 'BSP';
        }
        if (str_contains($slug, 'tourism') || str_contains($title, 'tourism')) {
            return 'BTR';
        }
        if (str_contains($slug, 'port') || str_contains($title, 'port')) {
            return 'BPT';
        }
        if (str_contains($slug, 'executive') || str_contains($title, 'executive') || str_contains($slug, 'exe') || str_contains($title, 'exe')) {
            return 'EXE';
        }

        return null;
    }

    /**
     * Generate dual serial numbers sesuai pola Digibluecamp:
     * - Foundation:     CBEC/ID/{BULAN_ROMAWI}/{TAHUN}{URUTAN_4_DIGIT} (URL: CBECID{BULAN_ROMAWI}{TAHUN}{URUTAN}{3_RANDOM_CHARS})
     * - Specialization: CBEC/{TRACK}/ID/{BULAN_ROMAWI}/{TAHUN}{URUTAN_4_DIGIT} (URL: CBEC{TRACK}ID{BULAN_ROMAWI}{TAHUN}{URUTAN}{3_RANDOM_CHARS})
     */
    public function generateSerialNumbers(int $sequence, ?\DateTimeInterface $date = null, ?string $trackCode = null): array
    {
        $date       = $date ?? now();
        $year       = $date->format('Y');
        $monthRoman = $this->toRoman((int)$date->format('n'));
        $seq        = str_pad($sequence, 4, '0', STR_PAD_LEFT);
        $randomKey  = strtoupper(Str::random(3));

        if (!empty($trackCode)) {
            $serialNumber = "CBEC/{$trackCode}/ID/{$monthRoman}/{$year}{$seq}";
            $serialUrlKey = "CBEC{$trackCode}ID{$monthRoman}{$year}{$seq}{$randomKey}";
        } else {
            $serialNumber = "CBEC/ID/{$monthRoman}/{$year}{$seq}";
            $serialUrlKey = "CBECID{$monthRoman}{$year}{$seq}{$randomKey}";
        }

        return [
            'serial_number'  => $serialNumber,
            'serial_url_key' => $serialUrlKey,
        ];
    }

    /**
     * Generate Registration Number untuk sertifikat CBETC (Training Course / Field Study / Critical Thinking)
     * Format:
     * - Foundation:     CBETC{seq3}{month2}{year4}          contoh: CBETC001062026 atau CBETC112112025
     * - Specialization: CBETC{TRACK}{seq3}{month2}{year4}    contoh: CBETCBZD001052026, CBETCBSP001032026, CBETCBCB001112025, CBETCEXE001062026
     */
    public function generateCbetcRegNo(int $sequence, ?\DateTimeInterface $date = null, ?string $trackCode = null): string
    {
        $date  = $date ?? now();
        $year  = $date->format('Y');
        $month = $date->format('m');
        $seq   = str_pad($sequence, 3, '0', STR_PAD_LEFT);

        if (!empty($trackCode)) {
            return "CBETC{$trackCode}{$seq}{$month}{$year}";
        }

        return "CBETC{$seq}{$month}{$year}";
    }

    /**
     * Dapatkan CBETC Reg No untuk model Certificate
     * Mendukung custom date (dinamis sesuai tanggal cetak/terbit)
     */
    public function getCbetcRegNoForCertificate(Certificate $cert, ?\DateTimeInterface $customDate = null): string
    {
        $course = $cert->enrollment?->course;
        $trackCode = $this->getTrackCode($course);
        $issueDate = $customDate ?? ($cert->date_of_issue ? new \DateTime($cert->date_of_issue) : now());

        $seq = 1;
        $year = $issueDate->format('Y');

        if (preg_match('/' . $year . '(\d+)$/', $cert->serial_number, $ym)) {
            $seq = (int) $ym[1];
        } elseif (preg_match('/(\d{3,4})$/', $cert->serial_number, $matches)) {
            $seq = (int) $matches[1];
        }

        return $this->generateCbetcRegNo($seq, $issueDate, $trackCode);
    }

    /**
     * Dapatkan sequence berikutnya (nomor urut peserta selanjutnya per tahun dan track)
     * Dimulai dari default 0 peserta (sehingga peserta pertama adalah 1 / 0001 / 001)
     * Setiap ganti tahun, hitungan otomatis reset ke 0 lagi.
     */
    public function getNextSequence(?int $year = null, ?string $trackCode = null): int
    {
        $year = $year ?? (int)date('Y');

        $serials = Certificate::whereNotNull('serial_number')
            ->where('serial_number', 'like', "%{$year}%")
            ->pluck('serial_number');

        $maxSeq = 0;

        foreach ($serials as $sn) {
            $sn = trim((string)$sn);
            if (empty($sn)) {
                continue;
            }

            // Validasi kecocokan track
            if (!empty($trackCode)) {
                // Spesialisasi: harus memiliki /{trackCode}/ID/
                if (!preg_match('#/' . preg_quote($trackCode, '#') . '/ID/#i', $sn)) {
                    continue;
                }
            } else {
                // Foundation: format harus CBEC/ID/
                if (!preg_match('#^CBEC/ID/#i', $sn)) {
                    continue;
                }
            }

            // Pola: {year}(\d+) di akhir nomor seri
            if (preg_match('/' . $year . '(\d{1,6})$/', $sn, $matches)) {
                $seqVal = (int)$matches[1];
                if ($seqVal > $maxSeq) {
                    $maxSeq = $seqVal;
                }
            }
        }

        return $maxSeq + 1;
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

        $dateObj   = now();
        $year      = (int)$dateObj->format('Y');
        $trackCode = $this->getTrackCode($course);
        $sequence  = $this->getNextSequence($year, $trackCode);
        $serials   = $this->generateSerialNumbers($sequence, $dateObj, $trackCode);

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
