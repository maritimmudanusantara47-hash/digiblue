<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CourseContent;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseContentSeeder extends Seeder
{
    public function run(): void
    {
        $existingModule = CourseContent::where('content_type', 'pdf_module')
            ->whereNotNull('file_path')
            ->first();
        $savedPdfPath = $existingModule?->file_path;

        DB::transaction(function () use ($savedPdfPath) {
            // ─── 1. Foundation Level — CBEc ─────────────────────────────────────────
            $foundation = Course::where('slug', 'like', '%foundation%')->first();
            if ($foundation) {
                $foundation->sections()->delete();
                $this->seedFoundationLevel($foundation, $savedPdfPath);
                $this->command->info("Re-seeded Foundation course: {$foundation->title}");
            } else {
                $this->command->warn('Foundation course not found. Skipping.');
            }

            // ─── 2. 10 Specialization Tracks (Hanya Modul & Essay, Tanpa MCQ) ───────
            $specs = Course::whereHas('certificationLevel', fn($q) => $q->where('code', 'SPEC'))->get();
            foreach ($specs as $specCourse) {
                $specCourse->sections()->delete();
                $this->seedSpecializationLevel($specCourse);
                $this->command->info("Re-seeded Specialization course: {$specCourse->title}");
            }

            // Clean up any remaining mcq_quiz contents on specialization courses
            CourseContent::where('content_type', 'mcq_quiz')
                ->whereHas('section.course.certificationLevel', fn($q) => $q->where('code', 'SPEC'))
                ->delete();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  FOUNDATION LEVEL
    // ═══════════════════════════════════════════════════════════════════════════

    private function seedFoundationLevel(Course $course, ?string $savedPdfPath = null): void
    {
        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => 'Foundation Level Program',
            'order_index' => 1,
        ]);

        // 1. Learning Modules
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'pdf_module',
            'title' => 'Foundation Learning Modules — Blue Economy Core',
            'file_path' => $savedPdfPath,
            'instruction_text' => "Unduh dan pelajari modul pembelajaran Foundation Level berikut sebelum mengerjakan ujian.\n\nModul ini mencakup:\n• Konsep dasar Blue Economy & Ekonomi Kelautan berkelanjutan\n• Ekosistem pesisir utama (mangrove, padang lamun, terumbu karang) dan nilai valuasinya\n• Target SDG 14 (Life Below Water) dan integrasi ke dalam kebijakan nasional\n• Kerangka hukum UNCLOS 1982, batas maritim, dan tata kelola perikanan WPPNRI\n• Pencegahan pencemaran laut, mikroplastik, serta instrumen Keuangan Biru Indonesia\n\nBaca dengan seksama, catat poin-poin penting, dan siapkan dirimu untuk ujian.",
            'max_score' => 0,
            'is_prerequisite' => true,
            'order_index' => 1,
        ]);

        // 2. Multiple-Choice Examination (30 Soal, Total Bobot 100 Poin)
        $quiz = CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'mcq_quiz',
            'title' => 'Multiple-Choice Examination — Foundation Level',
            'instruction_text' => "Kerjakan semua soal ujian pilihan ganda berikut dengan teliti.\n\nPetunjuk Ujian:\n• Terdiri dari 30 butir soal pilihan ganda seputar Blue Economy, Blue Carbon, Blue Finance, dan Tata Kelola Maritim.\n• Total bobot nilai ujian adalah 100 poin (Skala 0 - 100).\n• Nilai minimum kelulusan: 70 dari 100.\n• Pilih satu jawaban yang paling tepat (A, B, C, atau D).\n• Jika belum memenuhi batas kelulusan, Anda dapat mengulang ujian kembali.",
            'max_score' => 100,
            'is_prerequisite' => false,
            'order_index' => 2,
        ]);

        $this->seedFoundationQuestions($quiz);

        // 3. Case-Study Essay Submission
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'essay_task',
            'title' => 'Case-Study Essay Submission — Foundation Level',
            'instruction_text' => "### Studi Kasus: Valuasi Ekonomi Ekosistem Pesisir & Transisi Menuju Blue Economy Berkelanjutan di Teluk Tomini

#### Latar Belakang Masalah
Kawasan pesisir Teluk Tomini menghadapi ancaman degradasi habitat mangrove seluas 3.500 hektar akibat konversi ilegal menjadi tambak udang semi-intensif dan pembuangan limbah domestik tanpa pengolahan. Nelayan tradisional melaporkan penurunan hasil tangkapan sebesar 40% dalam 5 tahun terakhir, sementara abrasi pantai mulai mengancam permukiman desa pesisir. Di sisi lain, pemerintah daerah berkeinginan mengembangkan pariwisata bahari dan tambak budidaya berkelanjutan untuk meningkatkan pendapatan asli daerah (PAD).

#### Instruksi Pengerjaan Soal Esai:
Sebagai seorang kandidat *Certified Blue Economist (CBEc)*, Anda diminta menyusun analisis esai komprehensif (minimal 500 kata) yang menjawab 3 pertanyaan pokok berikut:

1. **Analisis Valuasi Ekonomi Total (TEV)**: Identifikasi dan jelaskan klasifikasi nilai ekonomi (Direct Use, Indirect Use, Option Value, dan Non-Use/Existence Value) yang hilang apabila ekosistem mangrove di kawasan tersebut terus terdegradasi.
2. **Desain Intervensi Kebijakan Berbasis Blue Economy**: Rancang strategi pengelolaan terpadu (Integrated Coastal Zone Management) yang menyelaraskan konservasi mangrove dengan kesejahteraan ekonomi masyarakat pesisir lokal dan pencapaian target SDG 14.
3. **Mekanisme Pembiayaan Berkelanjutan**: Usulkan skema pembiayaan (misalnya *payment for ecosystem services* / kredit karbon biru / kemitraan publik-swasta) untuk mendanai restorasi pesisir tanpa membebani APBD secara berlebih.

