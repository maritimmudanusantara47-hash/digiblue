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
        // ─── Foundation Level — CBEc ────────────────────────────────────────────
        $foundation = Course::where('slug', 'like', '%foundation%')->first();
        if ($foundation) {
            // Hapus semua section + contents lama (cascade ke quiz_questions, quiz_options, submissions)
            $foundation->sections()->delete();
            $this->seedFoundationLevel($foundation);
        } else {
            $this->command->warn('Foundation course not found. Skipping.');
        }

        // ─── Specialization Tracks ──────────────────────────────────────────────
        $specs = Course::whereHas('certificationLevel', fn ($q) => $q->where('code', 'SPEC'))->get();
        foreach ($specs as $specCourse) {
            // Hanya seed jika belum ada konten
            if ($specCourse->sections()->count() === 0) {
                $this->seedSpecializationLevel($specCourse);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  FOUNDATION LEVEL
    // ═══════════════════════════════════════════════════════════════════════════

    private function seedFoundationLevel(Course $course): void
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

        foreach ($questions as $i => $qData) {
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
        $section = CourseSection::create([
            'course_id'   => $course->id,
            'title'       => 'Specialization Program',
            'order_index' => 1,
        ]);

        // 1. Learning Module
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'pdf_module',
            'title'            => 'Foundation Learning Modules',
            'instruction_text' => 'Pelajari modul spesialisasi ini sebelum mengerjakan ujian dan tugas.',
            'max_score'        => 0,
            'is_prerequisite'  => true,
            'order_index'      => 1,
        ]);

        // 2. MCQ Exam
        $quiz = CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'mcq_quiz',
            'title'            => 'Multiple-Choice Examination — Specialization Level',
            'instruction_text' => "Kerjakan semua soal pilihan ganda berikut. Nilai minimum kelulusan: 70 dari 100.",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 2,
        ]);

        $this->seedSpecQuizQuestions($quiz);

        // 3. Essay Task
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'essay_task',
            'title'            => 'Case-Study Essay Submission — Specialization Level',
            'instruction_text' => "Unduh soal studi kasus spesialisasi di bawah ini dan kerjakan sesuai petunjuk.\n\nKumpulkan jawaban via Google Drive (Anyone with link) atau tulis langsung. Minimum 500 kata.",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 3,
        ]);
    }

    private function seedSpecQuizQuestions(CourseContent $quiz): void
    {
        $questions = [
            [
                'question' => 'Prinsip utama yang membedakan pendekatan spesialisasi Blue Economy dari pendekatan konvensional adalah?',
                'options'  => [
                    ['Fokus pada profit jangka pendek tanpa memperhatikan lingkungan', false],
                    ['Integrasi keberlanjutan ekologis dengan pembangunan ekonomi', true],
                    ['Hanya mengutamakan pertumbuhan produksi semaksimal mungkin', false],
                    ['Penggunaan teknologi tanpa mempertimbangkan dampak lingkungan', false],
                ],
            ],
            [
                'question' => 'Indonesia memiliki potensi besar di bidang kelautan karena?',
                'options'  => [
                    ['Memiliki populasi terbesar di dunia', false],
                    ['Letak geografis sebagai negara kepulauan terbesar dengan biodiversitas tinggi', true],
                    ['Memiliki teknologi kelautan paling maju', false],
                    ['Anggaran pemerintah terbesar untuk sektor kelautan', false],
                ],
            ],
            [
                'question' => 'SDG yang paling berkaitan dengan Blue Economy adalah?',
                'options'  => [
                    ['SDG 1: No Poverty', false],
                    ['SDG 9: Industry, Innovation and Infrastructure', false],
                    ['SDG 14: Life Below Water', true],
                    ['SDG 17: Partnerships for the Goals', false],
                ],
            ],
            [
                'question' => 'Pendekatan yang tepat dalam mengelola sumber daya kelautan secara berkelanjutan adalah?',
                'options'  => [
                    ['Eksploitasi maksimum untuk pertumbuhan ekonomi tertinggi', false],
                    ['Moratorium total semua kegiatan di laut', false],
                    ['Pengelolaan berbasis ekosistem dengan mempertimbangkan daya dukung alam', true],
                    ['Menyerahkan sepenuhnya kepada mekanisme pasar bebas', false],
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
