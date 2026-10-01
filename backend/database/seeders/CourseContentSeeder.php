<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CourseContent;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use Illuminate\Database\Seeder;

class CourseContentSeeder extends Seeder
{
    public function run(): void
    {
        // Simpan file_path yang mungkin sudah di-upload admin
        $existingModule = CourseContent::where('content_type', 'pdf_module')
            ->whereNotNull('file_path')
            ->first();
        $savedPdfPath = $existingModule?->file_path;

        // ─── Foundation Level — CBEc ────────────────────────────────────────────
        $foundation = Course::where('slug', 'like', '%foundation%')->first();
        if ($foundation) {
            // Hapus semua section + contents lama
            $foundation->sections()->delete();
            $this->seedFoundationLevel($foundation, $savedPdfPath);
            $this->command->info("Re-seeded Foundation course: {$foundation->title}");
        } else {
            $this->command->warn('Foundation course not found. Skipping.');
        }

        // ─── Specialization Tracks ──────────────────────────────────────────────
        $specs = Course::whereHas('certificationLevel', fn ($q) => $q->where('code', 'SPEC'))->get();
        foreach ($specs as $specCourse) {
            // Hapus section + contents lama dan re-seed sesuai format baru
            $specCourse->sections()->delete();
            $this->seedSpecializationLevel($specCourse);
            $this->command->info("Re-seeded Specialization course: {$specCourse->title}");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  FOUNDATION LEVEL
    // ═══════════════════════════════════════════════════════════════════════════

    private function seedFoundationLevel(Course $course, ?string $savedPdfPath = null): void
    {
        $section = CourseSection::create([
            'course_id'   => $course->id,
            'title'       => 'Foundation Level Program',
            'order_index' => 1,
        ]);

        // ── 1. Foundation Learning Modules ──────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'pdf_module',
            'title'            => 'Foundation Learning Modules',
            'file_path'        => $savedPdfPath,
            'instruction_text' => "Unduh dan pelajari modul pembelajaran Foundation Level berikut sebelum mengerjakan ujian.\n\nModul ini mencakup:\n• Konsep dasar Blue Economy & Ekonomi Kelautan\n• Ekosistem kelautan dan nilai ekonominya\n• Kebijakan & regulasi maritim Indonesia\n• SDG 14 dan hubungannya dengan Blue Economy\n\nBaca dengan seksama, catat poin-poin penting, dan siapkan dirimu untuk ujian.",
            'max_score'        => 0,
            'is_prerequisite'  => true,
            'order_index'      => 1,
        ]);

        // ── 2. Multiple-Choice Examination ──────────────────────────────────────
        $quiz = CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'mcq_quiz',
            'title'            => 'Multiple-Choice Examination — Foundation Level',
            'instruction_text' => "Kerjakan semua soal pilihan ganda berikut dengan teliti.\n\nPetunjuk Ujian:\n• Pilih satu jawaban yang paling tepat untuk setiap soal\n• Nilai minimum kelulusan: 70 dari 100\n• Jika belum lulus, kamu dapat mengulang ujian ini\n• Pastikan sudah membaca Learning Modules sebelum mengerjakan",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 2,
        ]);

        $this->seedFoundationQuizQuestions($quiz);

        // ── 3. Case-Study Essay Submission ──────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'essay_task',
            'title'            => 'Case-Study Essay Submission — Foundation Level',
            'instruction_text' => "Unduh soal studi kasus yang tersedia di bawah ini. Kerjakan dengan sebaik-baiknya, kemudian kumpulkan jawaban kamu melalui salah satu cara berikut:\n\n📎 Opsi 1 — Google Drive / OneDrive:\nUpload file jawaban kamu ke Google Drive, aktifkan akses \"Anyone with link\", lalu paste link-nya di kolom yang tersedia.\n\n📝 Opsi 2 — Tulis Langsung:\nKamu juga dapat menulis jawaban langsung di kolom teks yang disediakan.\n\nKetentuan:\n• Format: PDF atau DOCX\n• Panjang esai minimum: 500 kata\n• Sertakan analisis, data, dan rekomendasi konkret\n• Plagiarisme tidak ditoleransi",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 3,
        ]);

        // ── 4. Training Course (Field Study) ────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'field_study',
            'title'            => 'Training Course (Field Study)',
            'instruction_text' => "Field Study adalah komponen penting dari program Foundation Level DigiBlueCamp. Peserta akan diajak untuk mengunjungi lokasi-lokasi strategis terkait Blue Economy di Indonesia.\n\nApa yang akan kamu lakukan:\n🌊 Kunjungan lapangan ke kawasan pesisir / kawasan konservasi laut\n🤝 Diskusi dengan praktisi dan komunitas nelayan lokal\n📊 Pengumpulan data primer untuk Case-Study Essay Examination\n🎯 Presentasi temuan lapangan\n\nKonfirmasikan kehadiranmu di bawah ini. Jika kamu mengikuti Field Study, modul Case-Study Essay Examination — Critical Thinking tidak perlu dikerjakan.",
            'max_score'        => 0,
            'is_prerequisite'  => false,
            'order_index'      => 4,
        ]);

        // ── 5. Case-Study Essay Examination — Critical Thinking ─────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'critical_thinking',
            'title'            => 'Case-Study Essay Examination — Critical Thinking',
            'instruction_text' => "Modul ini diperuntukkan bagi peserta yang TIDAK mengikuti Field Study.\n\nJika kamu mengikuti Field Study, modul ini secara otomatis terkunci dan tidak perlu dikerjakan.\n\nUnduh soal studi kasus di bawah ini dan kerjakan sesuai petunjuk. Kumpulkan jawaban melalui link Google Drive atau tulis langsung di kolom yang tersedia.\n\nTopik Analisis:\n• Identifikasi permasalahan Blue Economy di Indonesia\n• Analisis data dan fakta yang relevan\n• Rekomendasi solusi berbasis bukti\n• Refleksi kritis terhadap kebijakan yang ada\n\nKetentuan:\n• Minimum 500 kata\n• Gunakan referensi ilmiah\n• Format: PDF / DOCX atau tulis langsung",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 5,
        ]);
    }

    private function seedFoundationQuizQuestions(CourseContent $quiz): void
    {
        $questions = [
            [
                'question' => 'Apa yang dimaksud dengan Blue Economy?',
                'options'  => [
                    ['Ekonomi berbasis eksploitasi sumber daya laut secara besar-besaran untuk profit maksimal', false],
                    ['Ekonomi kelautan yang berkelanjutan dengan menjaga kesehatan ekosistem laut', true],
                    ['Perdagangan produk berwarna biru di pasar internasional', false],
                    ['Program subsidi pemerintah untuk nelayan tradisional', false],
                ],
            ],
            [
                'question' => 'Sektor mana berikut yang TIDAK termasuk dalam Blue Economy?',
                'options'  => [
                    ['Perikanan budidaya (aquaculture)', false],
                    ['Pariwisata bahari berkelanjutan', false],
                    ['Pertambangan batu bara di darat', true],
                    ['Energi terbarukan dari ombak laut', false],
                ],
            ],
            [
                'question' => 'Indonesia memiliki garis pantai terpanjang ke berapa di dunia?',
                'options'  => [
                    ['Pertama', false],
                    ['Kedua', true],
                    ['Ketiga', false],
                    ['Keempat', false],
                ],
            ],
            [
                'question' => 'SDG (Sustainable Development Goals) nomor berapa yang paling relevan dengan kelestarian ekosistem laut?',
                'options'  => [
                    ['SDG 8: Decent Work and Economic Growth', false],
                    ['SDG 13: Climate Action', false],
                    ['SDG 14: Life Below Water', true],
                    ['SDG 15: Life on Land', false],
                ],
            ],
            [
                'question' => 'Prinsip utama pengelolaan sumber daya kelautan yang berkelanjutan adalah?',
                'options'  => [
                    ['Eksploitasi maksimum untuk pertumbuhan ekonomi tertinggi', false],
                    ['Moratorium total semua kegiatan ekonomi di laut', false],
                    ['Pengelolaan berbasis ekosistem dengan mempertimbangkan daya dukung alam', true],
                    ['Menyerahkan sepenuhnya kepada mekanisme pasar bebas', false],
                ],
            ],
            [
                'question' => 'Apa yang dimaksud dengan "Blue Carbon"?',
                'options'  => [
                    ['Bahan bakar fosil yang ditemukan di dasar laut', false],
                    ['Karbon yang diserap dan disimpan oleh ekosistem pesisir seperti mangrove dan lamun', true],
                    ['Emisi CO₂ dari industri perikanan', false],
                    ['Teknologi penangkapan karbon di atmosfer', false],
                ],
            ],
            [
                'question' => 'Lembaga internasional yang paling aktif mendorong Blue Economy secara global adalah?',
                'options'  => [
                    ['World Bank', false],
                    ['IMF (International Monetary Fund)', false],
                    ['FAO dan UNEP', true],
                    ['WHO (World Health Organization)', false],
                ],
            ],
            [
                'question' => 'Ekosistem pesisir mana yang dikenal sebagai "nursery ground" atau tempat berkembang biak ikan?',
                'options'  => [
                    ['Padang lamun (seagrass beds)', false],
                    ['Hutan mangrove', false],
                    ['Terumbu karang', false],
                    ['Semua pilihan di atas benar', true],
                ],
            ],
        ];

        foreach ($questions as $qData) {
            $q = QuizQuestion::create([
                'content_id'   => $quiz->id,
                'question_text'=> $qData['question'],
                'weight_score' => round(100 / count($questions), 2),
            ]);
            foreach ($qData['options'] as $opt) {
                QuizOption::create([
                    'question_id' => $q->id,
                    'option_text' => $opt[0],
                    'is_correct'  => $opt[1],
                ]);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SPECIALIZATION LEVEL
    // ═══════════════════════════════════════════════════════════════════════════

    private function seedSpecializationLevel(Course $course): void
    {
        $trackTitle = str_replace('CBEc Specialization — ', '', $course->title);

        $section = CourseSection::create([
            'course_id'   => $course->id,
            'title'       => 'Program Spesialisasi — ' . $trackTitle,
            'order_index' => 1,
        ]);

        // ── 1. Learning Module ──────────────────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'pdf_module',
            'title'            => 'Specialization Learning Modules — ' . $trackTitle,
            'instruction_text' => "Unduh dan pelajari modul spesialisasi {$trackTitle} berikut sebelum mengerjakan ujian dan tugas.\n\nModul ini mencakup:\n• Konsep dasar dan prinsip mendalam mengenai {$trackTitle}\n• Implementasi teknis dan operasional dalam konteks Blue Economy\n• Studi kasus best-practice nasional dan global\n• Analisis dampak lingkungan dan keberlanjutan ekonomi\n\nBaca dengan seksama, catat poin-poin penting, dan siapkan dirimu untuk ujian.",
            'max_score'        => 0,
            'is_prerequisite'  => true,
            'order_index'      => 1,
        ]);

        // ── 2. MCQ Exam ─────────────────────────────────────────────────────────
        $quiz = CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'mcq_quiz',
            'title'            => 'Multiple-Choice Examination — Specialization Level',
            'instruction_text' => "Kerjakan semua soal pilihan ganda spesialisasi {$trackTitle} berikut dengan teliti.\n\nPetunjuk Ujian:\n• Pilih satu jawaban yang paling tepat untuk setiap soal\n• Nilai minimum kelulusan: 70 dari 100\n• Jika belum lulus, kamu dapat mengulang ujian ini\n• Pastikan sudah membaca Learning Modules sebelum mengerjakan",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 2,
        ]);

        $this->seedSpecQuizQuestions($quiz, $trackTitle);

        // ── 3. Essay Task ───────────────────────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'essay_task',
            'title'            => 'Case-Study Essay Submission — Specialization Level',
            'instruction_text' => "Unduh soal studi kasus spesialisasi {$trackTitle} di bawah ini. Kerjakan dengan sebaik-baiknya, kemudian kumpulkan jawaban kamu melalui salah satu cara berikut:\n\n📎 Opsi 1 — Google Drive / OneDrive:\nUpload file jawaban kamu ke Google Drive, aktifkan akses \"Anyone with link\", lalu paste link-nya di kolom yang tersedia.\n\n📝 Opsi 2 — Tulis Langsung:\nKamu juga dapat menulis jawaban langsung di kolom teks yang disediakan.\n\nKetentuan:\n• Format file: PDF atau DOCX\n• Panjang esai minimum: 500 kata\n• Sertakan analisis berbasis data, bukti empiris, dan rekomendasi konkret untuk {$trackTitle}\n• Plagiarisme tidak ditoleransi",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 3,
        ]);

        // ── 4. Training Course (Field Study) ────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'field_study',
            'title'            => 'Training Course (Field Study)',
            'instruction_text' => "Field Study adalah komponen penting dari program spesialisasi {$trackTitle} DigiBlueCamp. Peserta akan diajak untuk berinteraksi langsung di lapangan dengan ekosistem maritim dan pelaku industri {$trackTitle} di Indonesia.\n\nApa yang akan kamu lakukan:\n🌊 Kunjungan lapangan ke lokasi implementasi {$trackTitle}\n🤝 Diskusi dengan praktisi, pakar kelautan, dan komunitas pesisir\n📊 Pengumpulan data primer untuk validasi proyek studi kasus\n🎯 Presentasi dan refleksi temuan lapangan\n\nKonfirmasikan kehadiranmu di bawah ini. Jika kamu mengikuti Field Study, modul Case-Study Essay Examination — Critical Thinking tidak perlu dikerjakan.",
            'max_score'        => 0,
            'is_prerequisite'  => false,
            'order_index'      => 4,
        ]);

        // ── 5. Case-Study Essay Examination — Critical Thinking ─────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'critical_thinking',
            'title'            => 'Case-Study Essay Examination — Critical Thinking',
            'instruction_text' => "Modul ini diperuntukkan bagi peserta spesialisasi {$trackTitle} yang TIDAK mengikuti program Field Study.\n\nJika kamu mengikuti Field Study, modul ini secara otomatis terkunci dan tidak perlu dikerjakan.\n\nUnduh soal studi kasus di bawah ini dan kerjakan analisis kritis secara mendalam terkait {$trackTitle}. Kumpulkan jawaban melalui link Google Drive atau tulis langsung di formulir yang tersedia.\n\nKetentuan:\n• Minimum 500 kata\n• Sertakan referensi ilmiah dan tinjauan kritis terhadap kebijakan/praktik terkini\n• Format file: PDF / DOCX atau tulis langsung",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 5,
        ]);
    }

    private function seedSpecQuizQuestions(CourseContent $quiz, string $trackTitle): void
    {
        $questions = [
            [
                'question' => "Prinsip utama yang membedakan pendekatan {$trackTitle} dalam Blue Economy dari pendekatan konvensional adalah?",
                'options'  => [
                    ['Fokus pada profit jangka pendek tanpa memperhatikan lingkungan', false],
                    ['Integrasi keberlanjutan ekologis dengan pembangunan ekonomi maritim yang berkeadilan', true],
                    ['Hanya mengutamakan pertumbuhan produksi semaksimal mungkin', false],
                    ['Penggunaan teknologi tanpa mempertimbangkan daya dukung ekosistem', false],
                ],
            ],
            [
                'question' => "Dalam konteks {$trackTitle}, apa pilar utama yang harus dijaga untuk mencapai keberlanjutan jangka panjang?",
                'options'  => [
                    ['Daya dukung lingkungan (carrying capacity) dan inklusi sosial masyarakat pesisir', true],
                    ['Eksploitasi sumber daya secara intensif sebelum regulasi diperketat', false],
                    ['Sentralisasi seluruh kegiatan usaha di tangan korporasi besar', false],
                    ['Pengurangan anggaran pemeliharaan habitat maritim', false],
                ],
            ],
            [
                'question' => "SDG yang menjadi acuan paling mendasar dalam implementasi {$trackTitle} adalah?",
                'options'  => [
                    ['SDG 1: No Poverty', false],
                    ['SDG 9: Industry, Innovation and Infrastructure', false],
                    ['SDG 14: Life Below Water & SDG 13: Climate Action', true],
                    ['SDG 17: Partnerships for the Goals', false],
                ],
            ],
            [
                'question' => "Langkah strategis pertama dalam menyusun roadmap implementasi {$trackTitle} di Indonesia adalah?",
                'options'  => [
                    ['Langsung meluncurkan proyek tanpa kajian baseline lingkungan', false],
                    ['Penilaian baseline sains, pemetaan pemangku kepentingan, dan mitigasi risiko ekologis', true],
                    ['Menunggu ketersediaan hibah internasional sepenuhnya', false],
                    ['Menyerahkan seluruh pengelolaan kepada entitas asing tanpa alih teknologi', false],
                ],
            ],
        ];

        foreach ($questions as $qData) {
            $q = QuizQuestion::create([
                'content_id'    => $quiz->id,
                'question_text' => $qData['question'],
                'weight_score'  => 25,
            ]);
            foreach ($qData['options'] as $opt) {
                QuizOption::create([
                    'question_id' => $q->id,
                    'option_text' => $opt[0],
                    'is_correct'  => $opt[1],
                ]);
            }
        }
    }
}