#### Petunjuk Pengumpulan:
- Ketik jawaban langsung pada kolom teks formulir esai (mendukung format Markdown), ATAU
- Unggah berkas dokumen tugas dalam format PDF/DOCX (maksimal 20 MB), ATAU
- Cantumkan tautan penyimpanan berkas (Google Drive / OneDrive) dengan izin akses *'Anyone with link can view'*.
- Penilaian dilakukan secara manual oleh Tim Asesor DigiBlueCamp berdasarkan ketajaman analisis, orisinalitas ide, dan kelayakan solusi.",
            'max_score' => 100,
            'is_prerequisite' => false,
            'order_index' => 3,
        ]);

        // 4. Training Course (Field Study)
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'field_study',
            'title' => 'Training Course (Field Study)',
            'instruction_text' => "Field Study adalah komponen praktikum lapangan terpadu program Foundation Level DigiBlueCamp.\n\nAktivitas Lapangan:\n🌊 Observasi habitat pesisir dan verifikasi baseline ekosistem mangrove/lamun\n🤝 Dialog interaktif dengan kelompok nelayan dan pengelola kawasan konservasi laut\n📊 Pengambilan data primer sosial-ekonomi pesisir\n🎯 Diskusi kelompok terarah (FGD) dan perumusan rekomendasi praktis\n\nSilakan konfirmasikan keikutsertaan Anda di bawah ini. Peserta yang mengikuti Field Study secara otomatis dibebaskan dari modul Critical Thinking Exam.",
            'max_score' => 0,
            'is_prerequisite' => false,
            'order_index' => 4,
        ]);

        // 5. Case-Study Essay Examination — Critical Thinking
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'critical_thinking',
            'title' => 'Case-Study Essay Examination — Critical Thinking',
            'instruction_text' => "### Ujian Analisis Kritis: Tata Kelola Perikanan Tangkap vs Kebijakan Kawasan Konservasi Laut (KKL) di Indonesia

*Catatan: Modul ini diperuntukkan khusus bagi peserta yang TIDAK mengikuti kegiatan Field Study.*

#### Latar Belakang Analisis
Penerapan Kebijakan Penangkapan Ikan Terukur (PIT) berbasis kuota di Wilayah Pengelolaan Perikanan Negara Republik Indonesia (WPPNRI) dan target perluasan Kawasan Konservasi Laut sebesar 30% pada tahun 2045 sering kali memicu perdebatan antara kepentingan peningkatan devisa negara dari ekspor perikanan dan perlindungan hak-hak nelayan skala kecil tradisional (Small-Scale Fisheries).

