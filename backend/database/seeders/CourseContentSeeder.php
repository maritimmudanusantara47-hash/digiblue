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
        // Foundation Level — CBEc
        $foundation = Course::where('slug', 'like', '%foundation%')->first();
        if ($foundation) {
            $this->seedFoundationLevel($foundation);
        } else {
            $this->command->warn('Foundation course not found. Skipping.');
        }

        // All Specialization Tracks
        $specs = Course::whereHas('certificationLevel', fn ($q) => $q->where('code', 'SPEC'))->get();
        foreach ($specs as $specCourse) {
            $this->seedSpecializationLevel($specCourse);
        }
    }

    private function seedFoundationLevel(Course $course): void
    {
        // ─── Seksi 1: Materi Pembelajaran ─────────────────────────────────────
        $sectionMateri = CourseSection::firstOrCreate([
            'course_id' => $course->id,
            'title'     => 'Materi Pembelajaran',
        ], ['order_index' => 1]);

        // Konten 1.1 — Video Pengantar
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Pengantar Blue Economy'],
            [
                'content_type' => 'video_embed',
                'embed_url'    => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // placeholder
                'instruction_text' => 'Simak video pengantar Blue Economy berikut untuk memahami konsep dasar.',
                'max_score'    => 0,
                'is_prerequisite' => true,
                'order_index'  => 1,
            ]
        );

        // Konten 1.2 — PDF Modul 1
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Modul 1: Konsep Dasar Blue Economy'],
            [
                'content_type' => 'pdf_module',
                'instruction_text' => 'Baca dan pahami modul ini sebelum mengerjakan kuis.',
                'max_score'    => 0,
                'is_prerequisite' => true,
                'order_index'  => 2,
            ]
        );

        // Konten 1.3 — PDF Modul 2
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Modul 2: Ekosistem Kelautan & Ekonomi'],
            [
                'content_type' => 'pdf_module',
                'instruction_text' => 'Pelajari keterkaitan antara ekosistem laut dan peluang ekonomi.',
                'max_score'    => 0,
                'is_prerequisite' => false,
                'order_index'  => 3,
            ]
        );

        // Konten 1.4 — Critical Thinking
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Critical Thinking: Potensi Ekonomi Laut Indonesia'],
            [
                'content_type'     => 'critical_thinking',
                'instruction_text' => "Setelah membaca kedua modul, tuliskan analisis kamu tentang:\n1. Apa potensi Blue Economy terbesar di Indonesia?\n2. Apa tantangan utama yang dihadapi?\n3. Solusi apa yang bisa diterapkan?\n\nMinimum 300 kata. Gunakan referensi dari materi yang telah dipelajari.",
                'max_score'    => 100,
                'is_prerequisite' => false,
                'order_index'  => 4,
            ]
        );

        // ─── Seksi 2: Ujian & Penilaian ───────────────────────────────────────
        $sectionUjian = CourseSection::firstOrCreate([
            'course_id' => $course->id,
            'title'     => 'Ujian & Penilaian',
        ], ['order_index' => 2]);

        // Konten 2.1 — MCQ Quiz
        $quiz = CourseContent::firstOrCreate(
            ['section_id' => $sectionUjian->id, 'title' => 'Kuis: Konsep Blue Economy'],
            [
                'content_type' => 'mcq_quiz',
                'instruction_text' => 'Jawab semua pertanyaan berikut. Nilai minimum kelulusan adalah 70.',
                'max_score'    => 100,
                'is_prerequisite' => false,
                'order_index'  => 1,
            ]
        );

        $this->seedQuizQuestions($quiz);

        // Konten 2.2 — Essay Task
        CourseContent::firstOrCreate(
            ['section_id' => $sectionUjian->id, 'title' => 'Tugas Esai: Implementasi Blue Economy'],
            [
                'content_type'     => 'essay_task',
                'instruction_text' => "Tuliskan esai dengan topik:\n\"Bagaimana Indonesia dapat mengimplementasikan prinsip Blue Economy secara berkelanjutan?\"\n\nPanduan:\n- Panjang esai: minimal 500 kata\n- Sertakan data atau fakta yang relevan\n- Berikan rekomendasi konkret",
                'max_score'    => 100,
                'is_prerequisite' => false,
                'order_index'  => 2,
            ]
        );

        // Konten 2.3 — Video Oral Exam
        CourseContent::firstOrCreate(
            ['section_id' => $sectionUjian->id, 'title' => 'Ujian Oral Video: Presentasi Blue Economy'],
            [
                'content_type'     => 'oral_video_task',
                'instruction_text' => "Rekam video presentasi (5-10 menit) dengan topik pilihan:\n1. Aquaculture sebagai pilar Blue Economy\n2. Pariwisata bahari berkelanjutan\n3. Energi terbarukan dari laut\n\nUpload ke YouTube (unlisted) atau Google Drive, lalu paste linknya.",
                'max_score'    => 100,
                'is_prerequisite' => false,
                'order_index'  => 3,
            ]
        );
    }

    private function seedSpecializationLevel(Course $course): void
    {
        $topic = $course->title; // e.g. "CBEc Specialization — The Blue Carbon"

        // ─── Seksi 1: Materi Spesialisasi ─────────────────────────────────────
        $sectionMateri = CourseSection::firstOrCreate([
            'course_id' => $course->id,
            'title'     => 'Materi Spesialisasi',
        ], ['order_index' => 1]);

        // Video Pengantar
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Pengantar: ' . $course->title],
            [
                'content_type'    => 'video_embed',
                'embed_url'       => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'instruction_text'=> 'Simak video pengantar untuk memahami konsep dasar spesialisasi ini.',
                'max_score'       => 0,
                'is_prerequisite' => true,
                'order_index'     => 1,
            ]
        );

        // Modul Utama
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Modul Utama: Konsep & Teori'],
            [
                'content_type'    => 'pdf_module',
                'instruction_text'=> 'Baca dan pahami modul utama ini sebelum mengerjakan tugas.',
                'max_score'       => 0,
                'is_prerequisite' => true,
                'order_index'     => 2,
            ]
        );

        // Modul Lanjutan
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Modul Lanjutan: Implementasi & Studi Kasus'],
            [
                'content_type'    => 'pdf_module',
                'instruction_text'=> 'Pelajari implementasi nyata dan studi kasus terkini.',
                'max_score'       => 0,
                'is_prerequisite' => false,
                'order_index'     => 3,
            ]
        );

        // Critical Thinking
        CourseContent::firstOrCreate(
            ['section_id' => $sectionMateri->id, 'title' => 'Critical Thinking: Analisis Mendalam'],
            [
                'content_type'     => 'critical_thinking',
                'instruction_text' => "Berdasarkan materi yang telah dipelajari, tuliskan analisis kritis kamu:\n1. Apa relevansi topik ini terhadap kondisi Indonesia saat ini?\n2. Apa tantangan dan peluang yang ada?\n3. Rekomendasikan langkah konkret yang bisa dilakukan.\n\nMinimum 300 kata dengan referensi dari modul yang dipelajari.",
                'max_score'       => 100,
                'is_prerequisite' => false,
                'order_index'     => 4,
            ]
        );

        // ─── Seksi 2: Ujian & Penilaian ───────────────────────────────────────
        $sectionUjian = CourseSection::firstOrCreate([
            'course_id' => $course->id,
            'title'     => 'Ujian & Penilaian',
        ], ['order_index' => 2]);

        // MCQ Quiz
        $quiz = CourseContent::firstOrCreate(
            ['section_id' => $sectionUjian->id, 'title' => 'Kuis: Uji Pemahaman Spesialisasi'],
            [
                'content_type'    => 'mcq_quiz',
                'instruction_text'=> 'Jawab semua pertanyaan. Nilai minimum kelulusan adalah 70.',
                'max_score'       => 100,
                'is_prerequisite' => false,
                'order_index'     => 1,
            ]
        );

        $this->seedSpecQuizQuestions($quiz, $course->slug);

        // Essay Task
        CourseContent::firstOrCreate(
            ['section_id' => $sectionUjian->id, 'title' => 'Tugas Esai: Proposal Inovasi'],
            [
                'content_type'     => 'essay_task',
                'instruction_text' => "Susunlah sebuah proposal singkat (500–800 kata) mengenai:\n\"Inovasi apa yang dapat kamu usulkan untuk mengembangkan sektor ini di Indonesia?\"\n\nSertakan:\n- Latar belakang permasalahan\n- Solusi inovatif yang diusulkan\n- Potensi dampak dan keberlanjutan\n- Rencana implementasi singkat",
                'max_score'       => 100,
                'is_prerequisite' => false,
                'order_index'     => 2,
            ]
        );

        // Oral Video Exam
        CourseContent::firstOrCreate(
            ['section_id' => $sectionUjian->id, 'title' => 'Ujian Oral Video: Presentasi Spesialisasi'],
            [
                'content_type'     => 'oral_video_task',
                'instruction_text' => "Rekam video presentasi (5–10 menit) mengenai topik yang kamu pilih dari spesialisasi ini.\n\nPersyaratan:\n- Gunakan slide atau visualisasi pendukung\n- Upload ke YouTube (unlisted) atau Google Drive\n- Paste link video di kolom jawaban\n- Presentasi dalam Bahasa Indonesia atau Inggris",
                'max_score'       => 100,
                'is_prerequisite' => false,
                'order_index'     => 3,
            ]
        );
    }

    private function seedSpecQuizQuestions(CourseContent $quiz, string $slug): void
    {
        // Generic 4-soal kuis untuk semua specialization
        $questions = [
            [
                'question' => 'Prinsip utama yang membedakan spesialisasi ini dari pendekatan konvensional adalah?',
                'options'  => [
                    ['Fokus pada profit jangka pendek tanpa memperhatikan lingkungan', false],
                    ['Integrasi keberlanjutan ekologis dengan pembangunan ekonomi', true],
                    ['Hanya mengutamakan pertumbuhan produksi', false],
                    ['Penggunaan teknologi tanpa mempertimbangkan dampak lingkungan', false],
                ],
            ],
            [
                'question' => 'Indonesia memiliki potensi besar di bidang kelautan karena?',
                'options'  => [
                    ['Populasi terbesar di dunia', false],
                    ['Letak geografis sebagai negara kepulauan terbesar dengan biodiversitas tinggi', true],
                    ['Memiliki teknologi kelautan paling maju', false],
                    ['Anggaran pemerintah terbesar untuk sektor kelautan', false],
                ],
            ],
            [
                'question' => 'SDG (Sustainable Development Goals) yang paling berkaitan dengan Blue Economy adalah?',
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
                    ['Eksploitasi maksimum untuk mencapai pertumbuhan ekonomi tertinggi', false],
                    ['Moratorium total semua kegiatan di laut', false],
                    ['Pengelolaan berbasis ekosistem dengan mempertimbangkan daya dukung alam', true],
                    ['Menyerahkan sepenuhnya kepada mekanisme pasar', false],
                ],
            ],
        ];

        foreach ($questions as $i => $qData) {
            $q = QuizQuestion::firstOrCreate(
                ['content_id' => $quiz->id, 'question_text' => $qData['question']],
                ['weight_score' => 25]
            );
            if ($q->options()->count() === 0) {
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

    private function seedQuizQuestions(CourseContent $quiz): void
    {
        // Soal 1
        $q1 = QuizQuestion::firstOrCreate(
            ['content_id' => $quiz->id, 'question_text' => 'Apa yang dimaksud dengan Blue Economy?'],
            ['weight_score' => 25]
        );
        if ($q1->options()->count() === 0) {
            QuizOption::insert([
                ['question_id' => $q1->id, 'option_text' => 'Ekonomi berbasis eksploitasi sumber daya laut secara besar-besaran', 'is_correct' => false],
                ['question_id' => $q1->id, 'option_text' => 'Ekonomi kelautan yang berkelanjutan dengan menjaga kesehatan ekosistem laut', 'is_correct' => true],
                ['question_id' => $q1->id, 'option_text' => 'Perdagangan produk berwarna biru di pasar internasional', 'is_correct' => false],
                ['question_id' => $q1->id, 'option_text' => 'Program subsidi pemerintah untuk nelayan', 'is_correct' => false],
            ]);
        }

        // Soal 2
        $q2 = QuizQuestion::firstOrCreate(
            ['content_id' => $quiz->id, 'question_text' => 'Sektor mana berikut yang BUKAN termasuk dalam Blue Economy?'],
            ['weight_score' => 25]
        );
        if ($q2->options()->count() === 0) {
            QuizOption::insert([
                ['question_id' => $q2->id, 'option_text' => 'Perikanan budidaya (aquaculture)', 'is_correct' => false],
                ['question_id' => $q2->id, 'option_text' => 'Pariwisata bahari', 'is_correct' => false],
                ['question_id' => $q2->id, 'option_text' => 'Pertambangan batu bara', 'is_correct' => true],
                ['question_id' => $q2->id, 'option_text' => 'Energi dari ombak laut', 'is_correct' => false],
            ]);
        }

        // Soal 3
        $q3 = QuizQuestion::firstOrCreate(
            ['content_id' => $quiz->id, 'question_text' => 'Indonesia memiliki garis pantai terpanjang ke berapa di dunia?'],
            ['weight_score' => 25]
        );
        if ($q3->options()->count() === 0) {
            QuizOption::insert([
                ['question_id' => $q3->id, 'option_text' => 'Pertama', 'is_correct' => false],
                ['question_id' => $q3->id, 'option_text' => 'Kedua', 'is_correct' => true],
                ['question_id' => $q3->id, 'option_text' => 'Ketiga', 'is_correct' => false],
                ['question_id' => $q3->id, 'option_text' => 'Keempat', 'is_correct' => false],
            ]);
        }

        // Soal 4
        $q4 = QuizQuestion::firstOrCreate(
            ['content_id' => $quiz->id, 'question_text' => 'SDG (Sustainable Development Goals) nomor berapa yang paling relevan dengan Blue Economy?'],
            ['weight_score' => 25]
        );
        if ($q4->options()->count() === 0) {
            QuizOption::insert([
                ['question_id' => $q4->id, 'option_text' => 'SDG 8: Decent Work and Economic Growth', 'is_correct' => false],
                ['question_id' => $q4->id, 'option_text' => 'SDG 13: Climate Action', 'is_correct' => false],
                ['question_id' => $q4->id, 'option_text' => 'SDG 14: Life Below Water', 'is_correct' => true],
                ['question_id' => $q4->id, 'option_text' => 'SDG 15: Life on Land', 'is_correct' => false],
            ]);
        }
    }
}
