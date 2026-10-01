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
        // Simpan file_path yang mungkin sudah di-upload admin
        $existingModule = CourseContent::where('content_type', 'pdf_module')
            ->whereNotNull('file_path')
            ->first();
        $savedPdfPath = $existingModule?->file_path;

        DB::transaction(function () use ($savedPdfPath) {
            // ─── Foundation Level — CBEc ────────────────────────────────────────────
            $foundation = Course::where('slug', 'like', '%foundation%')->first();
            if ($foundation) {
                $foundation->sections()->delete();
                $this->seedFoundationLevel($foundation, $savedPdfPath);
                $this->command->info("Re-seeded Foundation course: {$foundation->title}");
            } else {
                $this->command->warn('Foundation course not found. Skipping.');
            }

            // ─── 10 Specialization Tracks ───────────────────────────────────────────
            $specs = Course::whereHas('certificationLevel', fn ($q) => $q->where('code', 'SPEC'))->get();
            foreach ($specs as $specCourse) {
                $specCourse->sections()->delete();
                $this->seedSpecializationLevel($specCourse);
                $this->command->info("Re-seeded Specialization course: {$specCourse->title}");
            }
        });
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

        // ── 1. Learning Modules ────────────────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'pdf_module',
            'title'            => 'Foundation Learning Modules — Blue Economy Core',
            'file_path'        => $savedPdfPath,
            'instruction_text' => "Unduh dan pelajari modul pembelajaran Foundation Level berikut sebelum mengerjakan ujian.\n\nModul ini mencakup:\n• Konsep dasar Blue Economy & Ekonomi Kelautan berkelanjutan\n• Ekosistem pesisir utama (mangrove, padang lamun, terumbu karang) dan nilai valuasinya\n• Target SDG 14 (Life Below Water) dan integrasi ke dalam kebijakan nasional\n• Kerangka hukum UNCLOS 1982, batas maritim, dan tata kelola perikanan WPPNRI\n• Pencegahan pencemaran laut, mikroplastik, serta instrumen Keuangan Biru Indonesia\n\nBaca dengan seksama, catat poin-poin penting, dan siapkan dirimu untuk ujian.",
            'max_score'        => 0,
            'is_prerequisite'  => true,
            'order_index'      => 1,
        ]);

        // ── 2. Multiple-Choice Examination (20 Soal, 5 poin/soal = 100 poin) ────
        $quiz = CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'mcq_quiz',
            'title'            => 'Multiple-Choice Examination — Foundation Level',
            'instruction_text' => "Kerjakan semua soal ujian pilihan ganda berikut dengan teliti.\n\nPetunjuk Ujian:\n• Terdiri dari 20 butir soal komprehensif seputar konsep dasar Blue Economy, SDG 14, ekosistem maritim, dan regulasi kelautan.\n• Setiap butir soal bernilai 5 poin (Total Bobot Nilai = 100 poin).\n• Nilai minimum kelulusan: 70 dari 100 (minimal 14 soal benar).\n• Pilih satu jawaban yang paling tepat (A, B, C, atau D).\n• Jika belum memenuhi batas kelulusan, Anda dapat mengulang ujian kembali.",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 2,
        ]);

        $this->seedFoundationQuestions($quiz);

        // ── 3. Case-Study Essay Submission ──────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'essay_task',
            'title'            => 'Case-Study Essay Submission — Foundation Level',
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
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 3,
        ]);

        // ── 4. Training Course (Field Study) ────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'field_study',
            'title'            => 'Training Course (Field Study)',
            'instruction_text' => "Field Study adalah komponen praktikum lapangan terpadu program Foundation Level DigiBlueCamp.\n\nAktivitas Lapangan:\n🌊 Observasi habitat pesisir dan verifikasi baseline ekosistem mangrove/lamun\n🤝 Dialog interaktif dengan kelompok nelayan dan pengelola kawasan konservasi laut\n📊 Pengambilan data primer sosial-ekonomi pesisir\n🎯 Diskusi kelompok terarah (FGD) dan perumusan rekomendasi praktis\n\nSilakan konfirmasikan keikutsertaan Anda di bawah ini. Peserta yang mengikuti Field Study secara otomatis dibebaskan dari modul Critical Thinking Exam.",
            'max_score'        => 0,
            'is_prerequisite'  => false,
            'order_index'      => 4,
        ]);

        // ── 5. Case-Study Essay Examination — Critical Thinking ─────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'critical_thinking',
            'title'            => 'Case-Study Essay Examination — Critical Thinking',
            'instruction_text' => "### Ujian Analisis Kritis: Tata Kelola Perikanan Tangkap vs Kebijakan Kawasan Konservasi Laut (KKL) di Indonesia

*Catatan: Modul ini diperuntukkan khusus bagi peserta yang TIDAK mengikuti kegiatan Field Study.*

#### Latar Belakang Analisis
Penerapan Kebijakan Penangkapan Ikan Terukur (PIT) berbasis kuota di Wilayah Pengelolaan Perikanan Negara Republik Indonesia (WPPNRI) dan target perluasan Kawasan Konservasi Laut sebesar 30% pada tahun 2045 sering kali memicu perdebatan antara kepentingan peningkatan devisa negara dari ekspor perikanan dan perlindungan hak-hak nelayan skala kecil tradisional (Small-Scale Fisheries).