#### Tugas Peserta:
Susun naskah telaah kritis (minimal 500 kata) yang mengupas:
1. **Evaluasi Kritis Keseimbangan Ekologi dan Ekonomi**: Apakah kebijakan alokasi kuota perikanan saat ini sudah cukup melindungi stok ikan dari penangkapan berlebih (*overfishing*) dan memitigasi risiko *bycatch* satwa terancam punah?
2. **Keadilan Sosial & Kearifan Lokal**: Bagaimana regulasi kelautan nasional dapat mengakomodasi hak-hak masyarakat hukum adat laut (seperti kearifan Sasi, Awig-awig, dan Panglima Laot) agar tidak terpinggirkan oleh zona industri penangkapan skala besar?
3. **Rekomendasi Kebijakan**: Rekomendasikan 3 langkah konkret berbasis sains (*evidence-based policy*) untuk meningkatkan efektivitas pengawasan laut terhadap IUU Fishing di perairan kepulauan terluar Indonesia.",
            'max_score' => 100,
            'is_prerequisite' => false,
            'order_index' => 5,
        ]);
    }

    private function seedFoundationQuestions(CourseContent $quiz): void
    {
        $rawQuestions = [
            [
                'q' => 'What does the term Blue Economy primarily refer to?',
                'options' => [
                    ['Coastal housing development', false],
                    ['Sustainable use of ocean resources for economic growth', true],
                    ['Inland water infrastructure', false],
                    ['Maritime defense systems', false],
                ],
            ],
            [
                'q' => 'Gender equity in blue economy development is important because:',
                'options' => [
                    ['Women are not usually involved in fisheries', false],
                    ['It helps increase population in island nations', false],
                    ['Women play key roles in coastal economies and decision-making', true],
                    ['Men dominate marine professions', false],
                ],
            ],
            [
                'q' => 'Which of the following represents a sustainable blue business model?',
                'options' => [
                    ['Trawling in sensitive habitats', false],
                    ['Open-loop cruise ship discharge', false],
                    ['Eco-tourism with marine conservation focus', true],
                    ['Export-focused shark finning', false],
                ],
            ],
            [
                'q' => 'Marine biotechnology businesses often focus on:',
                'options' => [
                    ['Coral mining', false],
                    ['Deep-sea drilling', false],
                    ['Pharmaceutical products from marine organisms', true],
                    ['Oil-to-gas conversion', false],
                ],
            ],
            [
                'q' => 'What is a major challenge for small blue businesses?',
                'options' => [
                    ['Access to international waters', false],
                    ['Limited access to blue finance', true],
                    ['Overabundance of marine land', false],
                    ['High fish prices', false],
                ],
            ],
            [
                'q' => 'Certification schemes like the Marine Stewardship Council (MSC) help businesses by:',
                'options' => [
                    ['Increasing fishing rights', false],
                    ['Providing market credibility for sustainable practices', true],
                    ['Securing exclusive fishing zones', false],
                    ['Reducing taxes', false],
                ],
            ],
            [
                'q' => 'Which is an example of value addition in blue businesses?',
                'options' => [
                    ['Selling fresh fish only', false],
                    ['Processing tuna into ready-to-eat products', true],
                    ['Selling fish before weighing', false],
                    ['Avoiding labeling practices', false],
                ],
            ],
            [
                'q' => 'What is a blue bond?',
                'options' => [
                    ['Fishing permit', false],
                    ['Debt to build warships', false],
                    ['A financial instrument for marine sustainability projects', true],
                    ['Carbon credit substitute', false],
                ],
            ],
            [
                'q' => 'Which country issued the world’s first sovereign blue bond in 2018?',
                'options' => [
                    ['Indonesia', false],
                    ['Norway', false],
                    ['Seychelles', true],
                    ['Maldives', false],
                ],
            ],
            [
                'q' => 'Blue finance refers to:',
                'options' => [
                    ['Money from fossil fuel sectors', false],
                    ['Financial tools for sustainable ocean-based development', true],
                    ['Maritime tax', false],
                    ['Offshore tax', false],
                ],
            ],
            [
                'q' => 'What is a key principle of blue financing?',
                'options' => [
                    ['Linking returns to ecological sustainable oceans outcomes', true],
                    ['Short-term industrial expansion', false],
                    ['Increasing subsidies for trawling', false],
                    ['Centralizing ocean industry and tax', false],
                ],
            ],
            [
                'q' => 'Which SDG most closely aligns with the principles of the blue economy?',
                'options' => [
                    ['SDG 9', false],
                    ['SDG 1', false],
                    ['SDG 14', true],
                    ['SDG 5', false],
                ],
            ],
            [
                'q' => 'Which financial tool can help de-risk investment in blue economy startups?',
                'options' => [
                    ['Trade tariffs', false],
                    ['Blended blue finance', true],
                    ['Export licensing', false],
                    ['Fisheries stockpiling', false],
                ],
            ],
            [
                'q' => 'A key step in developing a blue economy project proposal is:',
                'options' => [
                    ['Estimating oil reserves', false],
                    ['Maximizing profit projections only', false],
                    ['Avoiding local consultation', false],
                    ['Conducting an environmental and social impact assessment', true],
                ],
            ],
            [
                'q' => 'What is a “bankable blue project”?',
                'options' => [
                    ['Any project in a coastal area', false],
                    ['A defense investment', false],
                    ['A financially viable, sustainable marine project', true],
                    ['A cruise ship expansion plan', false],
                ],
            ],
            [
                'q' => 'Which of these is part of blue project management best practices?',
                'options' => [
                    ['Ignore local knowledge', false],
                    ['Stakeholder engagement and sustainable monitoring', true],
                    ['Focus only on financial ROI', false],
                    ['Delay environmental reporting', false],
                ],
            ],
            [
                'q' => 'The success of blue investment relies on:',
                'options' => [
                    ['Military support', false],
                    ['Policy certainty of blue economy and good governance', true],
                    ['Port privatization', false],
                    ['Exclusive fishing rights', false],
                ],
            ],
            [
                'q' => 'PPPs (Public-Private Partnerships) in the blue economy are useful for:',
                'options' => [
                    ['Limiting foreign investment', false],
                    ['Avoiding regulatory processes', false],
                    ['Leveraging resources and sharing risks', true],
                    ['Promoting tax invasion', false],
                ],
            ],
            [
                'q' => 'What are “blue carbon ecosystems”?',
                'options' => [
                    ['Mountains and volcanoes', false],
                    ['Mangroves and seagrasses', true],
                    ['Turtle and Sharks', false],
                    ['Submerged pipelines', false],
                ],
            ],
            [
                'q' => 'Blue carbon refers to carbon stored in?',
                'options' => [
                    ['Marine mammals', false],
                    ['Oceans Pipelines', false],
                    ['Coastal and marine vegetated ecosystems', true],
                    ['Submarine', false],
                ],
            ],
            [
                'q' => 'Which blue carbon ecosystem is the most efficient at carbon sequestration?',
                'options' => [
                    ['Coral reef', false],
                    ['Sandbanks', false],
                    ['Algae', false],
                    ['Mangroves', true],
                ],
            ],
            [
                'q' => 'A threat to blue carbon ecosystems includes',
                'options' => [
                    ['Turtle and Sharks', false],
                    ['Eco-certification', false],
                    ['Fish exports', false],
                    ['Coastal urban development and marine pollution', true],
                ],
            ],
            [
                'q' => 'Which of the following is NOT a sector of the blue economy?',
                'options' => [
                    ['Aquaculture', false],
                    ['Maritime transport', false],
                    ['Marine biotechnology', false],
                    ['Fashion', true],
                ],
            ],
            [
                'q' => 'Protecting blue carbon ecosystems contributes to',
                'options' => [
                    ['Increasing oil reserves', false],
                    ['Climate change mitigation and adaptation', true],
                    ['Expanding shipping routes', false],
                    ['Enhancing ocean salinity', false],
                ],
            ],
            [
                'q' => 'The concept of the Blue Economy aims to:',
                'options' => [
                    ['Promote inclusive and sustainable ocean-based economies', true],
                    ['Maximize short-term exploitation of ocean resources', false],
                    ['Privatize international waters', false],
                    ['Focus solely on industrial fisheries', false],
                ],
            ],
            [
                'q' => 'Who popularized the modern interpretation of the Blue Economy in 2010?',
                'options' => [
                    ['Ban Ki-moon', false],
                    ['Gunter Pauli', true],
                    ['David Attenborough', false],
                    ['Will Martin', false],
                ],
            ],
            [
                'q' => 'A “Blue Society” promotes',
                'options' => [
                    ['Privatization of coastlines', false],
                    ['Equity, participation, and stewardship of marine resources', true],
                    ['Exclusive ocean zoning for industry', false],
                    ['Deep-sea mining prioritization', false],
                ],
            ],
            [
                'q' => 'Which community group is critical to the success of blue society development?',
                'options' => [
                    ['Coporations only', false],
                    ['Coastal communities and indigenous peoples', true],
                    ['Military forces', false],
                    ['Urban developers', false],
                ],
            ],
            [
                'q' => 'Marine spatial planning (MSP) supports blue societies by:',
                'options' => [
                    ['Increasing taxation in coastal regions', false],
                    ['Managing marine space equitably among users', true],
                    ['Promoting offshore oil fields', false],
                    ['Prioritizing tourism over traditional fishing', false],
                ],
            ],
            [
                'q' => 'The term “ocean stewardship” refers to:',
                'options' => [
                    ['Responsible and proactive care for marine ecosystems', true],
                    ['Fishing quota enforcement', false],
                    ['Maritime trade', false],
                    ['Taxation of coastal landowners', false],
                ],
            ],
        ];

        // Total 30 soal didistribusikan sehingga jumlah bobot tepat 100 poin (10 soal x 4 poin + 20 soal x 3 poin = 100 poin)
        $totalQuestions = count($rawQuestions);
        $remainder = 100 % $totalQuestions; // 10 soal bernilai 4 poin, sisanya bernilai 3 poin

        foreach ($rawQuestions as $idx => $qData) {
            $weight = intdiv(100, $totalQuestions) + ($idx < $remainder ? 1 : 0);

            $question = QuizQuestion::create([
                'content_id' => $quiz->id,
                'question_text' => $qData['q'],
                'weight_score' => $weight,
                'order_index' => $idx + 1,
            ]);

            foreach ($qData['options'] as $optIdx => $opt) {
                QuizOption::create([
                    'question_id' => $question->id,
                    'option_text' => $opt[0],
                    'is_correct' => $opt[1],
                ]);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SPECIALIZATION LEVEL (10 TRACKS) — HANYA MODUL & ESSAY (TANPA MCQ)
    // ═══════════════════════════════════════════════════════════════════════════

    private function seedSpecializationLevel(Course $course): void
    {
        $trackTitle = str_replace('CBEc Specialization — ', '', $course->title);

        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => 'Program Spesialisasi — ' . $trackTitle,
            'order_index' => 1,
        ]);

        // 1. Learning Module
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'pdf_module',
            'title' => 'Specialization Learning Modules — ' . $trackTitle,
            'instruction_text' => "Unduh dan pelajari modul spesialisasi {$trackTitle} berikut sebelum mengerjakan tugas studi kasus.\n\nModul ini mencakup:\n• Konsep fundamental dan kerangka operasional mendalam mengenai {$trackTitle}\n• Metodologi teknis, regulasi nasional, dan standar internasional terkini\n• Kajian kasus komersial, mitigasi risiko ekologis, dan kelayakan finansial\n• Instrumen pemantauan, verifikasi dampak, dan tata kelola berkelanjutan\n\nPelajari materi ini dengan cermat untuk mempersiapkan diri menyusun analisis tugas studi kasus.",
            'max_score' => 0,
            'is_prerequisite' => true,
            'order_index' => 1,
        ]);

        // 2. Case-Study Essay Submission (Satu-satunya ujian untuk Spesialisasi)
        $essayPrompt = $this->getTrackSpecificEssayPrompt($trackTitle);
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'essay_task',
            'title' => "Case-Study Essay Submission — {$trackTitle}",
            'instruction_text' => $essayPrompt,
            'max_score' => 100,
            'is_prerequisite' => false,
            'order_index' => 2,
        ]);
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  STUDI KASUS ESSAY UNTUK 10 SPESIALISASI
    // ───────────────────────────────────────────────────────────────────────────

    private function getTrackSpecificEssayPrompt(string $track): string
    {
        return match ($track) {
            'The Blue Carbon', 'Blue Carbon' => "### Studi Kasus: Valuasi Ekonomi Karbon Biru & Perancangan Proyek Restorasi Mangrove Skema Karbon Sukarela di Berau, Kalimantan Timur

#### Latar Belakang Masalah
Kawasan pesisir Delta Berau memiliki hutan mangrove seluas 45.000 hektar dengan potensi stok karbon tanah mencapai 850 ton C/ha. Namun, dalam satu dekade terakhir, sekitar 12.000 hektar telah terfragmentasi akibat ekspansi tambak udang tradisional dan pembukaan lahan industri. Pemerintah daerah bersama konsorsium masyarakat lokal berniat mengajukan proyek restorasi karbon biru ke pasar karbon sukarela (*Voluntary Carbon Market*) dengan standar Verra VCS (VM0033) untuk mendanai pemulihan ekosistem seluas 5.000 hektar sekaligus membuka lapangan kerja hijau (*green jobs*) bagi masyarakat lokal.

#### Tugas Peserta:
Sebagai seorang spesialis *Blue Carbon*, susunlah naskah dokumen kajian komprehensif (minimal 500 kata) yang menjawab 3 pertanyaan pokok:

1. **Perhitungan Baseline & Metodologi MRV**: Jelaskan langkah-langkah metodologis penentuan *carbon baseline*, estimasi *Additionality*, serta desain protokol MRV (*Measurement, Reporting, and Verification*) berkala untuk mengukur cadangan karbon atas permukaan (AGB) dan karbon sedimen bawah permukaan (SOC).
2. **Mitigasi Risiko Kebocoran (Leakage) & Permanence**: Analisis potensi risiko *leakage* (misalnya perpindahan pembabatan mangrove ke area tetangga) dan risiko *permanence* (seperti kenaikan muka air laut atau abrasi badai), serta rumuskan strategi mitigasi konkritnya.
3. **Mekanisme Pembagian Manfaat (*Benefit Sharing Mechanism*)**: Rancang struktur pembagian pendapatan (*benefit-sharing*) dari hasil penjualan kredit karbon yang adil antara masyarakat pesisir pengelola mangrove, pemerintah daerah, dan investor proyek sesuai kerangka regulasi Nilai Ekonomi Karbon (Perpres No. 98/2021).",

            'Blue Business Development' => "### Studi Kasus: Perancangan Model Bisnis Sirkular Startup Maritim Terintegrasi untuk Produk Bernilai Tambah dari Limbah Perikanan di Muncar, Banyuwangi

#### Latar Belakang Masalah
Pelabuhan Perikanan Muncar menghasilkan sekitar 120 ton limbah industri pengolahan ikan (tulang, kepala, jeroan, dan cangkang krustasea) per hari yang sebagian besar dibuang langsung ke laut atau dijual sangat murah untuk pakan ternak beraroma menyengat. Di sisi lain, harga bahan baku pakan ikan budidaya dan suplemen farmasi terus melambung tinggi. Seorang wirausahawan muda kelautan ingin mendirikan startup pengolahan limbah sirkular dengan modal awal terbatas, namun membutuhkan model bisnis yang teruji secara finansial dan operasional.

#### Tugas Peserta:
Susun naskah Business Plan dan Analisis Kelayakan Usaha Sirkular (minimal 500 kata):

1. **Circular Business Model Canvas**: Susun elemen kunci Value Proposition, Customer Segments, Key Activities, dan Revenue Streams untuk produk turunan bernilai tinggi (misalnya: minyak ikan Omega-3, kitosan untuk bioplastik, atau hidrolisat protein ikan).
2. **Analisis Kelayakan Finansial & Investasi**: Jelaskan parameter keuangan utama (asumsi CapEx, OpEx, estimasi Payback Period, Net Present Value/NPV, dan Internal Rate of Return/IRR) untuk meyakinkan investor modal ventura (*impact investors*).
3. **Kemitraan Inklusif & Kepatuhan Keberlanjutan**: Rumuskan strategi kemitraan inklusif dengan kelompok nelayan dan industri pengalengan ikan lokal untuk menjamin kontinuitas pasokan bahan baku serta standar sertifikasi ekolabel yang harus dipenuhi.",

            'Blue Data Intelligence' => "### Studi Kasus: Arsitektur Sistem Pengawasan Maritim Cerdas (Smart Maritime Surveillance) Berbasis IoT, Satelit, dan AI untuk Penanggulangan IUU Fishing di Laut Natuna Utara

#### Latar Belakang Masalah
Laut Natuna Utara merupakan perairan strategis dengan potensi perikanan pelagis yang sangat kaya, namun kerap menjadi sasaran empuk kapal penangkap ikan asing ilegal (*IUU Fishing*). Kapal-kapal pelaku kejahatan maritim ini sering mematikan sinyal AIS (*dark vessels*), memanfaatkan celah waktu patroli kapal pengawas, dan melakukan pemindahan muatan di tengah laut (*transshipment*). Terbatasnya armada kapal patroli fisik menuntut adanya sistem deteksi dini berbasis kecerdasan data (*Ocean Data Intelligence*).

#### Tugas Peserta:
Rancang arsitektur sistem intelijen data maritim komprehensif (minimal 500 kata):

1. **Integrasi Data Multi-Sumber**: Rancang alur penggabungan (*data fusion*) antara citra satelit radar SAR (Synthetic Aperture Radar), satelit optik Sentinel, sinyal AIS, VMS, dan pelampung sensor IoT untuk melacak pergerakan *dark vessels*.
2. **Penerapan Algoritma Kecerdasan Buatan (Machine Learning)**: Jelaskan bagaimana model Deep Learning/Computer Vision diterapkan untuk mendeteksi anomali pola trajektori pelayaran kapal (seperti manuver melingkar indikasi penarikan pukat harimau ilegal) secara otomatis.
3. **Mekanisme Diseminasi Operasional**: Rancang protokol respons cepat terintegrasi dari pusat komando data (*command center*) ke armada kapal patroli PSDKP-KKP dan TNI AL di garis depan agar operasi pencegatan di laut berjalan efektif dan hemat bahan bakar.",

            'Circular Economy', 'Blue Circular Economy' => "### Studi Kasus: Transformasi Rantai Nilai Pengelolaan Sampah Jaring Ikan (*Ghost Nets*) dan Plastik Pesisir Menjadi Produk Nilai Tambah di Kepulauan Seribu

#### Latar Belakang Masalah
Kawasan Taman Nasional Kepulauan Seribu menerima kiriman sampah plastik dan serpihan alat tangkap jaring terbengkalai (*ALDFG / Ghost Nets*) rata-rata 30–50 ton per pekan dari muara sungai daratan Jakarta. Jaring nilon yang tersangkut di terumbu karang terus membunuh penyu, hiu karang, dan merusak karang bercabang. Sementara itu, biaya pengangkutan sampah kembali ke daratan utama sangat mahal dan kapasitas bank sampah lokal masih sangat terbatas.

#### Tugas Peserta:
Susun rencana strategi intervensi ekonomi sirkular pesisir (minimal 500 kata):

1. **Rantai Pasok Pengumpulan & Logistik Balik (*Reverse Logistics*)**: Rancang skema insentif ekonomi bagi nelayan dan pemulung pesisir untuk mengumpulkan kembali jaring bekas (*buy-back scheme*) dan alur logistik pemilahannya.
2. **Teknologi Daur Ulang & Upcycling Material**: Analisis opsi pemrosesan teknologi sirkular untuk mendaur ulang jaring nilon (Poliamida-6) menjadi pelet plastik daur ulang kualitas industri atau produk kriya bernilai jual tinggi.
3. **Skema Pendanaan Berkelanjutan & Kebijakan EPR**: Rancang mekanisme kemitraan bersama industri manufaktur kemasan melalui skema *Extended Producer Responsibility* (EPR) dan kredit plastik (*plastic credits*) guna mendanai operasional program secara mandiri.",

            'Blue Community Development' => "### Studi Kasus: Revitalisasi Kelembagaan Koperasi Nelayan Tradisional dan Penguatan Hak Kelola Pesisir Berbasis Kearifan Lokal di Teluk Mayalibit, Raja Ampat

#### Latar Belakang Masalah
Masyarakat nelayan tradisional di Teluk Mayalibit menghadapi tekanan ekonomi akibat biaya logistik bahan bakar melaut yang mahal dan ketergantungan pada sistem tengkulak (*pelepas uang/ijon*) yang membeli hasil tangkapan di bawah harga pasar wajar. Selain itu, generasi muda pesisir cenderung meninggalkan desa untuk bekerja serabutan di kota karena minimnya peluang kerja maritim lokal. Di sisi lain, kawasan ini memiliki tradisi kearifan adat laut yang kuat dan komitmen konservasi tinggi.

#### Tugas Peserta:
Rancang naskah program pemberdayaan masyarakat pesisir terpadu (minimal 500 kata):

1. **Reformasi Koperasi Multi-Pihak**: Rancang model transformasi kelembagaan nelayan dari kelompok informal menjadi Koperasi Modern yang menyediakan pembiayaan mikro syariah, SPBN (Stasiun Pengisian Bahan Bakar Nelayan) mandiri, dan unit simpan pinjam adil.
2. **Revitalisasi Kearifan Lokal Adat Pesisir**: Integrasikan aturan adat pemanfaatan laut (seperti sistem buka-tutup perairan / Sasi) ke dalam peraturan desa (Perdes) formal yang diakui oleh pemerintah daerah dan hukum positif nasional.
3. **Program Pemberdayaan Perempuan & Pemuda Pesisir**: Usulkan 2 inisiatif penciptaan mata pencaharian alternatif (*alternative livelihoods*) berbasis diversifikasi produk olahan laut atau ekowisata bahari yang dipimpin langsung oleh kelompok perempuan nelayan.",

            'Blue Farming' => "### Studi Kasus: Perencanaan Tambak Udang Berkelanjutan Berbasis Teknologi Bioflok dan IPAL Nol Limbah di Pesisir Sumbawa, NTB

#### Latar Belakang Masalah
Budidaya udang vaname intensif di pesisir Sumbawa sering kali dihadapkan pada ancaman wabah penyakit fatal (seperti WSSV dan AHPND/EMS) serta konflik sosial akibat pencemaran bau dan air buangan tambak yang merusak perairan tangkapan nelayan pantai. Investor lokal berkeinginan membangun kompleks tambak udang ramah lingkungan seluas 10 hektar yang mengedepankan efisiensi pakan, biosekuriti ketat, dan nol pencemaran limbah cair ke laut lepas.

#### Tugas Peserta:
Susun dokumen perencanaan teknis dan lingkungan Blue Farming (minimal 500 kata):

1. **Desain Sistem Biosekuriti & Manajemen Bioflok**: Jelaskan penerapan standar biosekuriti pada tandon air masuk (*inlet*), pemeliharaan rasio C:N dengan penambahan molase, serta pengendalian mikroba patogen tanpa penggunaan antibiotik kimia berbahaya.
2. **Rekayasa IPAL Terintegrasi (Instalasi Pengolahan Air Limbah)**: Rancang skema kolam pengendapan sedimen lumpur organik, kolam aerasi, dan kolam biofilter menggunakan ikan bandeng/nila dan rumput laut agar baku mutu air buangan (*outlet*) memenuhi standar kelayakan lingkungan.
3. **Analisis FCR & Efisiensi Ekonomi**: Rasionalkan target Food Conversion Ratio (FCR < 1,2) terhadap proyeksi margin keuntungan usaha dan kelayakan memperoleh sertifikasi CBIB (Cara Budidaya Ikan yang Baik) serta ASC (Aquaculture Stewardship Council).",

            'Blue Tourism' => "### Studi Kasus: Strategi Manajemen Daya Dukung (*Carrying Capacity*) dan Pengendalian Overtourism di Kawasan Konservasi Laut Kepulauan Derawan

#### Latar Belakang Masalah
Kepulauan Derawan mengalami lonjakan drastis kunjungan wisatawan bahari pasca-pandemi hingga mencapai 150.000 pengunjung per tahun. Kondisi ini memicu dampak ekologis parah: jangkar kapal wisata merusak 25% terumbu karang di sekitar Pulau Kakaban, sampah plastik menumpuk di pesisir Pulau Maratua, dan polusi cahaya resor mengganggu peneluran penyu hijau (*Chelonia mydas*) di Pulau Sangalaki. Pengelola destinasi dituntut segera menerapkan strategi pengendalian wisatawan berbasis daya dukung lingkungan.

#### Tugas Peserta:
Susun naskah rencana aksi pengelolaan pariwisata bahari berkelanjutan (minimal 500 kata):

1. **Penetapan Daya Dukung Ekologis (*Carrying Capacity Limits*)**: Hitung dan jelaskan metodologi pembatasan kuota wisatawan harian (*Real & Effective Carrying Capacity*) pada spot-spot sensitif seperti Danau Ubur-Ubur Kakaban dan zona peneluran penyu Sangalaki.
2. **Sistem Zonasi & Pengendalian Aktivitas Wisata Selam**: Rancang zonasi aktivitas kapal (pemasangan tambat apung / *mooring buoys* untuk melarang lego jangkar), kode etik penyelaman Green Fins, dan mitigasi polusi cahaya di pantai peneluran penyu.
3. **Struktur Retribusi Konservasi Digital (*User Fee*)**: Rancang skema tiket konservasi digital terpadu (*conservation fee*) dan alokasi transparansinya untuk mendanai patroli kelompok pengawas masyarakat (Pokmaswas) dan pemulihan karang.",

            'Blue Shipping' => "### Studi Kasus: Peta Jalan (*Roadmap*) Dekarbonisasi Armada Kapal Penyeberangan dan Penerapan Green Port di Pelabuhan Merak-Bakauheni

#### Latar Belakang Masalah
Lintasan penyeberangan Selat Sunda (Merak–Bakauheni) dilayani oleh lebih dari 70 unit kapal Ro-Ro dengan frekuensi penyeberangan ratusan trip per hari. Sebagian besar kapal masih menggunakan mesin diesel konvensional berbahan bakar fosil dengan efisiensi energi rendah, menyumbangkan emisi gas rumah kaca dan partikulat SOx/NOx yang tinggi di kawasan pelabuhan padat penduduk. Otoritas pelabuhan dan operator armada dituntut menyusun peta jalan transisi hijau menuju target emisi nol bersih IMO 2050.

#### Tugas Peserta:
Susun dokumen peta jalan dekarbonisasi logistik pelayaran penyeberangan (minimal 500 kata):

1. **Implementasi Onshore Power Supply (OPS)**: Rancang analisis teknis dan operasional penyediaan fasilitas *Cold Ironing* di dermaga Merak dan Bakauheni agar kapal Ro-Ro dapat mematikan mesin bantu diesel saat proses bongkar muat kendaraan.
2. **Transisi Bahan Bakar Rendah/Nol Karbon**: Evaluasi opsi transisi bahan bakar alternatif (misalnya elektrifikasi baterai untuk lintasan jarak pendek, bahan bakar biofuel B35/B40, atau metanol hijau) ditinjau dari aspek ketersediaan infrastruktur dan kelayakan finansial Capex/Opex.
3. **Efisiensi Operasional & Digital Port Clearance**: Usulkan strategi optimalisasi rute pelayaran (*weather routing*), manajemen kecepatan jelajah (*slow steaming*), dan digitalisasi antrean kapal untuk memangkas waktu tunggu kapal berlabuh (*waiting time*) di perairan.",

            'Blue Finance' => "### Studi Kasus: Penyusunan Kerangka Kerja Obligasi Biru (*Blue Bond Framework*) untuk Pendanaan Restorasi Pesisir dan Perikanan Skala Kecil di Kawasan Timur Indonesia

#### Latar Belakang Masalah
Sebuah konsorsium bank pembangunan daerah bersama kementerian teknis merencanakan penerbitan Obligasi Biru Daerah (*Municipal/Regional Blue Bond*) senilai Rp 1,5 triliun untuk mendanai proyek infrastruktur perikanan berkelanjutan, pembangunan cold storage tenaga surya di 20 pulau terluar, dan restorasi 10.000 hektar habitat pesisir di Kawasan Timur Indonesia. Agar dapat menarik investor institusi internasional dan dana pensiun global, kerangka kerja obligasi wajib memenuhi standar ICMA Green Bond Principles dan Taksonomi Keuangan Berkelanjutan Indonesia (TKBI).

#### Tugas Peserta:
Susun naskah Blue Bond Framework dan Analisis Risiko Investasi (minimal 500 kata):

1. **Kriteria Kelayakan Penggunaan Dana (*Use of Proceeds*)**: Rincikan kriteria seleksi proyek yang memenuhi syarat (*Eligible Blue Projects*) dan batasan tegas proyek yang dilarang (*Exclusion List*) guna mencegah tuduhan *blue-washing*.
2. **Tata Kelola Evaluasi & Pelaporan Transparansi (*Project Evaluation & Reporting*)**: Rancang struktur komite evaluasi seleksi proyek serta indikator kinerja utama (KPI) lingkungan yang wajib dilaporkan setiap tahun (misalnya: tonase CO₂ yang dihindari, hektar habitat terpulihkan, jumlah nelayan terberdayakan).
3. **Mitigasi Risiko Keuangan & Pengembalian Investasi**: Analisis skema arus kas pengembalian obligasi (*debt service mechanism*), pemanfaatan jaminan kredit (*credit enhancement/blended finance*), dan mitigasi risiko fluktuasi nilai tukar serta risiko biofisik kelautan.",

            'Blue Energy' => "### Studi Kasus: Perancangan Masterplan Ekosistem Energi Baru Terbarukan Laut (Marine Renewable Energy) dan Ketahanan Sistem Kelistrikan Pulau Mandiri di Selat Pantar, NTT

#### Latar Belakang Masalah
Wilayah kepulauan di sekitar Selat Pantar, Nusa Tenggara Timur, memiliki potensi arus laut pasang surut yang sangat deras dan konsisten (kecepatan puncak > 3,5 m/s), namun masyarakatnya masih bergantung pada pembangkit listrik diesel (PLTD) berbahan bakar fosil yang mahal, bising, dan sering mengalami pemadaman akibat keterlambatan pasokan tongkang solar saat cuaca buruk. Pemerintah daerah menginisiasi studi kelayakan integrasi Pembangkit Listrik Tenaga Arus Laut (PLTAL) dan microgrid pulau mandiri emisi nol.

#### Tugas Peserta:
Rancang dokumen masterplan sistem Blue Energy mandiri (minimal 500 kata):

1. **Analisis Teknis & Pemilihan Turbin Arus Laut**: Evaluasi kriteria pemilihan desain turbin arus laut (Horizontal Axis Tidal Turbine vs Vertical Axis) yang tahan terhadap *biofouling* teritip laut, memiliki sistem tambat kokoh terhadap gempa tektonik dasar laut, dan ramah terhadap mamalia laut yang bermigrasi.
2. **Desain Smart Microgrid & BESS**: Rancang arsitektur sistem integrasi daya antara PLTAL, cadangan PLTS terapung pesisir, dan Battery Energy Storage System (BESS) agar frekuensi jaringan listrik pulau tetap stabil pada beban puncak siang dan malam.
3. **Kelayakan Investasi & Dampak Sosial-Ekonomi**: Analisis proyeksi LCOE (Levelized Cost of Electricity) terhadap tarif listrik subsidi PLN, potensi transfer keahlian bagi pemuda lokal sebagai teknisi pemeliharaan laut, dan pasokan listrik murah bagi cold storage perikanan rakyat.",

            'Blue Food' => "### Studi Kasus: Transformasi Rantai Pasok Pangan Biru Berkelanjutan (Sustainable Blue Foods) Berbasis Makroalga dan Hasil Samping Perikanan di Maluku Tenggara

#### Latar Belakang Masalah
Kabupaten Maluku Tenggara merupakan salah satu sentra rumput laut terbesar di Indonesia, namun sebagian besar produksi hanya dijual dalam bentuk kering mentah (*raw dried seaweed*) dengan harga sangat fluktuatif di tingkat petani. Di sisi lain, angka stunting balita dan defisiensi mikronutrien (zat besi dan Omega-3) di desa-desa pesisir masih tinggi, sementara limbah kepala dan tulang ikan dari Tempat Pelelangan Ikan (TPI) belum termanfaatkan secara optimal.

#### Tugas Peserta:
Susun dokumen strategi transformasi sistem Pangan Biru terintegrasi (minimal 500 kata):

1. **Hilirisasi Pangan Fungsional Berbasis Alga**: Rancang model unit pengolahan terdesentralisasi untuk mengolah rumput laut menjadi bahan pangan kaya serat, kapsul fortifikan pangan lokal, dan penstabil makanan alami yang dapat diproduksi oleh kelompok perempuan pesisir.
2. **Valuasi Limbah Ikan Menjadi Hidrolisat Protein Ikan (HPI)**: Jelaskan alur proses biokonversi limbah hasil tangkapan menjadi konsentrat protein cair/tepung peptida bermutu tinggi bebas bau amis untuk program makanan tambahan gizi anak dan lansia.
3. **Ketertelusuran & Sertifikasi Mutu Pangan**: Rancang sistem penjaminan mutu rantai dingin bertenaga surya (*Solar Cold Chain*) dan kode ketertelusuran digital (QR Code Traceability) dari titik panen nelayan hingga ke pasar konsumen akhir guna menjamin keamanan pangan bebas kontaminan.",

            'Blue Port' => "### Studi Kasus: Cetak Biru Transformasi Green Port & Dekarbonisasi Pelabuhan Peti Kemas Berkelanjutan di Pelabuhan Tanjung Priok

#### Latar Belakang Masalah
Pelabuhan Tanjung Priok sebagai pelabuhan hub internasional tersibuk di Indonesia melayani jutaan TEUs peti kemas per tahun. Tingginya frekuensi kapal bersandar dan pergerakan ribuan truk kontainer berbahan bakar diesel memicu beban emisi karbon yang tinggi, polusi udara partikulat di kawasan perkotaan sekitar, serta risiko pencemaran limbah cair pelayaran di perairan kolam pelabuhan. Otoritas pelabuhan menargetkan transformasi komprehensif menuju standar internasional Eco-Port/Green Port.

#### Tugas Peserta:
Susun naskah cetak biru transformasi Green Port berkelanjutan (minimal 500 kata):

1. **Implementasi Onshore Power Supply (OPS / Cold Ironing)**: Rancang rencana teknis dan operasional penyediaan daya listrik dari darat ke kapal (*shore-to-ship power*) di dermaga internasional utama agar kapal peti kemas wajib mematikan mesin bantu diesel saat bongkar muat.
2. **Elektrifikasi Peralatan & Smart Digital Port**: Evaluasi roadmap konversi armada RTG crane menjadi e-RTG elektrik, integrasi sistem pemanggilan truk otomatis (*Truck Booking System*) untuk memangkas waktu tunggu kemacetan terminal, dan kesiapan fasilitas bunkering bahan bakar hijau (LNG/Metanol).
3. **Sistem Pengelolaan Limbah Kapal (MARPOL) & Ekosistem Pesisir**: Rancang optimalisasi Port Reception Facilities (PRF) terpadu untuk limbah sampah dan sisa minyak kapal, pengelolaan sedimentasi pengerukan alur yang ramah lingkungan, serta pembangunan sabuk hijau mangrove sebagai benteng alami peredam abrasi rob.",

            'Blue Food & Energy Circular' => "### Studi Kasus: Perancangan Ekosistem Pulau Mandiri Energi dan Pangan (*Self-Sustaining Island*) Menggunakan PLTAL dan Biorefineri Alga di Pulau Rote, NTT

#### Latar Belakang Masalah
Pulau Rote menghadapi tantangan kelangkaan pasokan listrik yang masih bergantung pada PLTD diesel berbahan bakar minyak mahal serta defisit air tawar dan kerentanan pangan saat musim kemarau panjang. Namun, selat-selat sempit di sekitar Pulau Rote memiliki potensi arus pasang surut air laut yang sangat konsisten, sinar matahari melimpah, dan perairan yang sangat cocok untuk budidaya makroalga serta mikroalga kaya protein.

#### Tugas Peserta:
Rancang konsep masterplan pulau mandiri sirkular energi dan pangan (minimal 500 kata):

1. **Integrasi Energi Terbarukan Laut (PLTAL & Surya)**: Rancang skenario integrasi Pembangkit Listrik Tenaga Arus Laut (PLTAL) dan fotovoltaik surya untuk menggantikan PLTD diesel, termasuk analisis stabilitas pasokan beban dasar (*baseload power*).
2. **Keterpaduan Energi, Air Bersih, dan Cold Storage**: Rancang keterhubungan sirkular di mana kelebihan energi listrik bersih dialokasikan untuk pabrik es curah nelayan (*solar/marine ice maker*) dan unit desalinasi air laut (*SWRO*) untuk air minum warga.
3. **Biorefineri Pangan Laut & Valuasi Nilai Tambah**: Rancang fasilitas hilirisasi budidaya alga untuk fortifikasi pangan lokal penanggulangan stunting, pakan ternak protein tinggi, dan pemanfaatan residu limbah biomassa menjadi pupuk bio-organik pesisir.",

            default => "### Studi Kasus: Analisis Implementasi Keberlanjutan dalam Peminatan {$track}

#### Latar Belakang Masalah
Pembangunan ekonomi maritim dalam sektor {$track} di Indonesia menghadapi tantangan besar dalam menyelaraskan pertumbuhan ekonomi dengan kelestarian ekosistem laut dan kesejahteraan masyarakat pesisir.

#### Tugas Peserta:
Susun analisis komprehensif (minimal 500 kata) yang menjawab:
1. **Identifikasi Masalah Utama**: Analisis akar penyebab persoalan lingkungan dan ekonomi dalam sektor {$track}.
2. **Rancangan Solusi Berbasis Blue Economy**: Usulkan strategi intervensi terukur berbasis teknologi dan inovasi sirkular.
3. **Analisis Dampak & Kelayakan**: Uraikan estimasi dampak positif terhadap pencapaian target SDG 14 dan keberlanjutan mata pencaharian komunitas pesisir.",
        };
    }
}