#### Tugas Peserta:
Susun naskah telaah kritis (minimal 500 kata) yang mengupas:
1. **Evaluasi Kritis Keseimbangan Ekologi dan Ekonomi**: Apakah kebijakan alokasi kuota perikanan saat ini sudah cukup melindungi stok ikan dari penangkapan berlebih (*overfishing*) dan memitigasi risiko *bycatch* satwa terancam punah?
2. **Keadilan Sosial & Kearifan Lokal**: Bagaimana regulasi kelautan nasional dapat mengakomodasi hak-hak masyarakat hukum adat laut (seperti kearifan Sasi, Awig-awig, dan Panglima Laot) agar tidak terpinggirkan oleh zona industri penangkapan skala besar?
3. **Rekomendasi Kebijakan**: Rekomendasikan 3 langkah konkret berbasis sains (*evidence-based policy*) untuk meningkatkan efektivitas pengawasan laut terhadap IUU Fishing di perairan kepulauan terluar Indonesia.",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 5,
        ]);
    }

    private function seedFoundationQuestions(CourseContent $quiz): void
    {
        $questions = [
            [
                'question' => 'Konsep Blue Economy yang diperkenalkan oleh Gunter Pauli dan diadopsi secara luas oleh PBB menekankan pada prinsip utama apa?',
                'weight'   => 5,
                'options'  => [
                    ['Pemanfaatan sumber daya laut secara berkelanjutan untuk pertumbuhan ekonomi, peningkatan taraf hidup, dan kelestarian ekosistem laut tanpa menghasilkan limbah (zero-waste)', true],
                    ['Eksploitasi sumber daya laut secara maksimal dalam jangka pendek untuk mengejar target devisa ekspor perikanan nasional', false],
                    ['Moratorium total terhadap seluruh aktivitas ekonomi manusia di wilayah pesisir dan perairan teritorial', false],
                    ['Privatisasi pulau-pulau kecil untuk pengelolaan pariwisata eksklusif oleh investor internasional', false],
                ],
            ],
            [
                'question' => 'Target SDG 14 (Life Below Water) nomor 14.1 secara spesifik berfokus pada upaya apa?',
                'weight'   => 5,
                'options'  => [
                    ['Mencegah dan secara signifikan mengurangi semua jenis pencemaran laut, terutama dari aktivitas berbasis daratan termasuk serpihan sampah plastik dan polusi nutrisi', true],
                    ['Menghapus seluruh subsidi bahan bakar kapal penangkap ikan skala industri di negara berkembang', false],
                    ['Menggandakan kapasitas produksi armada kapal penangkap ikan samudra', false],
                    ['Melarang ekspor produk perikanan air tawar ke pasar Uni Eropa', false],
                ],
            ],
            [
                'question' => 'Mengapa hutan mangrove dan padang lamun (*seagrass beds*) memiliki nilai strategis yang sangat tinggi dalam mitigasi perubahan iklim global?',
                'weight'   => 5,
                'options'  => [
                    ['Mampu menyerap dan mengunci karbon biru (blue carbon) di dalam sedimen anaerobik hingga ratusan hingga ribuan tahun dengan laju penyerapan per hektar lebih tinggi dari hutan daratan', true],
                    ['Menghasilkan gas metana dalam jumlah besar yang mempercepat penurunan suhu permukaan laut', false],
                    ['Dapat menggantikan fungsi bahan bakar fosil secara langsung sebagai bahan bakar nabati cair tanpa pengolahan', false],
                    ['Mencegah terjadinya siklus pasang surut air laut di kawasan pesisir pulau terluar', false],
                ],
            ],
            [
                'question' => 'Fenomena pemutihan karang (*coral bleaching*) secara massal paling sering dipicu oleh faktor stres lingkungan apa?',
                'weight'   => 5,
                'options'  => [
                    ['Kenaikan anomali suhu permukaan laut (Sea Surface Temperature/SST) yang menyebabkan polip karang melepaskan alga simbiotik *zooxanthellae*', true],
                    ['Tingginya kadar garam (salinitas) akibat penguapan air laut saat musim dingin berlangsung', false],
                    ['Tumbuhnya populasi alga cokelat akibat berkurangnya konsentrasi karbon dioksida di kolom air', false],
                    ['Aktivitas kapal feri penyeberangan yang melintasi alur laut kepulauan', false],
                ],
            ],
            [
                'question' => 'Deklarasi Djuanda yang dicetuskan pada tanggal 13 Desember 1957 merupakan tonggak sejarah kemaritiman Indonesia karena berhasil menetapkan prinsip apa?',
                'weight'   => 5,
                'options'  => [
                    ['Asas Negara Kepulauan (*Archipelagic State Principle*), bahwa seluruh perairan di sekitar, di antara, dan yang menghubungkan pulau-pulau Indonesia adalah bagian integral dari kedaulatan NKRI', true],
                    ['Pemberian konsesi eksploitasi perikanan teritorial kepada perusahaan multinasional', false],
                    ['Penetapan batas teritorial laut Indonesia sejauh 200 mil laut dari garis pantai surut terendah', false],
                    ['Penutupan alur laut kepulauan Indonesia (ALKI) bagi pelayaran kapal niaga internasional', false],
                ],
            ],
            [
                'question' => 'Berdasarkan Konvensi Hukum Laut PBB (UNCLOS 1982), hak apa yang dimiliki oleh negara pantai di Zona Ekonomi Eksklusif (ZEE) sejauh 200 mil laut?',
                'weight'   => 5,
                'options'  => [
                    ['Hak berdaulat (*sovereign rights*) untuk eksplorasi, eksploitasi, konservasi, dan pengelolaan sumber daya alam hayati maupun non-hayati', true],
                    ['Kedaulatan mutlak (*absolute sovereignty*) yang mencakup kedaulatan wilayah daratan, laut, dan ruang udara di atasnya tanpa kebebasan navigasi kapal asing', false],
                    ['Hak memungut pajak bea masuk terhadap setiap kapal asing yang hanya melintas damai (*innocent passage*)', false],
                    ['Hak untuk mengklaim seluruh dasar laut samudra internasional sebagai wilayah properti pribadi negara', false],
                ],
            ],
            [
                'question' => 'Praktik penangkapan ikan ilegal, tidak dilaporkan, dan tidak diatur dikenal dengan istilah IUU Fishing. Instrumen internasional FAO yang mewajibkan pelabuhan menolak kapal pelaku IUU Fishing adalah?',
                'weight'   => 5,
                'options'  => [
                    ['Agreement on Port State Measures (PSMA)', true],
                    ['Convention on International Trade in Endangered Species (CITES)', false],
                    ['International Convention for the Safety of Life at Sea (SOLAS)', false],
                    ['Ballast Water Management Convention (BWMC)', false],
                ],
            ],
            [
                'question' => 'Dalam kerangka Valuasi Ekonomi Total (Total Economic Value/TEV), manfaat ekosistem mangrove dalam menahan abrasi dan badai pesisir diklasifikasikan sebagai?',
                'weight'   => 5,
                'options'  => [
                    ['Indirect Use Value (Nilai Manfaat Tidak Langsung)', true],
                    ['Direct Use Value (Nilai Manfaat Langsung)', false],
                    ['Option Value (Nilai Pilihan Masa Depan)', false],
                    ['Existence Value (Nilai Keberadaan)', false],
                ],
            ],
            [
                'question' => 'Berapa target luas Kawasan Konservasi Laut (KKL / Marine Protected Area) yang dicanangkan pemerintah Indonesia untuk dicapai pada tahun 2030 sebagai komitmen global?',
                'weight'   => 5,
                'options'  => [
                    ['32,5 juta hektar (10% dari luas perairan teritorial Indonesia)', true],
                    ['5 juta hektar (1% dari perairan)', false],
                    ['80 juta hektar (50% dari perairan)', false],
                    ['15 juta hektar (3% dari perairan)', false],
                ],
            ],
            [
                'question' => 'Proses pengasaman laut (*ocean acidification*) disebabkan oleh penyerapan berlebih gas atmosfer apa ke dalam air laut, dan apa dampaknya?',
                'weight'   => 5,
                'options'  => [
                    ['Penyerapan karbon dioksida (CO₂), yang menurunkan pH air laut dan menghambat pembentukan cangkang kalsium karbonat pada karang serta kerang-kerangan', true],
                    ['Penyerapan gas nitrogen (N₂), yang menyebabkan eutrofikasi dan ledakan populasi ubur-ubur secara masif', false],
                    ['Penyerapan sulfur dioksida (SO₂), yang memutihkan air laut menjadi transparan', false],
                    ['Penyerapan gas metana (CH₄), yang menaikkan tingkat keasaman hingga mematikan fitoplankton', false],
                ],
            ],
            [
                'question' => 'Konsep Maximum Sustainable Yield (MSY) dalam biologi perikanan didefinisikan sebagai?',
                'weight'   => 5,
                'options'  => [
                    ['Tingkat tangkapan terbesar yang dapat diambil dari stok ikan secara terus-menerus tanpa mengganggu kapasitas regenerasi alami populasi ikan tersebut', true],
                    ['Volume tangkapan ikan tertinggi yang dapat ditampung oleh kapasitas kapal penangkap ikan dalam satu kali trip berlayar', false],
                    ['Jumlah subsidi perikanan maksimum yang boleh diberikan oleh pemerintah kepada nelayan tradisional', false],
                    ['Batas penangkapan ikan di mana seluruh induk ikan dewasa di perairan ditangkap untuk diproses di industri hilir', false],
                ],
            ],
            [
                'question' => 'Indonesia membagi wilayah pengelolaan perikanan lautnya ke dalam Wilayah Pengelolaan Perikanan Negara Republik Indonesia (WPPNRI). Berapakah jumlah total WPPNRI saat ini?',
                'weight'   => 5,
                'options'  => [
                    ['11 WPPNRI (mencakup perairan laut kepulauan, laut teritorial, dan ZEE Indonesia)', true],
                    ['5 WPPNRI', false],
                    ['8 WPPNRI', false],
                    ['17 WPPNRI', false],
                ],
            ],
            [
                'question' => 'Kearifan lokal masyarakat pesisir di Maluku dan Papua yang melarang penangkapan hasil laut tertentu pada periode waktu tertentu demi pemulihan populasi disebut?',
                'weight'   => 5,
                'options'  => [
                    ['Sasi Laut', true],
                    ['Subak Abian', false],
                    ['Awig-awig Hutan', false],
                    ['Bawine Pondang', false],
                ],
            ],
            [
                'question' => 'Partikel plastik berukuran kurang dari 5 milimeter yang mencemari kolom air laut dan berbahaya karena termakan oleh biota laut dan terakumulasi dalam rantai pangan manusia disebut?',
                'weight'   => 5,
                'options'  => [
                    ['Mikroplastik', true],
                    ['Makroplastik', false],
                    ['Biopolimer aktif', false],
                    ['Polietilena densitas tinggi murni', false],
                ],
            ],
            [
                'question' => 'Apa yang dimaksud dengan *carrying capacity* (daya dukung lingkungan) dalam konteks destinasi pariwisata bahari berkelanjutan?',
                'weight'   => 5,
                'options'  => [
                    ['Batas intensitas kunjungan dan aktivitas wisatawan maksimum yang dapat ditoleransi suatu kawasan pesisir tanpa menimbulkan kerusakan permanen pada ekosistem setempat', true],
                    ['Kapasitas muatan penumpang maksimal kapal penyeberangan wisata antarpulau', false],
                    ['Jumlah total kamar hotel berbintang yang diizinkan dibangun di sempadan pantai', false],
                    ['Pendapatan retribusi tiket masuk maksimal yang diperbolehkan dipungut oleh pengelola wisata bahari', false],
                ],
            ],
            [
                'question' => 'Metode restorasi terumbu karang yang memanfaatkan aliran arus listrik tegangan rendah untuk mempercepat proses akresi mineral kalsium karbonat pada struktur logam dikenal dengan teknologi?',
                'weight'   => 5,
                'options'  => [
                    ['Biorock', true],
                    ['Artificial Coral Spray', false],
                    ['Reef Netting Barrier', false],
                    ['Sediment Filtration Trap', false],
                ],
            ],
            [
                'question' => 'Dalam model ekonomi sirkular pada industri pengolahan hasil perikanan, limbah cangkang udang dan kepiting yang melimpah dapat diekstraksi menjadi bahan bernilai tinggi apa?',
                'weight'   => 5,
                'options'  => [
                    ['Kitin dan Kitosan (*Chitosan*) yang digunakan untuk bioplastik, kosmetik, dan koagulan limbah', true],
                    ['Bahan bakar bensin beroktan tinggi untuk mesin tempel perahu', false],
                    ['Pengganti semen instan untuk pengecoran konstruksi pelabuhan laut dalam', false],
                    ['Zat pewarna tekstil sintetis tahan luntur', false],
                ],
            ],
            [
                'question' => 'Otoritas Jasa Keuangan (OJK) bersama kementerian terkait menyusun Taksonomi Keuangan Berkelanjutan Indonesia (TKBI). Apa fungsi utama taksonomi ini dalam Blue Finance?',
                'weight'   => 5,
                'options'  => [
                    ['Memberikan klasifikasi baku bagi lembaga keuangan untuk menentukan apakah suatu proyek kelautan memenuhi kriteria ramah lingkungan/biru guna mencegah praktik *blue-washing*', true],
                    ['Menetapkan tarif suku bunga pinjaman tetap sebesar 0% bagi seluruh importir hasil laut', false],
                    ['Menggantikan seluruh regulasi perbankan konvensional di kawasan pesisir pulau terpencil', false],
                    ['Menghapus kewajiban analisis mengenai dampak lingkungan (AMDAL) bagi investasi maritim', false],
                ],
            ],
            [
                'question' => 'Manakah di antara ekosistem berikut yang bertindak sebagai benteng pertahanan alami paling efektif dalam mereduksi energi gelombang tsunami dan gelombang pasang di garis pantai?',
                'weight'   => 5,
                'options'  => [
                    ['Hutan Mangrove yang rapat dengan sistem perakaran tunjang dan nafas (*pneumatophores*)', true],
                    ['Hamparan pasir pantai terbuka tanpa vegetasi', false],
                    ['Tambak udang tanah terbuka dengan tanggul buatan tanah liat', false],
                    ['Zona perairan laut lepas berkedalaman lebih dari 200 meter', false],
                ],
            ],
            [
                'question' => 'Prinsip kehati-hatian (*Precautionary Approach*) dalam pengelolaan sumber daya laut internasional (Deklarasi Rio 1992) menegaskan bahwa:',
                'weight'   => 5,
                'options'  => [
                    ['Ketiadaan bukti ilmiah yang konklusif tidak boleh dijadikan alasan untuk menunda tindakan pencegahan degradasi lingkungan laut ketika terdapat ancaman kerusakan serius atau permanen', true],
                    ['Setiap aktivitas eksploitasi laut boleh dijalankan tanpa izin selama belum ada protes dari masyarakat lokal', false],
                    ['Kegiatan riset kelautan hanya boleh dilakukan jika didanai 100% oleh lembaga donor internasional', false],
                    ['Pemerintah harus menunggu terjadinya kepunahan spesies sebelum menetapkan kuota penangkapan ikan', false],
                ],
            ],
        ];

        $this->insertQuestionsAndOptions($quiz, $questions);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SPECIALIZATION LEVEL (10 TRACKS)
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
            'instruction_text' => "Unduh dan pelajari modul spesialisasi {$trackTitle} berikut sebelum mengerjakan ujian dan tugas studi kasus.\n\nModul ini mencakup:\n• Konsep fundamental dan kerangka operasional mendalam mengenai {$trackTitle}\n• Metodologi teknis, regulasi nasional, dan standar internasional terkini\n• Kajian kasus komersial, mitigasi risiko ekologis, dan kelayakan finansial\n• Instrumen pemantauan, verifikasi dampak, dan tata kelola berkelanjutan\n\nPelajari materi ini dengan cermat untuk mempersiapkan diri menghadapi ujian pilihan ganda dan tugas esai.",
            'max_score'        => 0,
            'is_prerequisite'  => true,
            'order_index'      => 1,
        ]);

        // ── 2. MCQ Examination (10 Soal, 10 poin/soal = 100 poin) ───────────────
        $quiz = CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'mcq_quiz',
            'title'            => "Multiple-Choice Examination — Specialization {$trackTitle}",
            'instruction_text' => "Kerjakan seluruh soal pilihan ganda spesialisasi {$trackTitle} dengan cermat.\n\nPetunjuk Ujian:\n• Terdiri dari 10 butir soal spesifik, analitis, dan aplikatif seputar topik {$trackTitle}.\n• Masing-masing soal berbobot 10 poin (Total Bobot Nilai = 100 poin).\n• Nilai kelulusan minimum: 70 dari 100 (minimal 7 soal dijawab dengan benar).\n• Pilihlah satu jawaban yang paling tepat (A, B, C, atau D).\n• Anda dapat mengulang ujian jika nilai yang diperoleh belum mencapai batas minimum kelulusan.",
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 2,
        ]);

        $this->seedTrackSpecificQuizQuestions($quiz, $trackTitle);

        // ── 3. Case-Study Essay Submission ──────────────────────────────────────
        $essayPrompt = $this->getTrackSpecificEssayPrompt($trackTitle);
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'essay_task',
            'title'            => "Case-Study Essay Submission — {$trackTitle}",
            'instruction_text' => $essayPrompt,
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 3,
        ]);

        // ── 4. Training Course (Field Study) ────────────────────────────────────
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'field_study',
            'title'            => "Training Course (Field Study) — {$trackTitle}",
            'instruction_text' => "Field Study spesialisasi {$trackTitle} memberikan kesempatan verifikasi empiris dan keterlibatan langsung di lapangan bersama praktisi industri, komunitas maritim, dan pakar riset kelautan di Indonesia.\n\nAktivitas Lapangan:\n🌊 Kunjungan langsung ke lokasi penerapan teknologi dan ekosistem {$trackTitle}\n🤝 Diskusi teknis dengan pelaku usaha, regulator, dan komunitas pesisir lokal\n📊 Pengambilan data primer untuk penyempurnaan proyek studi kasus spesialisasi\n🎯 Presentasi hasil pengamatan dan validasi model solusi di hadapan mentor\n\nKonfirmasikan keikutsertaan Anda di bawah ini. Peserta Field Study dibebaskan dari modul Critical Thinking Exam.",
            'max_score'        => 0,
            'is_prerequisite'  => false,
            'order_index'      => 4,
        ]);

        // ── 5. Case-Study Essay Examination — Critical Thinking ─────────────────
        $criticalPrompt = $this->getTrackSpecificCriticalThinkingPrompt($trackTitle);
        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'critical_thinking',
            'title'            => "Case-Study Essay Examination — Critical Thinking ({$trackTitle})",
            'instruction_text' => $criticalPrompt,
            'max_score'        => 100,
            'is_prerequisite'  => false,
            'order_index'      => 5,
        ]);
    }

    private function seedTrackSpecificQuizQuestions(CourseContent $quiz, string $track): void
    {
        $questions = match ($track) {
            'The Blue Carbon'             => $this->getBlueCarbonQuestions(),
            'Blue Business Development'   => $this->getBlueBusinessQuestions(),
            'Blue Data Intelligence'      => $this->getBlueDataQuestions(),
            'Circular Economy'            => $this->getCircularEconomyQuestions(),
            'Blue Community Development'  => $this->getBlueCommunityQuestions(),
            'Blue Farming'                => $this->getBlueFarmingQuestions(),
            'Blue Tourism'                => $this->getBlueTourismQuestions(),
            'Blue Shipping'               => $this->getBlueShippingQuestions(),
            'Blue Finance'                => $this->getBlueFinanceQuestions(),
            'Blue Food & Energy Circular' => $this->getBlueFoodEnergyQuestions(),
            default                       => $this->getDefaultSpecQuestions($track),
        };

        $this->insertQuestionsAndOptions($quiz, $questions);
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  BANK SOAL 10 SPESIALISASI (10 SOAL MASING-MASING @ 10 POIN = 100 POIN)
    // ───────────────────────────────────────────────────────────────────────────

    private function getBlueCarbonQuestions(): array
    {
        return [
            [
                'question' => 'Apa perbedaan mendasar antara mekanisme penyimpanan karbon pada Blue Carbon (mangrove dan lamun) dibandingkan Green Carbon (hutan daratan tropis)?',
                'weight'   => 10,
                'options'  => [
                    ['Sebagian besar karbon biru tersimpan di lapisan sedimen anaerobik dasar yang sangat minim oksigen, sehingga dekomposisi organik berjalan sangat lambat dan karbon terkunci ribuan tahun', true],
                    ['Karbon biru hanya tersimpan di daun dan batang tumbuhan saja serta akan terurai menjadi CO₂ dalam hitungan minggu', false],
                    ['Hutan daratan tidak dapat menyerap karbon sama sekali di dalam struktur biomasanya', false],
                    ['Karbon biru menghasilkan emisi metana yang jauh lebih tinggi daripada hutan rawa gambut daratan', false],
                ],
            ],
            [
                'question' => 'Dalam penyusunan proyek kredit karbon berbasis lahan basah pesisir, prinsip *Additionality* (penambahan) bermakna bahwa:',
                'weight'   => 10,
                'options'  => [
                    ['Penurunan emisi atau penyerapan karbon hanya dapat diklaim sebagai kredit karbon jika proyek tersebut terbukti tidak akan terlaksana tanpa adanya insentif pendanaan karbon', true],
                    ['Setiap pohon mangrove yang ditanam harus memiliki minimal dua cabang tunas tambahan', false],
                    ['Jumlah kredit karbon yang diterbitkan harus selalu bertambah sebesar 10% setiap tahunnya', false],
                    ['Proyek boleh mengklaim kawasan konservasi pemerintah yang sudah eksis tanpa ada aktivitas intervensi baru', false],
                ],
            ],
            [
                'question' => 'Metodologi MRV merupakan pilar utama integritas perdagangan karbon internasional. Kepanjangan dari akronim MRV adalah?',
                'weight'   => 10,
                'options'  => [
                    ['Measurement, Reporting, and Verification (Pengukuran, Pelaporan, dan Verifikasi)', true],
                    ['Management, Restoration, and Valuation (Manajemen, Restorasi, dan Valuasi)', false],
                    ['Maritime Regulation and Validation (Regulasi Maritim dan Validasi)', false],
                    ['Monitoring, Reduction, and Vulnerability (Pemantauan, Reduksi, dan Kerentanan)', false],
                ],
            ],
            [
                'question' => 'Berdasarkan Peraturan Presiden Nomor 98 Tahun 2021 tentang Penyelenggaraan Nilai Ekonomi Karbon (NEK), sistem registri nasional yang mencatat seluruh aksi mitigasi perubahan iklim di Indonesia adalah?',
                'weight'   => 10,
                'options'  => [
                    ['SRN-PPI (Sistem Registri Nasional Pengendalian Perubahan Iklim)', true],
                    ['OJK ESG Portal', false],
                    ['SIMPONI Kementerian Keuangan', false],
                    ['Indonesia Carbon Trading Gateway (ICTG)', false],
                ],
            ],
            [
                'question' => 'Salah satu risiko terbesar proyek karbon adalah *Leakage* (kebocoran). Apa yang dimaksud dengan *leakage* dalam proyek konservasi mangrove?',
                'weight'   => 10,
                'options'  => [
                    ['Perlindungan mangrove di area proyek menyebabkan aktivitas perusakan/pembabatan berpindah ke area mangrove di luar batas proyek yang tidak terlindungi', true],
                    ['Rembesan air laut yang masuk ke dalam tanggul tambak budidaya garam', false],
                    ['Terjadinya kebocoran data digital pada sistem bursa karbon bursa efek', false],
                    ['Keluarnya lumpur sedimen akibat hempasan gelombang tsunami ekstrem', false],
                ],
            ],
            [
                'question' => 'Dalam penghitungan cadangan karbon mangrove menggunakan persamaan alometrik, komponen biomassa manakah yang umumnya menyimpan porsi karbon terbesar?',
                'weight'   => 10,
                'options'  => [
                    ['Karbon tanah/sedimen bawah permukaan (Soil Organic Carbon) hingga kedalaman 1–3 meter', true],
                    ['Biomassa daun yang gugur di atas permukaan tanah (Litterfall)', false],
                    ['Biomassa ranting dan bunga pohon mangrove muda', false],
                    ['Karbon yang larut sementara di dalam air pasang surut (DOC)', false],
                ],
            ],
            [
                'question' => 'Standar sertifikasi karbon sukarela (*voluntary carbon market*) internasional yang menerbitkan metodologi VM0033 untuk restorasi ekosistem lahan basah pasang surut adalah?',
                'weight'   => 10,
                'options'  => [
                    ['Verra (Verified Carbon Standard / VCS)', true],
                    ['Fairtrade International', false],
                    ['Forest Stewardship Council (FSC)', false],
                    ['International Organization for Standardization (ISO 9001)', false],
                ],
            ],
            [
                'question' => 'Bagaimana dampak alih fungsi hutan mangrove menjadi tambak udang intensif terhadap neraca karbon lingkungan?',
                'weight'   => 10,
                'options'  => [
                    ['Memicu oksidasi pirit dan dekomposisi cepat sedimen anaerobik, melepaskan ribuan ton emisi CO₂ yang tersimpan ratusan tahun ke atmosfer', true],
                    ['Meningkatkan kapasitas penyerapan karbon dioksida karena fitoplankton di air tambak berkembang pesat', false],
                    ['Tidak berpengaruh sama sekali terhadap emisi gas rumah kaca', false],
                    ['Menyerap gas metana dari udara secara alami', false],
                ],
            ],
            [
                'question' => 'Padang lamun (*seagrass*) memiliki peran ganda dalam ekosistem karbon biru. Selain menyerap karbon, fungsi biofisik lamun adalah?',
                'weight'   => 10,
                'options'  => [
                    ['Menjebak dan mengendapkan partikel sedimen tersuspensi serta meredam energi gelombang sehingga menstabilkan dasar laut', true],
                    ['Menetralkan kadar garam air laut menjadi air tawar murni', false],
                    ['Mengeluarkan racun alami untuk mematikan fitoplankton berlebih di muara sungai', false],
                    ['Meningkatkan suhu air laut secara konstan untuk mempercepat penetasan telur ikan tuna', false],
                ],
            ],
            [
                'question' => 'Dalam dokumen Enhanced NDC (Nationally Determined Contribution) Indonesia, target pengurangan emisi dari sektor FOLU (Forestry and Other Land Use) termasuk lahan basah pesisir ditargetkan mencapai *net sink* pada tahun berapa?',
                'weight'   => 10,
                'options'  => [
                    ['2030 (Indonesia FOLU Net Sink 2030)', true],
                    ['2045', false],
                    ['2060', false],
                    ['2025', false],
                ],
            ],
        ];
    }

    private function getBlueBusinessQuestions(): array
    {
        return [
            [
                'question' => 'Model bisnis sirkular maritim (Circular Marine Business Model) berfokus pada inovasi rantai nilai yang bertujuan untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Menjaga nilai bahan baku hasil laut dan produk olahannya selama mungkin di dalam siklus ekonomi serta meminimalkan limbah pada setiap mata rantai pasok', true],
                    ['Meningkatkan volume penangkapan ikan sebanyak mungkin tanpa perlu memperhatikan pengolahan limbah sampingan', false],
                    ['Menjual komoditas mentah hasil laut ke luar negeri tanpa sentuhan proses hilirisasi lokal', false],
                    ['Memusatkan seluruh kendali usaha di tangan perusahaan monopoli milik pemerintah daerah', false],
                ],
            ],
            [
                'question' => 'Dalam mengevaluasi kelayakan finansial proyek investasi ekonomi biru, metrik Net Present Value (NPV) dikatakan layak secara investasi apabila:',
                'weight'   => 10,
                'options'  => [
                    ['Nilai NPV lebih besar dari nol (NPV > 0), menunjukkan bahwa arus kas masuk yang didiskontokan melampaui total nilai investasi awal', true],
                    ['Nilai NPV bernilai negatif karena mencerminkan subsidi lingkungan', false],
                    ['Nilai Internal Rate of Return (IRR) lebih kecil daripada suku bunga bebas risiko perbankan', false],
                    ['Waktu pengembalian modal (Payback Period) lebih dari 30 tahun', false],
                ],
            ],
            [
                'question' => 'Sertifikasi ekolabel internasional yang mengakui praktik perikanan tangkap yang dikelola secara berkelanjutan dan meminimalkan dampak lingkungan adalah?',
                'weight'   => 10,
                'options'  => [
                    ['Marine Stewardship Council (MSC)', true],
                    ['LEED Certified Green Building', false],
                    ['Hazard Analysis Critical Control Point (HACCP)', false],
                    ['Rainforest Alliance Agriculture', false],
                ],
            ],
            [
                'question' => 'Apa tantangan paling kritis yang dihadapi startup berbasis teknologi kelautan (*Ocean Tech*) pada fase awal (seed stage)?',
                'weight'   => 10,
                'options'  => [
                    ['Kebutuhan belanja modal (Capex) tinggi untuk pengujian perangkat keras di lingkungan laut yang korosif dan siklus validasi produk yang lebih panjang', true],
                    ['Ketiadaan regulasi izin berusaha dari Kementerian Hukum dan HAM', false],
                    ['Terlalu banyaknya pasokan modal ventura internasional yang berebut mendanai sektor kelautan', false],
                    ['Tidak tersedianya koneksi internet seluler di gedung perkantoran ibu kota', false],
                ],
            ],
            [
                'question' => 'Pemanfaatan teknologi *blockchain* dalam rantai pasok produk perikanan (Fishery Traceability) memberikan keunggulan kompetitif bisnis berupa:',
                'weight'   => 10,
                'options'  => [
                    ['Transparansi data asal-usul ikan (*vessel to table*) yang tidak dapat diubah (*immutable*), menjamin produk berasal dari kapal berizin legal dan bukan hasil IUU Fishing', true],
                    ['Kemampuan mengubah berat timbangan ikan secara otomatis pada saat ekspor', false],
                    ['Penghapusan kewajiban sertifikasi mutu karantina ikan dari kementerian terkait', false],
                    ['Pengurangan tarif pajak penghasilan perusahaan menjadi nol persen', false],
                ],
            ],
            [
                'question' => 'Senyawa aktif *Astaxanthin* yang diekstraksi dari mikroalga laut (*Haematococcus pluvialis*) memiliki nilai jual sangat tinggi di pasar global terutama untuk industri:',
                'weight'   => 10,
                'options'  => [
                    ['Antioksidan farmasi, suplemen nutrisi premium, dan kosmetik anti-penuaan', true],
                    ['Bahan peledak industri tambang mineral bawah tanah', false],
                    ['Pelumas mesin turbin uap pembangkit listrik tenaga batu bara', false],
                    ['Bahan pengawet kayu konstruksi dermaga pelabuhan', false],
                ],
            ],
            [
                'question' => 'Apa yang dimaksud dengan pendekatan *Inclusive Business Model* pada kemitraan rantai pasok industri pengolahan perikanan?',
                'weight'   => 10,
                'options'  => [
                    ['Menjadikan nelayan tradisional skala kecil sebagai mitra setara dengan jaminan harga beli yang adil (*fair trade*), kepastian pasar, dan pendampingan teknologi', true],
                    ['Mewajibkan nelayan menjual seluruh hasil tangkapan dengan harga di bawah standar pasar', false],
                    ['Mengharuskan nelayan menanggung seluruh kerugian kerusakan produk selama pengiriman kontainer ekspor', false],
                    ['Menggantikan seluruh tenaga kerja nelayan lokal dengan tenaga kerja asing dari luar negeri', false],
                ],
            ],
            [
                'question' => 'Konsep *Blended Finance* dalam struktur pendanaan usaha kelautan berkelanjutan merupakan strategi:',
                'weight'   => 10,
                'options'  => [
                    ['Penggabungan dana filantropi atau hibah konsesional (*catalytic capital*) untuk memitigasi risiko awal agar mampu menarik modal investasi komersial swasta skala besar', true],
                    ['Pencampuran mata uang rupiah dan dolar dalam satu rekening giro bank daerah', false],
                    ['Penggunaan 100% pinjaman komersial berbunga tinggi tanpa jaminan agunan', false],
                    ['Pengalihan seluruh aset kas operasional perusahaan ke dalam mata uang kripto', false],
                ],
            ],
            [
                'question' => 'Pada mata rantai logistik dingin (*cold chain*) hasil perikanan, teknologi pendinginan portabel berbasis energi surya sangat penting di pulau kecil untuk mengatasi masalah:',
                'weight'   => 10,
                'options'  => [
                    ['Tingginya susut mutu hasil tangkapan (*post-harvest loss*) akibat keterbatasan pasokan listrik jaringan dan kelangkaan es balok', true],
                    ['Kelebihan muatan kapal feri penyeberangan antarpulau', false],
                    ['Biaya sertifikasi izin berlayar dari syahbandar pelabuhan', false],
                    ['Fluktuasi kurs mata uang asing pada transaksi pasar tradisional', false],
                ],
            ],
            [
                'question' => 'Indikator ESG (Environmental, Social, Governance) menjadi syarat mutlak bagi korporasi maritim modern dalam mengakses pendanaan hijau global. Aspek "Governance" berfokus pada:',
                'weight'   => 10,
                'options'  => [
                    ['Transparansi manajemen, integritas kepatuhan hukum, pencegahan korupsi, dan perlindungan hak-hak pemegang saham minoritas serta mitra usaha', true],
                    ['Pengurangan volume limbah plastik yang dibuang ke laut oleh pabrik', false],
                    ['Pemberian beasiswa pendidikan kepada anak-anak nelayan di sekitar pabrik', false],
                    ['Penggunaan panel surya pada atap gedung kantor pusat', false],
                ],
            ],
        ];
    }

    private function getBlueDataQuestions(): array
    {
        return [
            [
                'question' => 'Dalam penginderaan jauh (*remote sensing*) kelautan, kombinasi data parameter oseanografi apa yang paling efektif untuk menentukan Zona Potensi Penangkapan Ikan (ZPPI)?',
                'weight'   => 10,
                'options'  => [
                    ['Suhu Permukaan Laut (Sea Surface Temperature/SST) dan Konsentrasi Klorofil-a', true],
                    ['Kecepatan angin ketinggian 10.000 meter dan kelembapan udara gurun pasir', false],
                    ['Tingkat keasaman air hujan di perkotaan dan kedalaman air tanah daratan', false],
                    ['Densitas tutupan vegetasi hutan pinus di pegunungan pesisir', false],
                ],
            ],
            [
                'question' => 'Kapal penangkap ikan ilegal sering kali mematikan transponder AIS (Automatic Identification System) untuk menghindari pantauan. Fenomena kapal ini disebut:',
                'weight'   => 10,
                'options'  => [
                    ['*Dark Vessels*', true],
                    ['*Ghost Fleets*', false],
                    ['*Phantom Shippers*', false],
                    ['*Stealth Cargo*', false],
                ],
            ],
            [
                'question' => 'Teknologi satelit radar Synthetic Aperture Radar (SAR) memiliki keunggulan utama dalam pengawasan maritim dibandingkan satelit optik karena:',
                'weight'   => 10,
                'options'  => [
                    ['Mampu menembus tutupan awan tebal dan dapat beroperasi optimal baik pada siang maupun malam hari untuk mendeteksi lambung kapal dan tumpahan minyak', true],
                    ['Dapat merekam suara percakapan awak kapal di ruang kemudi secara langsung', false],
                    ['Menghasilkan citra berwarna alami seperti kamera foto udara konvensional', false],
                    ['Hanya dapat beroperasi jika ada pencahayaan matahari tegak lurus di khatulistiwa', false],
                ],
            ],
            [
                'question' => 'Sensor IoT maritim yang dipasang pada pelampung pemantau (*ocean buoys*) telemetry di kawasan budidaya laut secara *real-time* memantau variabel krusial apa?',
                'weight'   => 10,
                'options'  => [
                    ['Oksigen terlarut (Dissolved Oxygen/DO), pH, salinitas, kekeruhan air (*turbidity*), dan suhu kolom air', true],
                    ['Tekanan ban kendaraan pengangkut pakan di dermaga darat', false],
                    ['Kecepatan transmisi sinyal radio televisi digital nasional', false],
                    ['Kadar keasaman debu atmosfer di kawasan perkantoran pusat kota', false],
                ],
            ],
            [
                'question' => 'Konsep *Digital Twin of the Ocean* (Kembaran Digital Samudra) merujuk pada integrasi teknologi mutakhir berupa:',
                'weight'   => 10,
                'options'  => [
                    ['Model simulasi komputasi digital resolusi tinggi berbasis data riil laut yang mampu mensimulasikan skenario perubahan iklim, sebaran polusi, dan dinamika stok perikanan', true],
                    ['Pembuatan video animasi 3D fiksi tentang biota laut untuk wahana hiburan anak-anak', false],
                    ['Penggandaan dokumen izin berlayar kapal niaga ke dalam dua salinan kertas fisik', false],
                    ['Pemindaian fotokopi peta navigasi laut lama buatan abad ke-18', false],
                ],
            ],
            [
                'question' => 'Kementerian Kelautan dan Perikanan (KKP) mewajibkan kapal perikanan dengan ukuran tertentu memasang VMS. Kepanjangan VMS adalah?',
                'weight'   => 10,
                'options'  => [
                    ['Vessel Monitoring System', true],
                    ['Virtual Marine Simulator', false],
                    ['Variable Maritime Sensor', false],
                    ['Verified Movement Standards', false],
                ],
            ],
            [
                'question' => 'Analisis data spasial menggunakan GIS (Geographic Information System) sangat krusial dalam penyusunan dokumen perencanaan pesisir Indonesia yang dikenal sebagai:',
                'weight'   => 10,
                'options'  => [
                    ['RZWP-3-K (Rencana Zonasi Wilayah Pesisir dan Pulau-Pulau Kecil)', true],
                    ['RUTW (Rencana Umum Tata Wilayah Perkotaan)', false],
                    ['AMDAL Industri Manufaktur Daratan', false],
                    ['Masterplan Kawasan Ekonomi Khusus Pertambangan', false],
                ],
            ],
            [
                'question' => 'Teknologi hidroakustik (*scientific echo-sounder*) dalam penelitian oseanografi perikanan digunakan untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Memperkirakan kelimpahan biomassa, sebaran spasial, dan struktur ukuran stok ikan di kolom perairan melalui pantulan gelombang suara', true],
                    ['Mengukur konsentrasi mikroplastik berukuran mikrometer pada permukaan sedimen laut', false],
                    ['Mengirim pesan suara darurat ke satelit cuaca internasional', false],
                    ['Menghancurkan terumbu karang yang mengganggu jalur kapal cepat', false],
                ],
            ],
            [
                'question' => 'Penerapan algoritma Computer Vision dan Deep Learning pada sistem kamera di kapal penangkap ikan modern berfungsi untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Otomasi pencatatan spesies ikan, estimasi panjang/berat tubuh, dan deteksi tangkapan sampingan (*bycatch*) secara akurat saat penarikan jaring', true],
                    ['Memutar siaran televisi otomatis untuk hiburan anak buah kapal', false],
                    ['Mengontrol arah angin laut agar kapal tidak oleng saat gelombang besar', false],
                    ['Menggantikan seluruh fungsi kemudi mekanis kapal tanpa kapten', false],
                ],
            ],
            [
                'question' => 'Prinsip tata kelola data FAIR (*FAIR Data Principles*) dalam sains data kelautan internasional mewajibkan data penelitian bersifat:',
                'weight'   => 10,
                'options'  => [
                    ['Findable, Accessible, Interoperable, and Reusable (Mudah Ditemukan, Diakses, Dioperasikan Silang, dan Digunakan Kembali)', true],
                    ['Fast, Accurate, Independent, and Restricted (Cepat, Akurat, Mandiri, dan Tertutup Rahasia)', false],
                    ['Financial, Audited, Inspected, and Registered (Terkait Keuangan, Diaudit, Diinspeksi, dan Terdaftar)', false],
                    ['Flexible, Automated, Integrated, and Redundant (Fleksibel, Otomatis, Terpadu, dan Berlebih)', false],
                ],
            ],
        ];
    }

    private function getCircularEconomyQuestions(): array
    {
        return [
            [
                'question' => 'Fenomena *Ghost Fishing* (penangkapan hantu) merupakan ancaman serius ekonomi sirkular maritim yang disebabkan oleh:',
                'weight'   => 10,
                'options'  => [
                    ['Alat tangkap jaring ikan berbahan sintetis yang hilang, terbengkalai, atau dibuang di laut (*ALDFG*) yang terus memerangkap dan membunuh biota laut selama puluhan tahun', true],
                    ['Aktivitas kapal penangkap ikan yang beroperasi tanpa menyalakan lampu pada malam hari', false],
                    ['Penangkapan ikan menggunakan zat racun sianida di kawasan terumbu karang', false],
                    ['Munculnya predator laut berukuran raksasa di dekat pantai wisata', false],
                ],
            ],
            [
                'question' => 'Dalam hierarki pengelolaan limbah sirkular (9R), langkah manakah yang menempati prioritas tertinggi dalam mencegah sampah plastik masuk ke laut?',
                'weight'   => 10,
                'options'  => [
                    ['*Refuse* (Menolak penggunaan plastik sekali pakai yang tidak perlu pada sumbernya)', true],
                    ['*Recycle* (Mendaur ulang kemasan plastik yang sudah terlanjur diproduksi)', false],
                    ['*Recover* (Membakar limbah plastik di tempat pembuangan akhir untuk energi panas)', false],
                    ['*Remanufacture* (Merakit kembali komponen kapal yang rusak di galangan)', false],
                ],
            ],
            [
                'question' => 'Teknologi daur ulang jaring ikan nilon bekas (Poliamida-6) yang dikumpulkan dari pelabuhan perikanan dapat dipolimerisasi ulang menjadi produk bernilai tinggi apa?',
                'weight'   => 10,
                'options'  => [
                    ['Benang tekstil sintetis berkualitas tinggi (seperti Econyl) untuk pakaian renang, karpet komersial, dan kacamata ramah lingkungan', true],
                    ['Aspal jalan raya minyak bumi murni tanpa campuran agregat', false],
                    ['Bahan peledak dinamit untuk penangkapan ikan karang', false],
                    ['Minyak goreng nabati untuk konsumsi rumah tangga pesisir', false],
                ],
            ],
            [
                'question' => 'Kementerian Lingkungan Hidup dan Kehutanan mewajibkan produsen manufaktur mengimplementasikan kebijakan EPR. Kepanjangan dari EPR adalah?',
                'weight'   => 10,
                'options'  => [
                    ['Extended Producer Responsibility (Tanggung Jawab Produsen yang Diperluas)', true],
                    ['Environmental Protection Requirement (Persyaratan Perlindungan Lingkungan)', false],
                    ['Ecological Plastic Recycling (Daur Ulang Plastik Ekologis)', false],
                    ['European Port Regulations (Regulasi Pelabuhan Eropa)', false],
                ],
            ],
            [
                'question' => 'Pengolahan sisa industri perikanan dengan prinsip *Zero Waste Processing* mengonversi jeroan, kepala, dan tulang ikan menjadi:',
                'weight'   => 10,
                'options'  => [
                    ['Minyak ikan kaya asam lemak Omega-3, kolagen kosmetik, hidrolisat protein ikan, dan pupuk organik cair bermutu tinggi', true],
                    ['Bahan bakar briket batu bara sintetis padat', false],
                    ['Detergen pembersih porselen berbahan kimia keras', false],
                    ['Plastik polietilena sekali pakai yang sulit terurai', false],
                ],
            ],
            [
                'question' => 'Inovasi bioplastik berbasis rumput laut (*seaweed-based bioplastics*) memiliki keunggulan kompetitif utama dibandingkan bioplastik berbahan pati jagung/singkong yaitu:',
                'weight'   => 10,
                'options'  => [
                    ['Tidak berkompetisi dengan lahan pertanian pangan daratan, tidak membutuhkan air tawar dan pupuk kimia, serta dapat terurai hayati alami di air laut (*marine biodegradable*)', true],
                    ['Dapat bertahan di air laut selama ratusan tahun tanpa mengalami degradasi struktur', false],
                    ['Memiliki biaya produksi yang jauh lebih murah daripada plastik polimer konvensional berbasis minyak bumi', false],
                    ['Hanya dapat diproduksi di kawasan kutub utara yang dingin', false],
                ],
            ],
            [
                'question' => 'Fasilitas penerimaan limbah pelabuhan (*Port Reception Facilities*) yang diwajibkan oleh Konvensi Internasional MARPOL 73/78 berfungsi untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Menampung dan mengelola residu minyak, air berminyak bilga, sampah padat, dan kotoran dari kapal niaga agar tidak dibuang langsung ke perairan laut', true],
                    ['Menampung ikan hasil tangkapan lelang nelayan tradisional di dermaga', false],
                    ['Menjual suku cadang mesin kapal impor bebas bea masuk pelabuhan', false],
                    ['Memproduksi air tawar kemasan botol untuk kebutuhan awak kapal', false],
                ],
            ],
            [
                'question' => 'Konvensi Pengelolaan Air Balas Kapal (Ballast Water Management Convention) bertujuan mencegah ancaman ekologis serius berupa:',
                'weight'   => 10,
                'options'  => [
                    ['Penyebaran dan introduksi spesies laut asing invasif (*invasive alien species*) antar-ekosistem samudra yang dapat menghancurkan keanekaragaman hayati lokal', true],
                    ['Pemanasan temperatur air laut akibat pembuangan uap boiler kapal', false],
                    ['Pengurangan kadar oksigen atmosfer di sekitar alur pelayaran sempit', false],
                    ['Kenaikan muka air laut global akibat volume air yang dipindahkan kapal', false],
                ],
            ],
            [
                'question' => 'Strategi integrasi pemulung pesisir (*coastal waste pickers*) dan bank sampah bahari ke dalam rantai pasok industri daur ulang formal berkontribusi pada:',
                'weight'   => 10,
                'options'  => [
                    ['Peningkatan angka daur ulang sampah pesisir sekaligus memberikan kepastian pendapatan yang adil dan jaminan keselamatan kerja bagi pekerja sektor informal', true],
                    ['Pelarangan total warga pesisir untuk memilah sampah plastik di tempat tinggalnya', false],
                    ['Kewajiban seluruh sampah pesisir dibuang langsung ke laut dalam menggunakan kapal tongkang', false],
                    ['Penurunan harga jual plastik bekas menjadi nol rupiah di tingkat lapak', false],
                ],
            ],
            [
                'question' => 'Dalam siklus hidup kapal niaga, konvensi internasional Hong Kong Convention (2009) mengatur standar keberlanjutan untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Daur ulang kapal yang aman dan ramah lingkungan (*Safe and Environmentally Sound Recycling of Ships*) untuk mencegah pencemaran bahan berbahaya saat pembongkaran lambung kapal', true],
                    ['Standar minimum gaji kapten kapal pesiar internasional', false],
                    ['Aturan warna cat lambung kapal kargo pengangkut kontainer', false],
                    ['Sistem reservasi tiket feri penumpang antarpulau', false],
                ],
            ],
        ];
    }

    private function getBlueCommunityQuestions(): array
    {
        return [
            [
                'question' => 'Prinsip FPIC merupakan standar perlindungan hak masyarakat hukum adat pesisir yang diakui hukum internasional. FPIC merupakan singkatan dari:',
                'weight'   => 10,
                'options'  => [
                    ['Free, Prior, and Informed Consent (Persetujuan atas Dasar Informasi Awal Tanpa Paksaan)', true],
                    ['Fisheries Protection and Integrated Community', false],
                    ['Formal Partnership for Indigenous Conservation', false],
                    ['Financial Participation in Ocean Investment Capital', false],
                ],
            ],
            [
                'question' => 'Lembaga adat maritim *Panglima Laot* di Provinsi Aceh memiliki kewenangan tradisional dalam hal apa?',
                'weight'   => 10,
                'options'  => [
                    ['Mengatur tata cara penangkapan ikan, memelihara hukum adat laut, menyelesaikan sengketa antarnelayan, dan memimpin upacara adat pantang melaut', true],
                    ['Memungut pajak ekspor minyak mentah lepas pantai untuk pemerintah pusat', false],
                    ['Menjual sertifikat kepemilikan pulau karang kepada korporasi pariwisata swasta', false],
                    ['Menerbitkan paspor pelaut internasional bagi warga negara asing', false],
                ],
            ],
            [
                'question' => 'Mengapa sistem kelembagaan Koperasi Nelayan modern sangat krusial dalam pemberdayaan ekonomi masyarakat pesisir skala kecil?',
                'weight'   => 10,
                'options'  => [
                    ['Meningkatkan daya tawar kolektif nelayan, memutus jeratan rentenir/tengkulak melalui pembiayaan adil, dan memfasilitasi pengadaan sarana produksi bersama', true],
                    ['Mewajibkan nelayan membagikan 50% hasil tangkapan kepada pengurus koperasi tanpa kompensasi', false],
                    ['Melarang anggota koperasi membeli perlengkapan melaut dari toko swasta', false],
                    ['Menggantikan seluruh peran dinas kelautan dan perikanan kabupaten/kota', false],
                ],
            ],
            [
                'question' => 'Pengarusutamaan gender (Gender Mainstreaming) dalam pembangunan masyarakat pesisir menitikberatkan pada pengakuan bahwa:',
                'weight'   => 10,
                'options'  => [
                    ['Perempuan pesisir memegang peranan vital dalam pengelolaan keuangan rumah tangga, pascapanen, pengolahan produk hasil laut, dan pemasaran nilai tambah', true],
                    ['Perempuan dilarang terlibat dalam kegiatan ekonomi perikanan apa pun di desa pesisir', false],
                    ['Seluruh anggota armada kapal penangkap ikan samudra harus berjenis kelamin perempuan', false],
                    ['Peran perempuan di wilayah pesisir hanya terbatas pada urusan domestik tanpa hak berorganisasi', false],
                ],
            ],
            [
                'question' => 'Konsep *Social-Ecological Resilience* (Ketahanan Sosio-Ekologis) masyarakat pesisir diukur berdasarkan kapasitas komunitas untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Menyerap guncangan krisis iklim dan ekonomi, beradaptasi dengan perubahan kondisi perairan, serta mentransformasikan mata pencaharian tanpa merusak daya dukung ekosistem', true],
                    ['Menolak semua bentuk bantuan teknologi modern dan menutup diri dari dunia luar', false],
                    ['Meninggalkan kawasan pesisir secara permanen untuk bermigrasi ke kota metropolitan', false],
                    ['Mengandalkan bantuan sembako dan subsidi darurat dari pemerintah secara terus-menerus', false],
                ],
            ],
            [
                'question' => 'Metodologi Participatory Rural Appraisal (PRA) dalam penyusunan program desa pesisir menekankan pada prinsip:',
                'weight'   => 10,
                'options'  => [
                    ['Masyarakat lokal berperan aktif sebagai subjek utama yang menganalisis masalah, memetakan potensi, dan merancang rencana aksi pembangunan mereka sendiri', true],
                    ['Konsultan dari ibu kota menentukan seluruh daftar proyek tanpa perlu berkonsultasi dengan warga desa', false],
                    ['Penggunaan kuesioner tertutup yang hanya boleh diisi oleh kepala desa dan aparat keamanan', false],
                    ['Pelaksanaan proyek secara rahasia untuk menghindari dinamika politik lokal', false],
                ],
            ],
            [
                'question' => 'Kearifan lokal *Awig-awig* di kalangan masyarakat pesisir Lombok dan Bali mengatur tentang:',
                'weight'   => 10,
                'options'  => [
                    ['Aturan kesepakatan adat bersama mengenai larangan penggunaan alat tangkap merusak (seperti bom dan racun) serta perlindungan terumbu karang komunal', true],
                    ['Tata cara pembangunan hotel megah di atas sempadan pantai publik', false],
                    ['Sistem bagi hasil pertambangan pasir besi pesisir dengan kontraktor luar', false],
                    ['Aturan penjualan tanah ulayat pesisir kepada wisatawan mancanegara', false],
                ],
            ],
            [
                'question' => 'Strategi diversifikasi mata pencaharian alternatif (*alternative livelihoods*) bagi nelayan tradisional sangat krusial pada saat:',
                'weight'   => 10,
                'options'  => [
                    ['Musim ombak besar / paceklik (musim barat/timur) ketika nelayan tidak memungkinkan melaut secara aman, sehingga stabilitas pangan keluarga tetap terjaga', true],
                    ['Terjadi surplus hasil tangkapan ikan tuna di pasar lelang lokal', false],
                    ['Harga bahan bakar solar bersubsidi turun drastis di pangkalan pendaratan ikan', false],
                    ['Pemerintah mengadakan festival tahunan perlombaan perahu hias nelayan', false],
                ],
            ],
            [
                'question' => 'Pembangunan sanitasi ramah lingkungan di permukiman nelayan atas air (*waterfront ecovillage*) bertujuan mengatasi permasalahan darurat apa?',
                'weight'   => 10,
                'options'  => [
                    ['Pencemaran bakteri coliform dan limbah tinja domestik tanpa pengolahan (*blackwater*) yang dibuang langsung ke kolom perairan pantai dangkal', true],
                    ['Tingginya kadar garam pada atap seng rumah warga pesisir', false],
                    ['Ketiadaan lampu hias penerangan jalan di jembatan kayu desa', false],
                    ['Keluarnya aroma khas ikan asin saat proses penjemuran tradisional', false],
                ],
            ],
            [
                'question' => 'Protokol Nagoya mengatur tentang *Access and Benefit-Sharing* (ABS). Dalam konteks keanekaragaman hayati laut pesisir, prinsip ini mewajibkan:',
                'weight'   => 10,
                'options'  => [
                    ['Pembagian keuntungan yang adil dan merata kepada komunitas lokal atas pemanfaatan komersial sumber daya genetik dan pengetahuan tradisional laut mereka', true],
                    ['Penyerahan seluruh hak paten obat-obatan berbahan biota laut kepada negara maju tanpa royalti', false],
                    ['Kewajiban nelayan membayar denda apabila menangkap spesies ikan endemik', false],
                    ['Pelarangan total terhadap seluruh kegiatan riset universitas di wilayah kepulauan', false],
                ],
            ],
        ];
    }

    private function getBlueFarmingQuestions(): array
    {
        return [
            [
                'question' => 'Sistem budidaya perikanan laut terpadu multi-trofik (Integrated Multi-Trophic Aquaculture / IMTA) menciptakan efisiensi ekologis dengan cara:',
                'weight'   => 10,
                'options'  => [
                    ['Menggabungkan spesies target yang diberi pakan (ikan laut) dengan organisme pemakan partikel sisa (kerang) dan penyerap nutrien anorganik (rumput laut) dalam satu kawasan terpadu', true],
                    ['Memelihara spesies predator agresif dalam satu jaring apung dengan benih udang kecil', false],
                    ['Menggunakan antibiotik spektrum luas setiap hari di seluruh kolam budidaya', false],
                    ['Membuang seluruh lumpur dasar tambak ke pantai setiap pergantian air', false],
                ],
            ],
            [
                'question' => 'Metrik Food Conversion Ratio (FCR) merupakan indikator efisiensi pakan pada budidaya akuakultur. Nilai FCR sebesar 1,2 bermakna bahwa:',
                'weight'   => 10,
                'options'  => [
                    ['Dibutuhkan 1,2 kilogram pakan untuk menghasilkan pertambahan 1 kilogram bobot tubuh biomassa ikan/udang', true],
                    ['Ikan bertumbuh sebesar 1,2 kilogram setiap hari secara konstan', false],
                    ['Biaya pakan mencakup 12% dari total biaya operasional tambak', false],
                    ['Sebanyak 12 ekor ikan mati dari setiap 100 ekor benih yang ditebar', false],
                ],
            ],
            [
                'question' => 'Teknologi Bioflok pada budidaya perikanan intensif memanfaatkan mikroorganisme apa untuk mengolah limbah nitrogen beracun menjadi pakan alami berprotein?',
                'weight'   => 10,
                'options'  => [
                    ['Bakteri heterotrof yang distimulasi pertumbuhannya melalui penambahan sumber karbon organik (molase/tepung) dengan menjaga rasio C:N > 10', true],
                    ['Virus bakteriofag yang mematikan seluruh populasi alga di kolom air', false],
                    ['Alga beracun dinoflagellata merah (*Red Tide*)', false],
                    ['Cacing parasit nematoda dasar kolam air payau', false],
                ],
            ],
            [
                'question' => 'Penyakit *Ice-Ice* pada budidaya rumput laut komersial (*Kappaphycus alvarezii*) ditandai dengan pemutihan dan patahnya thallus. Faktor pemicu utamanya adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Stres lingkungan akibat perubahan drastis salinitas air laut, kenaikan suhu permukaan air, dan rendahnya arus perairan', true],
                    ['Serangan kepiting karang pemakan pucuk rumput laut', false],
                    ['Tercemarnya air laut oleh tumpahan aspal minyak mentah', false],
                    ['Pembekuan air laut oleh es kutub di perairan tropis Indonesia', false],
                ],
            ],
            [
                'question' => 'Teknologi Recirculating Aquaculture Systems (RAS) memiliki keunggulan lingkungan paling signifikan dibandingkan sistem kolam konvensional berupa:',
                'weight'   => 10,
                'options'  => [
                    ['Penggunaan kembali air budidaya hingga lebih dari 90–95% melalui filtrasi mekanis, biofilter nitrifikasi, dan sterilisasi UV/Ozon, sehingga sangat hemat air dan minim limbah', true],
                    ['Ketiadaan kebutuhan energi listrik untuk pompa dan aerasi oksigen', false],
                    ['Biaya investasi konstruksi awal yang paling rendah di antara semua metode budidaya', false],
                    ['Kemampuan beroperasi tanpa memerlukan benih ikan bersertifikat', false],
                ],
            ],
            [
                'question' => 'Salah satu tantangan keberlanjutan terbesar industri akuakultur global adalah ketergantungan pada tepung ikan (*fishmeal*). Alternatif bahan baku pakan ramah lingkungan terdepan adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Tepung larva serangga Black Soldier Fly (BSF) dan biomassa mikroalga yang kaya protein serta asam lemak esensial', true],
                    ['Serbuk kayu gergajian pohon jati hutan lindung', false],
                    ['Limbah styrofoam kemasan makanan cepat saji', false],
                    ['Batu kapur kalsium karbonat giling tanpa nutrisi', false],
                ],
            ],
            [
                'question' => 'Mengapa kerang-kerangan (Bivalvia seperti tiram dan kerang hijau) dikategorikan sebagai komoditas budidaya Blue Farming paling ramah lingkungan?',
                'weight'   => 10,
                'options'  => [
                    ['Merupakan organisme pemakan saring (*filter feeder*) yang memakan fitoplankton alami di air laut tanpa memerlukan pakan buatan komersial dan menyerap karbon ke cangkangnya', true],
                    ['Membutuhkan pasokan antibiotik dosis tinggi agar cepat berkembang biak', false],
                    ['Membutuhkan pemanasan air laut menggunakan pemanas listrik bertenaga diesel', false],
                    ['Menghasilkan limbah kotoran pelet beracun di dasar perairan', false],
                ],
            ],
            [
                'question' => 'Penerapan Instalasi Pengolahan Air Limbah (IPAL) pada tambak udang intensif wajib menyertakan kolam sedimentasi dan kolam bio-filter sebelum air dibuang ke laut guna mencegah:',
                'weight'   => 10,
                'options'  => [
                    ['Eutrofikasi (pengayaan nutrisi fosfat/nitrat berlebih) yang memicu *Harmful Algal Blooms* (HABs) dan penurunan kadar oksigen drastis di perairan pantai', true],
                    ['Kenaikan kadar garam air laut di muara sungai', false],
                    ['Terjadinya gempa bumi tektonik bawah laut di sekitar kawasan pesisir', false],
                    ['Masuknya kapal ikan berukuran besar ke dalam saluran irigasi tambak', false],
                ],
            ],
            [
                'question' => 'Penyakit AHPND (Acute Hepatopancreatic Necrosis Disease) atau EMS yang menyerang budidaya udang vaname disebabkan oleh patogen bakteri apa?',
                'weight'   => 10,
                'options'  => [
                    ['*Vibrio parahaemolyticus* galur virulen yang membawa plasmid toksin mematikan', true],
                    ['*Escherichia coli* non-patogenik dari air hujan', false],
                    ['*Lactobacillus acidophilus* yang digunakan pada pembuatan yogurt', false],
                    ['*Spirulina platensis* yang mengapung di permukaan kolam', false],
                ],
            ],
            [
                'question' => 'Sertifikasi nasional resmi yang dikeluarkan oleh Kementerian Kelautan dan Perikanan untuk menjamin unit usaha budidaya memenuhi standar biosekuriti, keamanan pangan, dan kelestarian lingkungan adalah:',
                'weight'   => 10,
                'options'  => [
                    ['CBIB (Cara Budidaya Ikan yang Baik)', true],
                    ['SNI Bangunan Gedung Bertingkat', false],
                    ['Surat Izin Mengemudi Kapal Nelayan', false],
                    ['Sertifikat Laik Operasi Menara Telekomunikasi', false],
                ],
            ],
        ];
    }

    private function getBlueTourismQuestions(): array
    {
        return [
            [
                'question' => 'Dalam konsep daya dukung pariwisata bahari (*Tourism Carrying Capacity*), Physical Carrying Capacity (PCC) didefinisikan sebagai:',
                'weight'   => 10,
                'options'  => [
                    ['Jumlah maksimum wisatawan yang secara fisik dapat ditampung dalam ruang dan waktu tertentu di suatu destinasi pesisir/pantai', true],
                    ['Kekuatan fisik pemandu wisata dalam mengawal penyelaman di laut dalam', false],
                    ['Daya tahan struktur beton dermaga terhadap terjangan ombak badai', false],
                    ['Kapasitas muatan bagasi pesawat terbang rute kepulauan', false],
                ],
            ],
            [
                'question' => 'Pedoman Green Fins yang diadopsi oleh UNEP dalam industri wisata selam (*scuba diving*) secara tegas melarang penyelam untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Menyentuh karang, menginjak terumbu karang hidup, memprovokasi biota laut, dan menggunakan sarung tangan pelindung yang mendorong kontak fisik dengan karang', true],
                    ['Menggunakan tabung udara bertekanan standar internasional', false],
                    ['Menyewa pemandu selam lokal yang memiliki sertifikat instruktur resmi', false],
                    ['Mengambil foto terumbu karang menggunakan kamera bawah air tanpa lampu kilat', false],
                ],
            ],
            [
                'question' => 'Pada sistem zonasi Kawasan Konservasi Perairan (KKP), zona manakah yang mutlak ditutup dari seluruh aktivitas pariwisata dan penangkapan ikan komersial demi perlindungan mutlak plasma nutfah?',
                'weight'   => 10,
                'options'  => [
                    ['Zona Inti (*Core Zone*)', true],
                    ['Zona Pemanfaatan Terbatas (*Limited Utilization Zone*)', false],
                    ['Zona Perikanan Berkelanjutan', false],
                    ['Zona Rehabilitasi Pesisir Terbuka', false],
                ],
            ],
            [
                'question' => 'Model pariwisata berbasis masyarakat (Community-Based Marine Tourism / CBMT) menjamin keberlanjutan destinasi bahari dengan cara:',
                'weight'   => 10,
                'options'  => [
                    ['Masyarakat lokal memiliki kendali kepemilikan usaha (homestay, kuliner, atraksi), mengambil keputusan manajemen, dan menikmati mayoritas perputaran ekonomi wisata', true],
                    ['Menyerahkan 100% pengelolaan pulau wisata kepada pengembang resor asing eksklusif', false],
                    ['Menutup kawasan wisata bagi warga lokal dan hanya melayani turis kapal pesiar mewah', false],
                    ['Menghapus seluruh kearifan budaya dan tradisi pesisir demi menyerupai destinasi luar negeri', false],
                ],
            ],
            [
                'question' => 'Penerapan retribusi jasa lingkungan (*Environmental / Conservation Fee*) pada tiket masuk taman nasional laut bertujuan untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Menyediakan dana abadi mandiri untuk pembiayaan patroli pengawasan, pengelolaan sampah wisatawan, dan restorasi terumbu karang di kawasan konservasi', true],
                    ['Membeli armada mobil dinas mewah bagi pejabat birokrasi ibu kota', false],
                    ['Mensubsidi harga tiket pesawat kelas bisnis bagi pelancong asing', false],
                    ['Menghilangkan kewajiban audit anggaran pendapatan daerah tahunan', false],
                ],
            ],
            [
                'question' => 'Aktivitas wisata mengamati lumba-lumba atau hiu paus (*whale shark tourism*) yang bertanggung jawab wajib mematuhi aturan etika:',
                'weight'   => 10,
                'options'  => [
                    ['Menjaga jarak aman minimal perahu mesin (minimal 50–100 meter), mematikan baling-baling saat mendekat, tidak mengejar kawanan, dan melarang menyentuh satwa', true],
                    ['Memberi makan roti dan mie instan setiap hari agar satwa tidak berpindah lokasi', false],
                    ['Memasang tali pengikat pada sirip ekor lumba-lumba untuk atraksi sirkus', false],
                    ['Menyalakan sirine kapal dengan volume maksimal untuk memanggil kawanan mamalia laut', false],
                ],
            ],
            [
                'question' => 'Konsep *Citizen Science* pada industri ekowisata bahari memberikan peluang bagi wisatawan untuk berkontribusi langsung melalui:',
                'weight'   => 10,
                'options'  => [
                    ['Membantu pengumpulan data keanekaragaman hayati (seperti foto identifikasi pola totol hiu paus atau pari manta) yang diunggah ke basis data sains global', true],
                    ['Mengambil spesimen karang hidup langka untuk diawetkan di rumah pribadi', false],
                    ['Membuat peraturan perundang-undangan hukum pidana kelautan sendiri', false],
                    ['Mengemudikan kapal patroli pengawas perikanan tanpa izin syahbandar', false],
                ],
            ],
            [
                'question' => 'Polusi cahaya (*light pollution*) dari lampu resor di tepi pantai sangat berbahaya bagi kelestarian penyu laut karena:',
                'weight'   => 10,
                'options'  => [
                    ['Membingungkan tukik (bayi penyu) yang baru menetas sehingga bergerak menuju daratan ke arah lampu alih-alih menuju pantulan cahaya bulan di laut lepas', true],
                    ['Menaikkan suhu pasir pantai hingga membuat cangkang telur penyu meleleh', false],
                    ['Mempercepat pertumbuhan cangkang penyu dewasa menjadi terlalu berat untuk berenang', false],
                    ['Mengubah warna kulit penyu dari hijau zaitun menjadi transparan', false],
                ],
            ],
            [
                'question' => 'Standar sertifikasi global terdepan untuk pariwisata berkelanjutan yang diakui oleh UN Tourism adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Global Sustainable Tourism Council (GSTC)', true],
                    ['International Maritime Organization (IMO Certification)', false],
                    ['World Trade Organization Trade Standard', false],
                    ['Federal Aviation Administration (FAA Marine)', false],
                ],
            ],
            [
                'question' => 'Untuk mencegah dampak buruk *overtourism* pada ekosistem pulau-pulau kecil (seperti di Pulau Komodo atau Raja Ampat), instrumen manajemen terbaik adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Penerapan sistem reservasi digital kuota harian pengunjung (*carrying capacity pacing*) yang terintegrasi dengan pemantauan kesehatan terumbu karang berkala', true],
                    ['Pembangunan bandara internasional berkapasitas 10 juta penumpang di atas terumbu karang hidup', false],
                    ['Pemberian diskon tiket promosi besar-besaran pada musim puncak liburan sekolah', false],
                    ['Penghapusan pos pemeriksaan karantina dan tiket konservasi di pintu masuk pelabuhan', false],
                ],
            ],
        ];
    }

    private function getBlueShippingQuestions(): array
    {
        return [
            [
                'question' => 'Regulasi IMO 2020 Sulphur Cap yang ditetapkan oleh International Maritime Organization secara drastis membatasi kandungan sulfur pada bahan bakar kapal laut dari 3,5% m/m menjadi:',
                'weight'   => 10,
                'options'  => [
                    ['Maksimal 0,50% m/m (dan 0,10% m/m di kawasan Emission Control Areas/ECA)', true],
                    ['Maksimal 2,00% m/m', false],
                    ['Maksimal 10,00% m/m', false],
                    ['Bebas tanpa batasan selama berlayar di laut lepas internasional', false],
                ],
            ],
            [
                'question' => 'Indikator EEXI (Energy Efficiency Existing Ship Index) yang diwajibkan oleh MARPOL Annex VI diberlakukan untuk mengukur:',
                'weight'   => 10,
                'options'  => [
                    ['Efisiensi energi teknis armada kapal yang sudah beroperasi (*existing ships*) dibandingkan dengan nilai garis dasar emisi CO₂ yang dipersyaratkan IMO', true],
                    ['Tingkat kecepatan maksimal kapal kargo saat menghadapi gelombang badai', false],
                    ['Jumlah total muatan kontainer kosong yang dapat diangkut kapal kargo', false],
                    ['Efisiensi konsumsi air minum awak kapal selama pelayaran samudra', false],
                ],
            ],
            [
                'question' => 'Teknologi *Cold Ironing* atau *Onshore Power Supply* (OPS) di pelabuhan laut ramah lingkungan (*Green Port*) bekerja dengan cara:',
                'weight'   => 10,
                'options'  => [
                    ['Menghubungkan kapal yang sedang bersandar ke jaringan listrik darat sehingga mesin bantu (*auxiliary diesel engine*) kapal dapat dimatikan, mengeliminasi emisi lokal di dermaga', true],
                    ['Mendinginkan lambung kapal menggunakan balok es sebelum memuat kargo', false],
                    ['Membekukan air limbah kapal menjadi balok padat untuk dibuang ke darat', false],
                    ['Mengganti cat lambung kapal dengan lapisan baja nirkarat tahan es kutub', false],
                ],
            ],
            [
                'question' => 'Bahan bakar nol karbon masa depan yang paling menjanjikan untuk kapal pelayaran jarak jauh tanpa emisi CO₂ langsung dari cerobong pembakaran adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Amonia Hijau (*Green Ammonia*) dan Metanol Hijau (*Green Methanol*) yang diproduksi menggunakan hidrogen terbarukan', true],
                    ['Bahan bakar minyak solar bersubsidi kadar sulfur tinggi', false],
                    ['Batubara antrasit murni yang dihancurkan menjadi bubuk serbuk', false],
                    ['Gas alam cair (LNG) tanpa sistem penangkap emisi metana lolos (*methane slip*)', false],
                ],
            ],
            [
                'question' => 'Sistem propulsi bantuan angin (*Wind-Assisted Ship Propulsion* seperti Rotor Flettner atau Layar Kaku/Rigid Wingsails) mampu menghemat konsumsi bahan bakar kapal niaga sebesar:',
                'weight'   => 10,
                'options'  => [
                    ['5% hingga 20% melalui pemanfaatan gaya aerodinamis angin (*Magnus effect* atau gaya angkat aerofoil) saat berlayar di laut terbuka', true],
                    ['100% secara mutlak di segala arah angin tanpa perlu mesin utama sama sekali', false],
                    ['Kurang dari 0,01% sehingga tidak memiliki kelayakan komersial', false],
                    ['Hanya berfungsi jika kapal ditarik oleh kawanan paus samudra', false],
                ],
            ],
            [
                'question' => 'Teknologi *Air Lubrication System* pada lambung kapal niaga mengurangi hambatan gesek (*frictional resistance*) dengan air laut melalui mekanisme:',
                'weight'   => 10,
                'options'  => [
                    ['Mengalirkan jutaan gelembung udara mikro secara kontinu di sepanjang pelat dasar lambung kapal sehingga mengurangi gesekan permukaan dengan air laut', true],
                    ['Menyemprotkan minyak pelumas silikon cair ke kolom air laut di sekitar lambung', false],
                    ['Mengangkat seluruh badan kapal melayang di atas bantalan magnetik rel kereta', false],
                    ['Mengecat lambung kapal dengan lilin parafin setebal satu meter', false],
                ],
            ],
            [
                'question' => 'Carbon Intensity Indicator (CII) merupakan peringkat operasional tahunan yang dikeluarkan IMO bagi kapal niaga berukuran besar. Peringkat efisiensi karbon CII dinyatakan dalam skala:',
                'weight'   => 10,
                'options'  => [
                    ['Skala huruf A sampai E (di mana kapal berperingkat D selama 3 tahun berturut-turut atau peringkat E wajib menyusun rencana perbaikan korektif SEEMP)', true],
                    ['Skala angka desimal 1 sampai 100 tanpa konsekuensi regulasi', false],
                    ['Peringkat warna sabuk bela diri internasional', false],
                    ['Klasifikasi bintang hotel bintang satu hingga bintang lima', false],
                ],
            ],
            [
                'question' => 'Inisiatif *Green Shipping Corridors* (Koridor Pelayaran Hijau) yang disepakati dalam Deklarasi Clydebank bertujuan untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Menciptakan rute pelayaran maritim khusus antarpelabuhan utama dunia yang bebas emisi melalui penyediaan rantai pasok bahan bakar hijau dan infrastruktur pelabuhan terintegrasi', true],
                    ['Mengecat seluruh mercusuar di sepanjang selat internasional dengan cat hijau neon', false],
                    ['Membatasi alur pelayaran kapal hanya boleh melewati perairan dangkal pinggir pantai', false],
                    ['Melarang kapal asing melintasi alur laut kepulauan Indonesia pada hari libur nasional', false],
                ],
            ],
            [
                'question' => 'Standar Green Port Rating di Indonesia menilai kinerja pelabuhan ramah lingkungan berdasarkan parameter utama apa?',
                'weight'   => 10,
                'options'  => [
                    ['Efisiensi energi dermaga, pengendalian emisi udara pelabuhan, pengelolaan limbah cair/padat kapal, kesiapsiagaan tumpahan minyak (*oil spill response*), dan digitalisasi alur logistik', true],
                    ['Jumlah total toko cinderamata dan restoran cepat saji di dalam terminal penumpang', false],
                    ['Tingkat kedalaman kolam labuh buatan tanpa memedulikan sedimentasi terumbu karang', false],
                    ['Volume penjualan tiket penyeberangan kapal cepat secara manual dengan uang tunai', false],
                ],
            ],
            [
                'question' => 'Metode manajemen kecepatan kapal (*Slow Steaming*) terbukti mampu memangkas konsumsi bahan bakar dan emisi emisi karbon secara signifikan karena:',
                'weight'   => 10,
                'options'  => [
                    ['Konsumsi bahan bakar mesin kapal berbanding pangkat tiga (kubik) terhadap kecepatan kapal (*Cubic Law of Power and Speed*), sehingga sedikit penurunan kecepatan memangkas konsumsi bahan bakar secara drastis', true],
                    ['Mesin kapal otomatis beralih menggunakan tenaga baterai lithium saat kapal berlayar lambat', false],
                    ['Arus laut selalu mendorong kapal ke arah tujuan tanpa hambatan gesek saat kapal bergerak perlahan', false],
                    ['Awak kapal dapat mematikan radar navigasi utama saat kapal berlayar santai', false],
                ],
            ],
        ];
    }

    private function getBlueFinanceQuestions(): array
    {
        return [
            [
                'question' => 'Instrumen Obligasi Biru (Blue Bond) secara spesifik didefinisikan sebagai instrumen surat utang yang hasil penerbitan dananya (*proceeds*) wajib digunakan khusus untuk:',
                'weight'   => 10,
                'options'  => [
                    ['Membiayai atau membiayai kembali (*refinancing*) proyek-proyek kelautan dan perairan berkelanjutan, seperti restorasi ekosistem pesisir, perikanan lestari, energi laut, dan pengelolaan limbah plastik', true],
                    ['Menutup defisit anggaran belanja rutin aparatur sipil negara di kementerian keuangan', false],
                    ['Membeli armada kapal selam perang militer untuk pertahanan laut terluar', false],
                    ['Memberikan pinjaman spekulatif valuta asing kepada pedagang valas swasta', false],
                ],
            ],
            [
                'question' => 'Prinsip panduan internasional yang diterbitkan oleh UNEP Finance Initiative untuk memastikan integritas pendanaan kelautan berkelanjutan adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Sustainable Blue Economy Finance Principles (SBEFP)', true],
                    ['Equator Principles for Mining Extraction', false],
                    ['Basel III Accord for Capital Adequacy', false],
                    ['Financial Action Task Force Recommendations', false],
                ],
            ],
            [
                'question' => 'Mekanisme *Debt-for-Nature Swap* (Pertukaran Utang dengan Konservasi Alam) dalam konteks Blue Economy dilakukan melalui:',
                'weight'   => 10,
                'options'  => [
                    ['Restrukturisasi atau pemotongan sebagian utang luar negeri suatu negara dengan komitmen bahwa penghematan pembayaran utang tersebut dialihkan untuk mendanai perlindungan laut dan kawasan konservasi perairan', true],
                    ['Penyitaan seluruh pulau terluar oleh negara kreditur sebagai ganti pelunasan utang macet', false],
                    ['Pembayaran utang menggunakan mata uang komoditas ikan asin kering curah', false],
                    ['Penghapusan seluruh utang luar negeri tanpa syarat dan tanpa komitmen lingkungan', false],
                ],
            ],
            [
                'question' => 'Instrumen Asuransi Parametrik Terumbu Karang (*Parametric Coral Reef Insurance*) bekerja dengan mekanisme klaim unik berupa:',
                'weight'   => 10,
                'options'  => [
                    ['Dana asuransi dicairkan secara instan otomatis ketika parameter fisik terukur (seperti kecepatan angin siklon topan melampaui ambang batas tertentu) terpenuhi, untuk mendanai restorasi darurat karang tanpa menunggu proses taksasi klaim panjang', true],
                    ['Klaim hanya dibayarkan jika ada kapal kargo asing yang terbukti menabrak karang hingga tenggelam', false],
                    ['Pembayaran premi asuransi menggunakan bibit karang hidup hasil transplantasi', false],
                    ['Klaim asuransi hanya mencakup biaya pengobatan luka bagi penyelam yang terkena bulu babi', false],
                ],
            ],
            [
                'question' => 'Prinsip *Do No Significant Harm* (DNSH) dalam Taksonomi Keuangan Berkelanjutan Indonesia (TKBI) mewajibkan bahwa proyek yang didanai:',
                'weight'   => 10,
                'options'  => [
                    ['Tidak boleh menimbulkan dampak degradasi lingkungan yang signifikan terhadap tujuan keberlanjutan lainnya (misalnya proyek tambak udang tidak boleh membabat mangrove)', true],
                    ['Harus menjamin keuntungan imbal hasil finansial minimal 50% dalam tahun pertama operasional', false],
                    ['Boleh mengabaikan izin lingkungan selama proyek menyerap tenaga kerja lokal dalam jumlah besar', false],
                    ['Hanya berlaku bagi proyek yang berlokasi di dalam kawasan perkotaan metropolitan', false],
                ],
            ],
            [
                'question' => 'Pada struktur pembiayaan campuran (*Blended Finance*), fungsi modal filantropi atau *First-Loss Guarantee* (Jaminan Kerugian Pertama) adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Menyerap risiko kerugian pertama jika proyek gagal, sehingga profil risiko proyek menurun dan menarik perbankan komersial untuk masuk menyalurkan kredit', true],
                    ['Membayar gaji bonus bagi manajemen puncak korporasi peminjam', false],
                    ['Menghapus kewajiban pengembalian pokok pinjaman bagi seluruh peminjam', false],
                    ['Menjual aset jaminan debitur sebelum proyek mulai dibangun di lapangan', false],
                ],
            ],
            [
                'question' => 'Pemerintah Republik Indonesia mencetak sejarah pada tahun 2023 dengan menerbitkan Sovereign Blue Bond pertama di pasar publik internasional dalam denominasi mata uang:',
                'weight'   => 10,
                'options'  => [
                    ['Yen Jepang (Samurai Bond) senilai 20,7 miliar Yen di bursa Tokyo', true],
                    ['Dolar Amerika Serikat di bursa New York', false],
                    ['Poundsterling di bursa London', false],
                    ['Euro di bursa Frankfurt Jerman', false],
                ],
            ],
            [
                'question' => 'Tantangan struktural paling nyata dalam pembiayaan sektor usaha kelautan skala kecil (Small-Scale Marine Enterprises) oleh perbankan konvensional adalah:',
                'weight'   => 10,
                'options'  => [
                    ['Tingginya persepsi risiko (volatilitas cuaca/musim), ketiadaan aset agunan formal bersertifikat tanah, dan skala proyek yang terfragmentasi (*pipeline aggregation challenge*)', true],
                    ['Tingginya suku bunga acuan bank sentral internasional yang melarang pinjaman perikanan', false],
                    ['Ketidakinginan masyarakat nelayan untuk menerima fasilitas permodalan usaha', false],
                    ['Larangan OJK bagi perbankan nasional untuk mendanai usaha berbasis kelautan', false],
                ],
            ],
            [
                'question' => 'Lembaga Keuangan Mikro Biru (*Blue Microfinance*) menyalurkan pembiayaan khusus bagi nelayan dan pembudidaya pesisir dengan skema inovatif seperti:',
                'weight'   => 10,
                'options'  => [
                    ['Tanggung renteng kelompok (*group lending*), jadwal pembayaran fleksibel menyesuaikan musim tangkap/panen, dan integrasi dengan asuransi cuaca mikro', true],
                    ['Penyitaan perahu nelayan secara sepihak saat gelombang laut sedang tinggi', false],
                    ['Penetapan bunga pinjaman harian sebesar 20% seperti praktik rentenir keliling', false],
                    ['Kewajiban kepemilikan sertifikat deposito berjangka minimal satu miliar rupiah', false],
                ],
            ],
            [
                'question' => 'Praktik manipulasi pemasaran di mana suatu korporasi mengklaim proyek investasinya ramah lingkungan laut padahal sebenarnya merusak ekosistem pesisir disebut:',
                'weight'   => 10,
                'options'  => [
                    ['*Blue-washing*', true],
                    ['*Green-hedging*', false],
                    ['*Ocean-factoring*', false],
                    ['*Marine-arbitrage*', false],
                ],
            ],
        ];
    }

    private function getBlueFoodEnergyQuestions(): array
    {
        return [
            [
                'question' => 'Pembangkit Listrik Tenaga Arus Laut (PLTAL) memiliki potensi teoretis sangat besar di perairan Indonesia karena memanfaatkan energi kinetik dari:',
                'weight'   => 10,
                'options'  => [
                    ['Arus pasang surut air laut yang mengalir deras di selat-selat sempit antarpulau (seperti Selat Larantuka, Selat Alas, dan Selat Pantar)', true],
                    ['Aliran sungai air tawar di daratan sebelum mencapai muara pantai', false],
                    ['Angin puting beliung yang terjadi di atas permukaan samudra', false],
                    ['Gelombang panas matahari yang memanaskan pasir pesisir pada siang hari', false],
                ],
            ],
            [
                'question' => 'Teknologi Ocean Thermal Energy Conversion (OTEC) menghasilkan energi listrik bersih dengan mengeksploitasi perbedaan temperatur antara:',
                'weight'   => 10,
                'options'  => [
                    ['Air laut permukaan yang hangat (sekitar 25–29°C) dan air laut dalam yang dingin (sekitar 4–6°C pada kedalaman 800–1.000 meter) dengan selisih minimal 20°C', true],
                    ['Air laut kutub es dan air tawar sungai tropis', false],
                    ['Uap air boiler kapal dan air es pendingin kabin mesin', false],
                    ['Suhu udara pantai siang hari dan suhu udara malam hari', false],
                ],
            ],
            [
                'question' => 'Istilah *Blue Foods* (Pangan Biru) merujuk pada keunggulan gizi pangan berbasis perairan yang berkelanjutan, yaitu:',
                'weight'   => 10,
                'options'  => [
                    ['Kaya akan mikronutrien esensial (vitamin A, B12, zat besi, zinc, dan Omega-3 DHA/EPA) dengan jejak emisi karbon dan kebutuhan lahan air tawar yang jauh lebih rendah daripada protein ternak darat', true],
                    ['Semua jenis makanan yang diberi zat pewarna sintetis biru cerah', false],
                    ['Pangan kalengan impor yang diawetkan dengan senyawa natrium nitrit dosis tinggi', false],
                    ['Makanan beku siap saji yang dipanaskan di dalam oven gelombang mikro', false],
                ],
            ],
            [
                'question' => 'Mikroalga *Spirulina* (*Arthrospira platensis*) dikembangkan secara luas dalam program fortifikasi pangan pesisir karena keunggulannya berupa:',
                'weight'   => 10,
                'options'  => [
                    ['Kandungan protein sangat tinggi (mencapai 60–70% berat kering), asam amino lengkap, dan antioksidan fikosianin untuk pencegahan stunting pada anak pesisir', true],
                    ['Kandungan lemak jenuh tinggi yang setara dengan minyak kelapa sawit mentah', false],
                    ['Kemampuan menggantikan fungsi garam dapur murni secara langsung', false],
                    ['Dapat tumbuh optimal di tempat gelap tanpa memerlukan cahaya fotosintesis', false],
                ],
            ],
            [
                'question' => 'Pemanfaatan Air Laut Dalam (*Deep Sea Water* / DSW) yang diambil dari kedalaman lebih dari 200–500 meter memiliki nilai ekonomis tinggi karena sifat alaminya yang:',
                'weight'   => 10,
                'options'  => [
                    ['Sangat murni bebas bakteri patogen, kaya akan nutrien anorganik (nitrat/fosfat), bertemperatur dingin stabil, dan kaya mineral laut seimbang', true],
                    ['Mengandung kadar minyak bumi mentah yang siap disuling menjadi bahan bakar bensin', false],
                    ['Memiliki tingkat keasaman ekstrem yang mampu melarutkan logam berat limbah industri', false],
                    ['Bebas dari kadar garam sehingga dapat langsung diminum tanpa proses desalinasi', false],
                ],
            ],
            [
                'question' => 'Pembangkit Listrik Tenaga Gelombang Laut (PLTGL) bertipe Oscillating Water Column (OWC) mengubah energi kinetik ombak laut menjadi listrik melalui perantara:',
                'weight'   => 10,
                'options'  => [
                    ['Kolom udara tertutup di atas permukaan air yang terkompresi dan terdekompresi oleh naik-turunnya gelombang ombak untuk memutar turbin udara dua arah (*Wells Turbine*)', true],
                    ['Pemanasan kumparan tembaga secara langsung oleh gesekan air laut', false],
                    ['Pembakaran gas metana yang terperangkap di buih gelombang pantai', false],
                    ['Penampungan air laut di waduk pegunungan untuk dialirkan ke kincir air kayu', false],
                ],
            ],
            [
                'question' => 'Konsep *Integrated Solar-Marine Ice Maker* di pulau-pulau kecil terluar menciptakan sirkularitas energi dan rantai pasok pangan dengan cara:',
                'weight'   => 10,
                'options'  => [
                    ['Memanfaatkan panel surya fotovoltaik atau energi arus laut untuk memproduksi es balok/slurry ice secara mandiri guna mendinginkan hasil tangkapan nelayan tanpa bergantung pada pasokan BBM diesel', true],
                    ['Mencairkan es kutub untuk disemprotkan ke kapal nelayan yang melintas', false],
                    ['Mengimpor es batu dari kota besar setiap hari menggunakan helikopter sewaan', false],
                    ['Mengganti fungsi es dengan bahan kimia formalin agar ikan tidak membusuk', false],
                ],
            ],
            [
                'question' => 'Biomassa limbah rumput laut sisa ekstraksi agar-agar dan karaginan dapat diintegrasikan ke dalam ekonomi sirkular energi sebagai bahan baku pembuatan:',
                'weight'   => 10,
                'options'  => [
                    ['Bioetanol generasi ketiga dan biogas melalui fermentasi anaerobik polisakarida rumput laut', true],
                    ['Bahan bakar avtur sintetis untuk pesawat jet supersonik militer', false],
                    ['Baterai asam timbal untuk kendaraan bermotor roda dua konvensional', false],
                    ['Minyak pelumas transmisi otomatis mobil balap formula', false],
                ],
            ],
            [
                'question' => 'Sistem desalinasi air laut bertenaga energi terbarukan (*Solar Desalination / SWRO*) memecahkan masalah krusial di pulau-pulau kecil yaitu:',
                'weight'   => 10,
                'options'  => [
                    ['Penyediaan air minum dan air tawar bersih yang layak konsumsi bagi masyarakat pesisir tanpa menimbulkan ketergantungan pada kapal tongkang pengangkut air dari daratan utama', true],
                    ['Kelebihan pasokan air tawar tanah yang menggenangi permukiman nelayan', false],
                    ['Penurunan salinitas laut yang menyebabkan ikan karang berpindah habitat', false],
                    ['Peningkatan curah hujan badai tropis di kawasan khatulistiwa', false],
                ],
            ],
            [
                'question' => 'Model *Zero-Emission Self-Sustaining Island* (Pulau Mandiri Emisi Nol) menyatukan sistem pulau kecil terpadu dengan pilar utama berupa:',
                'weight'   => 10,
                'options'  => [
                    ['Kombinasi energi laut/surya terbarukan, desalinasi air tawar bersih, budidaya pangan laut sirkular (IMTA), dan pengelolaan limbah organik menjadi kompos/energi biogas', true],
                    ['Pembangunan pembangkit listrik tenaga nuklir raksasa di atas terumbu karang hidup', false],
                    ['Pengalihan seluruh aktivitas warga menjadi pekerja tambang pasir laut ekspor', false],
                    ['Penutupan pulau dari seluruh akses telekomunikasi dan transportasi laut', false],
                ],
            ],
        ];
    }

    private function getDefaultSpecQuestions(string $track): array
    {
        return [
            [
                'question' => "Prinsip utama yang membedakan pendekatan {$track} dalam Blue Economy dari pendekatan eksploitatif konvensional adalah?",
                'weight'   => 10,
                'options'  => [
                    ['Integrasi keberlanjutan ekologis dengan pembangunan ekonomi maritim yang inklusif, adil, dan berbasis daya dukung lingkungan', true],
                    ['Fokus pada profit finansial jangka pendek tanpa mempertimbangkan kelestarian habitat', false],
                    ['Eksploitasi sumber daya secara intensif sebelum regulasi pemerintah diberlakukan', false],
                    ['Sentralisasi seluruh kegiatan usaha di tangan korporasi konglomerasi besar', false],
                ],
            ],
            [
                'question' => "Dalam konteks {$track}, pilar utama yang wajib dijaga untuk menjamin keberlanjutan jangka panjang adalah:",
                'weight'   => 10,
                'options'  => [
                    ['Daya dukung lingkungan (carrying capacity) dan keterlibatan aktif masyarakat pesisir lokal', true],
                    ['Pengurangan alokasi anggaran pemeliharaan habitat maritim dan konservasi perairan', false],
                    ['Penggunaan alat-alat kerja yang tidak ramah lingkungan untuk menekan biaya produksi', false],
                    ['Penghapusan seluruh mekanisme transparansi dan audit kepatuhan lingkungan hidup', false],
                ],
            ],
            [
                'question' => "Target PBB yang menjadi landasan paling fundamental dalam implementasi proyek {$track} adalah:",
                'weight'   => 10,
                'options'  => [
                    ['SDG 14: Life Below Water & SDG 13: Climate Action', true],
                    ['SDG 7: Affordable and Clean Energy saja tanpa keterkaitan dengan laut', false],
                    ['SDG 1: No Poverty tanpa memperhatikan aspek keberlanjutan sumber daya alam', false],
                    ['SDG 9: Industry and Infrastructure berbasis ekstraksi bahan bakar fosil', false],
                ],
            ],
            [
                'question' => "Langkah strategis pertama dalam menyusun roadmap implementasi {$track} berkelanjutan di Indonesia adalah:",
                'weight'   => 10,
                'options'  => [
                    ['Penilaian baseline sains ekologis, pemetaan pemangku kepentingan (*stakeholders*), dan mitigasi risiko lingkungan', true],
                    ['Langsung meluncurkan proyek komersial skala besar tanpa kajian ilmiah awal', false],
                    ['Menyerahkan seluruh aset pengelolaan kepada entitas asing tanpa alih teknologi', false],
                    ['Menunggu ketersediaan dana hibah luar negeri tanpa inisiatif aksi mandiri', false],
                ],
            ],
            [
                'question' => "Indikator keberhasilan utama dari proyek {$track} dalam kerangka ekonomi sirkular adalah:",
                'weight'   => 10,
                'options'  => [
                    ['Terciptanya nilai tambah ekonomi baru yang berkeadilan seraya meminimalkan limbah dan memulihkan kesehatan ekosistem laut', true],
                    ['Volume limbah industri yang dibuang langsung ke laut dalam jumlah maksimal', false],
                    ['Tingginya ketergantungan nelayan pada pinjaman rentenir informal', false],
                    ['Penurunan keanekaragaman hayati spesies laut di sekitar area proyek', false],
                ],
            ],
            [
                'question' => "Prinsip kehati-hatian (*Precautionary Approach*) dalam operasional {$track} menegaskan bahwa:",
                'weight'   => 10,
                'options'  => [
                    ['Ketiadaan kepastian ilmiah tidak boleh menjadi alasan menunda upaya pencegahan kerusakan lingkungan laut', true],
                    ['Semua proyek boleh mengabaikan AMDAL selama menguntungkan pemilik modal', false],
                    ['Pencegahan kerusakan lingkungan hanya dilakukan jika ada sanksi denda hukum', false],
                    ['Riset ilmiah kelautan tidak diperlukan dalam pengambilan keputusan usaha', false],
                ],
            ],
            [
                'question' => "Model pendanaan berkelanjutan yang paling adaptif untuk mendukung ekspansi {$track} di pulau kecil adalah:",
                'weight'   => 10,
                'options'  => [
                    ['*Blended Finance* yang memadukan dana katalitik filantropi dengan investasi komersial bertanggung jawab', true],
                    ['Pinjaman rentenir berbunga harian tinggi tanpa pengawasan perbankan', false],
                    ['Ketergantungan 100% pada utang komersial jangka pendek berisiko tinggi', false],
                    ['Penjualan obligasi tanpa kejelasan alokasi peruntukan proyek hijau (*blue-washing*)', false],
                ],
            ],
            [
                'question' => "Integrasi kearifan lokal masyarakat hukum adat pesisir dalam {$track} berfungsi untuk:",
                'weight'   => 10,
                'options'  => [
                    ['Memperkuat legitimasi sosial, memperkaya strategi konservasi berbasis bukti lokal, dan mencegah konflik tenurial', true],
                    ['Menghilangkan hak-hak adat masyarakat pesisir atas ruang laut mereka', false],
                    ['Menggantikan seluruh kaidah hukum positif negara dengan aturan informal', false],
                    ['Memperlambat laju pembangunan ekonomi daerah pesisir secara permanen', false],
                ],
            ],
            [
                'question' => "Penerapan sistem ketertelusuran (*traceability*) digital pada rantai pasok {$track} bertujuan untuk:",
                'weight'   => 10,
                'options'  => [
                    ['Menjamin legalitas bahan baku, memenuhi kepatuhan standar pasar ekspor, dan meningkatkan kepercayaan konsumen', true],
                    ['Menyembunyikan informasi asal-usul produk dari pengawasan otoritas karantina', false],
                    ['Menaikkan tarif bea masuk kepabeanan secara sepihak', false],
                    ['Menghambat perdagangan antarpulau bagi nelayan tradisional', false],
                ],
            ],
            [
                'question' => "Pilar *Governance* (Tata Kelola) dalam implementasi {$track} menuntut adanya:",
                'weight'   => 10,
                'options'  => [
                    ['Transparansi proses pengambilan keputusan, akuntabilitas audit berkala, dan partisipasi bermakna seluruh pemangku kepentingan', true],
                    ['Sentralisasi kekuasaan mutlak tanpa mekanisme pengawasan independen', false],
                    ['Kerahasiaan seluruh data dampak lingkungan hidup dari pantauan publik', false],
                    ['Penghapusan kewajiban pelaporan berkala kepada dinas kelautan dan perikanan', false],
                ],
            ],
        ];
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  NASKAH SOAL ESAY STUDI KASUS & CRITICAL THINKING 10 SPESIALISASI
    // ───────────────────────────────────────────────────────────────────────────

    private function getTrackSpecificEssayPrompt(string $track): string
    {
        return match ($track) {
            'The Blue Carbon' => "### Studi Kasus: Valuasi Ekonomi Karbon Biru & Perancangan Proyek Restorasi Mangrove Skema Karbon Sukarela di Berau, Kalimantan Timur

#### Latar Belakang Masalah
Kawasan pesisir Delta Berau memiliki hutan mangrove seluas 45.000 hektar dengan potensi stok karbon tanah mencapai 850 ton C/ha. Namun, dalam satu dekade terakhir, sekitar 12.000 hektar telah terfragmentasi akibat ekspansi tambak udang tradisional dan pembukaan lahan industri. Pemerintah daerah bersama konsorsium masyarakat lokal berniat mengajukan proyek restorasi karbon biru ke pasar karbon sukarela (*Voluntary Carbon Market*) dengan standar Verra VCS (VM0033) untuk mendanai pemulihan ekosistem seluas 5.000 hektar sekaligus membuka lapangan kerja hijau (*green jobs*) bagi masyarakat lokal.

#### Tugas Peserta:
Sebagai seorang spesialis *The Blue Carbon*, susunlah naskah dokumen kajian komprehensif (minimal 500 kata) yang menjawab 3 pertanyaan pokok:

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

            'Circular Economy' => "### Studi Kasus: Transformasi Rantai Nilai Pengelolaan Sampah Jaring Ikan (*Ghost Nets*) dan Plastik Pesisir Menjadi Produk Nilai Tambah di Kepulauan Seribu

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

    private function getTrackSpecificCriticalThinkingPrompt(string $track): string
    {
        return "### Ujian Analisis Kritis: Telaah Kebijakan, Tantangan Struktural, dan Arah Masa Depan {$track}

*Catatan: Modul ini diperuntukkan bagi peserta spesialisasi {$track} yang TIDAK mengikuti kegiatan Field Study.*

#### Latar Belakang Telaah Kritis
Implementasi inisiatif {$track} di negara berkembang seperti Indonesia sering kali menghadapi benturan antara target pertumbuhan ekonomi jangka pendek, keterbatasan kapasitas fiskal daerah, dan komitmen konservasi jangka panjang.

#### Tugas Peserta:
Tuliskan telaah kritis mendalam (minimal 500 kata) yang menguraikan:
1. **Evaluasi Kritis Kebijakan Terkini**: Tinjau secara objektif efektivitas regulasi pemerintah Indonesia yang ada saat ini terkait sektor {$track}. Di mana letak kesenjangan (*regulatory gaps*) antara kebijakan di atas kertas dengan implementasi penegakan hukum di lapangan?
2. **Dilema Sosial-Ekonomi & Keadilan Distribusi**: Siapakah pihak yang paling diuntungkan dan pihak yang paling rentan dirugikan oleh proyek-proyek skala besar di bidang {$track}? Bagaimana memastikan agar masyarakat nelayan dan kelompok rentan di pesisir tidak terpinggirkan (*just transition*)?
3. **Rekomendasi Berbasis Bukti (*Evidence-Based Recommendations*)**: Rancang 3 rekomendasi kebijakan strategis yang aplikatif bagi pengambil kebijakan nasional untuk mempercepat transformasi {$track} menuju ekonomi laut yang tangguh, berdaulat, dan berkeadilan iklim.";
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  HELPER INSERTION
    // ───────────────────────────────────────────────────────────────────────────

    private function insertQuestionsAndOptions(CourseContent $quiz, array $questions): void
    {
        foreach ($questions as $qIndex => $qData) {
            $question = QuizQuestion::create([
                'content_id'    => $quiz->id,
                'question_text' => $qData['question'],
                'weight_score'  => (int) ($qData['weight'] ?? 10),
                'order_index'   => $qIndex + 1,
            ]);

            foreach ($qData['options'] as $oIndex => $opt) {
                QuizOption::create([
                    'question_id' => $question->id,
                    'option_text' => $opt[0],
                    'is_correct'  => (bool) $opt[1],
                    'order_index' => $oIndex + 1,
                ]);
            }
        }
    }
}
