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

        // 1. Learning Module 1
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'pdf_module',
            'title' => 'Modul 1: Pengantar dan Konsep Fundamental Blue Economy',
            'file_path' => $savedPdfPath,
            'instruction_text' => "Pelajari materi pengantar dan konsep fundamental ekonomi biru pada modul interaktif berikut sebelum melanjutkan ke modul berikutnya.",
            'content_body' => "## Modul 1: Pengantar dan Konsep Fundamental Blue Economy

Ekonomi Biru (*Blue Economy*) adalah pemanfaatan sumber daya laut secara berkelanjutan untuk pertumbuhan ekonomi, peningkatan mata pencaharian, dan lapangan kerja, sekaligus menjaga kesehatan ekosistem laut. Berbeda dengan model ekonomi konvensional (*brown/business-as-usual economy*), Ekonomi Biru mengintegrasikan kelestarian lingkungan dengan produktivitas ekonomi pesisir dan kelautan.

### Prinsip Utama Ekonomi Biru:
- **Keberlanjutan Ekologis**: Tidak mengeksploitasi sumber daya melebihi kapasitas regenerasi alam.
- **Keadilan Sosial & Inklusivitas**: Menempatkan nelayan tradisional dan komunitas pesisir sebagai aktor utama.
- **Efisiensi Sumber Daya & Zero Waste**: Menerapkan prinsip ekonomi sirkular pada pengolahan produk hasil laut.
- **Ketahanan Iklim**: Mengoptimalkan peran ekosistem laut sebagai penyerap karbon alami (*Blue Carbon*).

### Pilar Transformasi Ekonomi Biru di Indonesia:
1. **Perluasan Kawasan Konservasi Perairan**: Menargetkan perlindungan 30% wilayah perairan laut pada 2045 untuk memulihkan stok ikan dan keanekaragaman hayati.
2. **Penangkapan Ikan Terukur (PIT)**: Kebijakan kuota berbasis zona tangkap WPPNRI demi mencegah overfishing dan praktik IUU Fishing.
3. **Pengembangan Budidaya Ramah Lingkungan**: Mendorong komoditas unggulan seperti rumput laut, udang, kepiting, dan lobster dengan teknologi biosekuriti.
4. **Pengawasan Pesisir dan Pulau-Pulau Kecil**: Menjaga kedaulatan laut serta mencegah kerusakan habitat akibat aktivitas destruktif.
5. **Pembersihan Sampah Plastik Laut**: Mengurangi timbulan sampah plastik laut hingga 70% melalui aksi sirkular darat dan laut.",
            'max_score' => 0,
            'is_prerequisite' => true,
            'order_index' => 1,
        ]);

        // 2. Learning Module 2
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'pdf_module',
            'title' => 'Modul 2: Ekosistem Pesisir & Valuasi Ekonomi (Blue Carbon)',
            'file_path' => $savedPdfPath,
            'instruction_text' => "Pelajari karakteristik ekosistem pesisir, potensi penyerapan karbon biru, dan metode valuasi ekonomi total pada modul berikut.",
            'content_body' => "## Modul 2: Ekosistem Pesisir & Valuasi Ekonomi (Blue Carbon)

Indonesia merupakan rumah bagi 20% hutan mangrove dunia dan padang lamun terluas di kawasan Indo-Pasifik. Ekosistem ini memiliki kemampuan menyerap karbon hingga **4–10 kali lipat** lebih efektif per hektar dibandingkan hutan terestrial tropis.

### Tiga Ekosistem Penyangga Pesisir:
1. **Hutan Mangrove**: Penahan abrasi alami, tempat pemijahan ikan (*nursery ground*), dan penyimpan cadangan karbon tanah (*soil carbon*).
2. **Padang Lamun (*Seagrass*)**: Menstabilkan sedimen dasar laut, menyaring air, dan habitat dugong serta penyu.
3. **Terumbu Karang**: Benteng pemecah ombak dari badai serta episentrum keanekaragaman hayati laut (*Coral Triangle*).

### Valuasi Ekonomi Total (*Total Economic Value - TEV*):
Valuasi Ekonomi Total dari ekosistem pesisir terbagi menjadi beberapa komponen utama:
- **Direct Use Value**: Pemanfaatan langsung berupa perikanan tangkap, budidaya, kayu mangrove lestari, dan ekowisata bahari.
- **Indirect Use Value**: Manfaat tidak langsung seperti perlindungan pantai dari abrasi badai, mitigasi tsunami, retensi hara, dan penyerapan gas rumah kaca (*carbon sequestration*).
- **Option Value**: Nilai opsi masa depan dari keanekaragaman genetik biota laut untuk farmasi dan bioteknologi.
- **Non-Use / Existence Value**: Nilai keberadaan dan warisan (*bequest value*) ekosistem laut yang dilestarikan untuk generasi mendatang.",
            'max_score' => 0,
            'is_prerequisite' => false,
            'order_index' => 2,
        ]);

        // 3. Learning Module 3
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'pdf_module',
            'title' => 'Modul 3: Tata Kelola Maritim, Target SDG 14 & Pembiayaan Biru (Blue Finance)',
            'file_path' => $savedPdfPath,
            'instruction_text' => "Pelajari kerangka hukum maritim internasional, target SDG 14, serta instrumen pembiayaan inovatif (Blue Bond & Blended Finance) pada modul berikut.",
            'content_body' => "## Modul 3: Tata Kelola Maritim, Target SDG 14 & Pembiayaan Biru (Blue Finance)

Implementasi Ekonomi Biru di Indonesia berakar kuat pada **Tujuan Pembangunan Berkelanjutan (SDG 14: Life Below Water)** dan instrumen hukum internasional **UNCLOS 1982**.

### Kerangka Tata Kelola Maritim:
- **SDG 14.1**: Mencegah dan secara signifikan mengurangi pencemaran laut, terutama dari sampah plastik daratan.
- **SDG 14.4 & 14.6**: Menghentikan penangkapan ikan berlebih (*overfishing*), praktik *Illegal, Unreported, and Unregulated (IUU) Fishing*, serta menghapus subsidi penangkapan yang merusak.
- **Zonasi WPPNRI**: Pengelolaan Wilayah Pengelolaan Perikanan Negara Republik Indonesia yang terbagi menjadi 11 zona perikanan tangkap berbasis sains (*Maximum Sustainable Yield*).

### Inovasi Pembiayaan Biru (*Blue Finance*):
Transisi menuju ekonomi kelautan yang berkelanjutan membutuhkan mobilisasi permodalan yang masif. Indonesia telah memelopori penerbitan instrumen keuangan inovatif:
- **Sovereign Blue Bond**: Surat utang negara berstandar internasional yang dialokasikan khusus untuk proyek konservasi laut, perlindungan keanekaragaman hayati, dan sanitasi pesisir.
- **Blended Finance**: Penggabungan dana filantropi, hibah donor internasional, dan investasi komersial untuk menekan risiko investasi pada proyek kelautan tahap awal.
- **Pasar Karbon Biru (*Carbon Offset*)**: Skema sertifikasi karbon berbasis mangrove dan lamun yang dapat diperdagangkan di bursa karbon resmi.",
            'max_score' => 0,
            'is_prerequisite' => false,
            'order_index' => 3,
        ]);

        // 2. Multiple-Choice Examination (30 Soal, Total Bobot 100 Poin)
        $quiz = CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'mcq_quiz',
            'title' => 'Multiple-Choice Examination — Foundation Level',
            'instruction_text' => "Kerjakan semua soal ujian pilihan ganda berikut dengan teliti.\n\nPetunjuk Ujian:\n• Terdiri dari 30 butir soal pilihan ganda seputar Blue Economy, Blue Carbon, Blue Finance, dan Tata Kelola Maritim.\n• Total bobot nilai ujian adalah 100 poin (Skala 0 - 100).\n• Nilai minimum kelulusan: 70 dari 100.\n• Pilih satu jawaban yang paling tepat (A, B, C, atau D).\n• Jika belum memenuhi batas kelulusan, Anda dapat mengulang ujian kembali.",
            'max_score' => 100,
            'is_prerequisite' => false,
            'order_index' => 4,
        ]);

        $this->seedFoundationQuestions($quiz);

        // 5. Case-Study Essay Submission
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
            'order_index' => 5,
        ]);

        // 6. Oral Exam: Case Study (English or Indonesia)
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'oral_video_task',
            'title' => 'Oral Exam: Case Study (English or Indonesia)',
            'instruction_text' => "### Oral Exam: Case Study (English or Indonesia)

#### Oral Examination Instructions:
1. **Record your answers** by creating a video explanation.
2. **Deliver your explanation** in either Indonesian or English.
3. **Ensure the video duration** is between 3–5 minutes.
4. **Upload your video** to Google Drive or YouTube (can be set to *Unlisted* or *Public*).
5. **Set link permissions** to *\"Anyone with the link can view\"* (if using Google Drive) so assessors can review and watch your submission.
6. **Copy and paste** your video URL link in the submission form below.

---

### Case Study Details
**Case Title:** Plastic Waste Pollution in Indonesian Coastal Waters and Its Impact on Marine Ecosystems (2026)

#### Case Description:
Indonesia is known as one of the world’s largest maritime countries with rich marine biodiversity and extensive coastal resources. However, marine pollution, especially plastic waste, has become a serious environmental challenge in many coastal areas across Indonesia.

In early 2026, large amounts of plastic waste were found floating and accumulating along several coastal regions, including Jakarta Bay, Bali, and parts of Sulawesi. Environmental organizations reported that the waste came from household garbage, tourism activities, fishing operations, and poor waste management systems.

Marine scientists warned that plastic pollution could threaten marine ecosystems and biodiversity. Sea animals such as turtles, fish, dolphins, and seabirds may accidentally consume plastic waste or become trapped in it. In addition, microplastics have also been detected in fish and seafood consumed by humans.

The problem has raised concerns among environmental activists, researchers, and local communities because Indonesia’s coastal economy highly depends on fisheries, tourism, and marine resources. Many experts believe that stronger cooperation between government, industries, and society is needed to reduce marine pollution and protect ocean sustainability.

#### Questions to Address:
**A. Critical Understanding**
1. Explain why plastic waste in the ocean is considered a serious environmental issue for Indonesia.
2. Describe how plastic pollution can affect marine animals and coastal ecosystems.

**B. Analytical Thinking**
3. Analyze how human activities contribute to the increase of plastic waste in marine environments.
4. Explain the possible relationship between poor waste management systems and the condition of Indonesia’s coastal waters.

**C. Evaluation and Reasoning**
5. In your opinion, who should be most responsible for reducing marine plastic pollution: government, industries, or society? Explain your reasoning.
6. Evaluate the impact of marine plastic pollution on Indonesia’s economy, especially in fisheries and tourism sectors.
7. Do you think public awareness about marine environmental protection in Indonesia is already sufficient? Why or why not?

**D. Problem Solving and Decision Making**
8. If you were an environmental policymaker, what steps would you take to reduce plastic pollution in coastal areas?
9. Propose three practical solutions that local communities can implement to help protect marine ecosystems from plastic waste.
10. Imagine you are part of a youth environmental organization. Create a short action plan to educate society about reducing plastic waste and protecting the ocean.",
            'max_score' => 100,
            'is_prerequisite' => false,
            'order_index' => 6,
        ]);

        // 7. Training Course (Field Study)
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'field_study',
            'title' => 'Training Course (Field Study)',
            'instruction_text' => "Field Study adalah komponen praktikum lapangan terpadu program Foundation Level DigiBlueCamp.\n\nAktivitas Lapangan:\n🌊 Observasi habitat pesisir dan verifikasi baseline ekosistem mangrove/lamun\n🤝 Dialog interaktif dengan kelompok nelayan dan pengelola kawasan konservasi laut\n📊 Pengambilan data primer sosial-ekonomi pesisir\n🎯 Diskusi kelompok terarah (FGD) dan perumusan rekomendasi praktis\n\nSilakan konfirmasikan keikutsertaan Anda di bawah ini. Peserta yang mengikuti Field Study secara otomatis dibebaskan dari modul Critical Thinking Exam.",
            'max_score' => 0,
            'is_prerequisite' => false,
            'order_index' => 7,
        ]);

        // 8. Case-Study Essay Examination — Critical Thinking
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
            'order_index' => 8,
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
    //  SPECIALIZATION LEVEL (10 TRACKS) — 3 MODUL & 1 ESSAY (TANPA MCQ)
    // ═══════════════════════════════════════════════════════════════════════════

    private function seedSpecializationLevel(Course $course): void
    {
        $trackTitle = str_replace('CBEc Specialization — ', '', $course->title);

        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => 'Program Spesialisasi — ' . $trackTitle,
            'order_index' => 1,
        ]);

        // 3 Learning Modules
        $modules = $this->getSpecializationModules($trackTitle);
        foreach ($modules as $idx => $mod) {
            CourseContent::create([
                'section_id' => $section->id,
                'content_type' => 'pdf_module',
                'title' => $mod['title'],
                'instruction_text' => $mod['instruction'],
                'content_body' => $mod['body'],
                'max_score' => 0,
                'is_prerequisite' => $idx === 0,
                'order_index' => $idx + 1,
            ]);
        }

        // 4. Case-Study Essay Submission (Ujian Komprehensif Spesialisasi)
        $essayPrompt = $this->getTrackSpecificEssayPrompt($trackTitle);
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'essay_task',
            'title' => "Case-Study Essay Submission — {$trackTitle}",
            'instruction_text' => $essayPrompt,
            'max_score' => 100,
            'is_prerequisite' => false,
            'order_index' => 4,
        ]);

        // 5. Training Course (Field Study)
        CourseContent::create([
            'section_id' => $section->id,
            'content_type' => 'field_study',
            'title' => "Training Course (Field Study) — {$trackTitle}",
            'instruction_text' => "Field Study adalah komponen praktikum lapangan terpadu program Spesialisasi DigiBlueCamp ({$trackTitle}).\n\n🎯 Fokus Praktikum Lapangan:\n🌊 Observasi dan validasi langsung implementasi peminatan {$trackTitle} di kawasan pesisir/maritim.\n🤝 Dialog interaktif dan pendalaman studi kasus bersama praktisi, industri, serta masyarakat pesisir.\n📊 Pengumpulan data primer lapangan dan verifikasi instrumen teknis peminatan.\n💡 Perumusan rekomendasi strategis & presentasi hasil observasi lapangan.\n\n📌 **Ketentuan Keikutsertaan & Sertifikat:**\n• **Jika Anda mengikuti Field Study**: Anda akan memperoleh **2 Sertifikat Resmi** (Sertifikat CBEc Specialization + Sertifikat Field Study Specialization).\n• **Jika Anda TIDAK mengikuti Field Study**: Anda hanya akan memperoleh **1 Sertifikat Resmi** (Sertifikat CBEc Specialization) dan tidak mendapatkan sertifikat Field Study Specialization.\n\nSilakan konfirmasikan keikutsertaan Anda di bawah ini.",
            'max_score' => 0,
            'is_prerequisite' => false,
            'order_index' => 5,
        ]);
    }

    private function getSpecializationModules(string $track): array
    {
        return match ($track) {
            'The Blue Carbon', 'Blue Carbon' => [
                [
                    'title' => "Modul 1: Konsep Fundamental Karbon Biru & Ekologi Pesisir — {$track}",
                    'instruction' => "Pelajari karakteristik ekosistem penyerap karbon pesisir, peranan mangrove dan padang lamun, serta dinamika cadangan karbon tanah (Soil Organic Carbon) pada modul berikut.",
                    'body' => "## Modul 1: Konsep Fundamental Karbon Biru & Ekologi Pesisir

Karbon Biru (*Blue Carbon*) merujuk pada karbon biologis yang ditangkap dan disimpan oleh ekosistem vegetasi pesisir dan laut, terutama hutan mangrove, rawa asin (*salt marshes*), dan padang lamun (*seagrass meadows*). Ekosistem ini merupakan salah satu penyerap karbon alami paling produktif di biosfer bumi.

### 1. Karakteristik & Efisiensi Penyerapan Karbon Pesisir:
- **Laju Penyerapan Cepat**: Hutan mangrove dan padang lamun menyerap karbon hingga **4–10 kali lebih cepat** per hektar dibandingkan hutan terestrial primer tropis.
- **Penyimpanan Jangka Panjang**: Berbeda dengan hutan darat yang menyimpan sebagian besar karbon pada biomassa kayu (yang rentan terlepas saat kebakaran), ekosistem pesisir mengubur hingga 70–90% karbon ke dalam sedimen tanah anaerobik (*soil carbon pool*) yang dapat bertahan selama ribuan tahun tanpa membusuk.
- **Kondisi Tanah Anaerobik**: Rendahnya kadar oksigen dalam tanah jenuh air memperlambat proses dekomposisi mikroorganisme, menjaga karbon tetap terkunci dalam matriks sedimen.

### 2. Tiga Ekosistem Kunci Blue Carbon di Indonesia:
1. **Hutan Mangrove**: Indonesia memiliki sekitar 3,36 juta hektar mangrove (sekitar 20% total global), menyimpan perkiraan 3,14 miliar metrik ton CO₂e.
2. **Padang Lamun (*Seagrass*)**: Menempati area seluas 300.000 hektar di perairan dangkal nusantara, menstabilkan dasar laut dan menyaring nutrien.
3. **Estuaria & Rawa Payau**: Zona transisi produktif yang mengendapkan limpasan karbon organik dari daratan sebelum mencapai laut lepas.

### 3. Ancaman & Dampak Emisi Gas Rumah Kaca:
Kerusakan dan konversi lahan pesisir melepaskan kembali karbon yang tersimpan selama berabad-abad ke atmosfer dalam bentuk emisi CO₂ masif, mengubah ekosistem penyerap (*carbon sink*) menjadi sumber emisi (*carbon source*).",
                ],
                [
                    'title' => "Modul 2: Metodologi MRV & Standar Internasional Karbon — {$track}",
                    'instruction' => "Pelajari protokol pengukuran, pelaporan, dan verifikasi (MRV) cadangan karbon, penentuan baseline, serta kepatuhan standar internasional (Verra VCS) dan regulasi nasional (SRN-PPI).",
                    'body' => "## Modul 2: Metodologi MRV & Standar Internasional Karbon

Integritas kredit karbon biru sangat bergantung pada ketatnya metodologi pengukuran (*Measurement*), pelaporan (*Reporting*), dan verifikasi independen (*Verification*) atau MRV.

### 1. Komponen Penghitungan Cadangan Karbon (Carbon Pools):
- **Aboveground Biomass (AGB)**: Batang, dahan, dan daun mangrove yang diukur menggunakan persamaan alometrik berbasis diameter setinggi dada (*Diameter at Breast Height - DBH*).
- **Belowground Biomass (BGB)**: Sistem perakaran tunjang dan nafas mangrove yang diestimasi melalui rasio akar-tajuk (*root-to-shoot ratio*).
- **Soil Organic Carbon (SOC)**: Cadangan karbon dalam lapisan tanah sedimen (kedalaman 0–100 cm atau lebih) yang diambil menggunakan coring sampler dan dianalisis di laboratorium (*Loss on Ignition / Elemental Analyzer*).

### 2. Prinsip Integritas Karbon:
- **Baseline Emisi**: Proyeksi emisi historis apabila proyek tidak dilakukan (*Business As Usual*).
- **Additionality (Penambahan)**: Proyek harus membuktikan bahwa penyerapan atau pengurangan emisi tidak akan terjadi tanpa adanya insentif pembiayaan karbon.
- **Mitigasi Kebocoran (*Leakage*)**: Menghindari pergeseran aktivitas perusakan (misal deforestasi mangrove) ke area di luar batas proyek (*project boundary*).
- **Permanence & Buffer Pool**: Menyisihkan cadangan kredit risiko (*non-permanence risk buffer*) untuk memitigasi risiko kegagalan biologis atau bencana abrasi badai.

### 3. Standar & Kepatuhan Regulasi:
- **Verra VCS Metodologi VM0033**: Standar global restorasi lahan basah pasang surut dan lamun.
- **Sistem Registri Nasional Pengendalian Perubahan Iklim (SRN-PPI)**: Registri wajib KLHK RI sesuai Perpres 98/2021 tentang Nilai Ekonomi Karbon (NEK).",
                ],
                [
                    'title' => "Modul 3: Desain Proyek Restorasi & Benefit Sharing — {$track}",
                    'instruction' => "Pelajari tahapan penyusunan dokumen desain proyek (PDD), mekanisme pembagian manfaat (Benefit-Sharing Mechanism) bagi masyarakat pesisir, dan strategi monetisasi pasar karbon.",
                    'body' => "## Modul 3: Desain Proyek Restorasi & Benefit Sharing

Pengembangan proyek karbon biru bukan sekadar instrumen finansial, melainkan sarana peningkatan ketahanan iklim masyarakat pesisir dan restorasi habitat alami.

### 1. Tahapan Pengembangan Proyek Karbon Biru:
1. **Studi Kelayakan (*Feasibility Study*)**: Penilaian luasan lahan, kepemilikan tanah/hak kelola perairan, potensi stok karbon, dan estimasi biaya CapEx/OpEx.
2. **Penyusunan Project Design Document (PDD)**: Dokumen teknis komprehensif yang menjabarkan metodologi baseline, additionality, safeguard sosial dan lingkungan.
3. **Validasi & Registrasi**: Audit independen oleh Lembaga Validasi/Verifikasi (LVV) terakreditasi sebelum didaftarkan pada SRN-PPI atau Verra Registry.
4. **Monitoring Berkala & Penerbitan Sertifikat**: Pengukuran lapangan tahunan untuk menerbitkan Sertifikat Pengurangan Emisi Gas Rumah Kaca (SPE-GRK).

### 2. Mekanisme Pembagian Manfaat (*Benefit-Sharing Mechanism*):
- Menjamin keadilan distributif bagi nelayan tradisional dan masyarakat hukum adat di sekitar proyek.
- Alokasi dana hasil penjualan kredit dialirkan untuk fasilitas publik desa (sekolah, sarana air bersih, perahu patroli masyarakat).
- Pembentukan unit usaha desa (BUMDes/Koperasi) sebagai mitra operasional penanaman dan pemeliharaan bibit mangrove.

### 3. Aspek Komersial & Pasar Karbon:
Perdagangan kredit karbon dapat dilakukan melalui bursa karbon resmi (IDX Carbon) atau pasar sukarela bilateral dengan harga premium (*Blue Carbon Premium*) karena membawa ko-manfaat keanekaragaman hayati dan pengentasan kemiskinan pesisir.",
                ],
            ],

            'Blue Business Development' => [
                [
                    'title' => "Modul 1: Kerangka Operasional & Business Model Canvas Ekonomi Biru — {$track}",
                    'instruction' => "Pelajari prinsip perancangan model bisnis maritim modern, Value Proposition produk kelautan berkelanjutan, dan pemetaan segmen pasar biru.",
                    'body' => "## Modul 1: Kerangka Operasional & Business Model Canvas Ekonomi Biru

Pembangunan bisnis kelautan modern menuntut pergeseran dari sekadar eksploitasi ekstraktif menjadi model penciptaan nilai tambah berkelanjutan (*sustainable value creation*).

### 1. Prinsip Bisnis Ekonomi Biru:
- **Pemanfaatan Berkelanjutan**: Kapasitas produksi tidak melampaui batas daya dukung biologis (*carrying capacity*).
- **Penciptaan Nilai Lokal**: Menghindari ekspor bahan mentah tanpa pengolahan; mengutamakan pengolahan bernilai tambah di daerah pesisir.
- **Integrasi Sirkular**: Memanfaatkan hasil samping (*by-products*) dan limbah pengolahan menjadi produk bernilai ekonomi.

### 2. Blue Economy Business Model Canvas (BE-BMC):
- **Value Proposition**: Solusi bernilai tinggi yang ramah lingkungan (misal produk perikanan tersertifikasi fair-trade, bahan baku kemasan biodegradable dari alga).
- **Customer Segments**: Pasar konsumen ramah lingkungan, industri farmasi, pembeli korporasi global yang berkomitmen ESG.
- **Key Resources**: Sumber daya hayati laut yang tertelusur, fasilitas rantai dingin terbarukan, kemitraan nelayan lokal.
- **Cost Structure & Revenue Streams**: Efisiensi biaya berbasis energi terbarukan dan diversifikasi arus pendapatan dari produk primer dan produk sampingan.",
                ],
                [
                    'title' => "Modul 2: Pengembangan Produk Bernilai Tambah & Sertifikasi Keberlanjutan — {$track}",
                    'instruction' => "Pelajari strategi hilirisasi produk hasil laut, bioteknologi bahari, pemenuhan standar ekolabel internasional (MSC/ASC), serta kepatuhan rantai pasok.",
                    'body' => "## Modul 2: Pengembangan Produk Bernilai Tambah & Sertifikasi Keberlanjutan

Daya saing industri perikanan dan kelautan di pasar global ditentukan oleh diferensiasi produk, inovasi bioteknologi, dan kepatuhan standar mutu internasional.

### 1. Hilirisasi & Bioprospeksi Laut:
- **Kitosan dari Limbah Kulit Udang/Kepiting**: Aplikasi untuk bioplastik ramah lingkungan, pengawet makanan organik, dan absorben limbah cair.
- **Hidrolisat Protein Ikan (HPI)**: Pemanfaatan sisa daging dan kepala ikan menjadi konsentrat peptida untuk pengentasan gizi buruk dan pakan fungsional.
- **Karagenan & Agar-Agar Murni**: Peningkatan kemurnian ekstrak alga untuk bahan baku kapsul farmasi dan kosmetik bernilai ekspor tinggi.

### 2. Sertifikasi Keberlanjutan & Ekolabel:
- **Marine Stewardship Council (MSC)**: Sertifikasi perikanan tangkap lestari dengan audit ketat stok ikan dan dampak habitat.
- **Aquaculture Stewardship Council (ASC)**: Sertifikasi tambak budidaya ramah lingkungan dan bebas perusakan mangrove.
- **Ketertelusuran Rantai Pasok (*Chain of Custody*)**: Dokumentasi digital asal-usul bahan baku dari perahu nelayan hingga meja makan konsumen (*dock-to-table*).",
                ],
                [
                    'title' => "Modul 3: Analisis Kelayakan Finansial & Pitching Modal Ventura — {$track}",
                    'instruction' => "Pelajari teknik perhitungan kelayakan investasi (NPV, IRR, Payback Period), perancangan struktur modal, dan strategi meyakinkan investor berdampak (impact investors).",
                    'body' => "## Modul 3: Analisis Kelayakan Finansial & Pitching Modal Ventura

Startup dan usaha maritim memerlukan rencana keuangan yang kokoh dan narasi dampak yang kredibel untuk menarik permodalan dari investor institusional.

### 1. Metrik Kelayakan Finansial:
- **Net Present Value (NPV)**: Menilai apakah arus kas bersih masa depan yang didiskonto melebihi nilai investasi modal awal (CapEx).
- **Internal Rate of Return (IRR)**: Tingkat pengembalian tahunan proyek yang harus melampaui biaya modal tertimbang (*Weighted Average Cost of Capital - WACC*).
- **Payback Period & Break-Even Point (BEP)**: Estimasi jangka waktu pengembalian investasi dan volume produksi minimum untuk menutup beban tetap.

### 2. Instrumen Pendanaan Khusus Maritim:
- **Impact Venture Capital**: Dana modal ventura yang berfokus pada pelestarian laut dan kesejahteraan masyarakat pesisir.
- **Blended Finance**: Penggabungan hibah lunak pemerintah/donor untuk tahap R&D dan pinjaman komersial untuk ekspansi pabrik.
- **Penyusunan Pitch Deck**: Menyajikan traksi pasar, keunggulan kompetitif, tim kepemimpinan, mitigasi risiko iklim, dan laporan dampak ESG.",
                ],
            ],

            'Blue Data Intelligence' => [
                [
                    'title' => "Modul 1: Arsitektur Data Maritim & Penginderaan Jauh Oseanografi — {$track}",
                    'instruction' => "Pelajari infrastruktur pengumpulan data kelautan terpadu, satelit SAR, pelampung oseanografi IoT, dan transmisi data maritim nirkabel.",
                    'body' => "## Modul 1: Arsitektur Data Maritim & Penginderaan Jauh Oseanografi

Pengelolaan wilayah laut Indonesia seluas 6,4 juta km² memerlukan arsitektur data kelautan modern yang menggabungkan penginderaan jauh (*remote sensing*) dan jaringan sensor in-situ.

### 1. Sumber Data Kelautan Utama:
- **Citra Satelit Radar (SAR - Synthetic Aperture Radar)**: Mampu menembus awan dan kegelapan malam untuk mendeteksi pantulan logam lambung kapal dan tumpahan minyak (*oil slick*).
- **Satelit Optik (Sentinel-2, Landsat)**: Pemetaan batimetri dangkal, luasan kanopi mangrove, dan konsentrasi klorofil-a perairan.
- **Pelampung Sensor Oseanografi (Oceanographic Buoys & Drifters)**: Mengukur suhu permukaan laut (*SST*), salinitas, arus pasang surut, dan pH air secara realtime.

### 2. Sistem Transponder Pelayaran:
- **AIS (Automatic Identification System)**: Sinyal radio VHF kapal untuk pencegahan tabrakan di laut.
- **VMS (Vessel Monitoring System)**: Sistem pelacakan satelit wajib KKP untuk kapal perikanan berizin resmi.",
                ],
                [
                    'title' => "Modul 2: Machine Learning & Analitik Prediktif Pemantauan Laut — {$track}",
                    'instruction' => "Pelajari algoritma deteksi anomali pelayaran, pelacakan dark vessels, pemodelan habitat perikanan, dan integrasi Artificial Intelligence di domain maritim.",
                    'body' => "## Modul 2: Machine Learning & Analitik Prediktif Pemantauan Laut

Penerapan kecerdasan buatan (*Artificial Intelligence*) memungkinkan transformasi data mentah maritim menjadi intelijen taktis yang dapat ditindaklanjuti secara instan.

### 1. Deteksi Anomali & Dark Vessels:
- **Identifikasi 'Dark Vessels'**: Kapal yang sengaja mematikan transponder AIS di dekat batas zona ekonomi eksklusif (ZEE) yang terdeteksi silang dengan citra satelit SAR.
- **Analisis Pola Manuver Kapal**: Algoritma Deep Learning (LSTM/Transformer) untuk mengenali pola pelayaran melingkar indikasi penarikan jaring trawl terlarang atau pemindahan muatan di laut (*transshipment*).

### 2. Pemodelan Spasial Perikanan & Konservasi:
- Prediksi Zona Potensi Penangkapan Ikan (ZPPI) berbasis data termal SST dan kelimpahan fitoplankton untuk efisiensi BBM kapal nelayan.
- Pemodelan jalur migrasi megafauna laut (paus, lumba-lumba, penyu) guna meminimalkan risiko tabrakan dengan kapal kargo (*ship strike mitigation*).",
                ],
                [
                    'title' => "Modul 3: Pusat Komando Maritim & Decision Support System — {$track}",
                    'instruction' => "Pelajari arsitektur Maritime Command Center, integrasi antar-lembaga penegak hukum laut, dan perancangan Decision Support System (DSS) operasi pengawasan.",
                    'body' => "## Modul 3: Pusat Komando Maritim & Decision Support System

Pusat kendali data maritim terintegrasi (*Maritime Command Center*) menghubungkan analis data dengan komandan operasi lapangan untuk respons cepat terhadap ancaman maritim.

### 1. Elemen Decision Support System (DSS):
- **Common Operating Picture (COP)**: Tampilan visual peta laut real-time yang menggabungkan seluruh layer data intelijen (posisi kapal, status perizinan, cuaca, patroli armada).
- **Algoritma Optimasi Rute Patroli**: Menghitung jalur intersepsi tercepat dan paling hemat bahan bakar bagi kapal patroli PSDKP/Bakamla/TNI AL.

### 2. Standar Keamanan & Pertukaran Data:
- Penggunaan enkripsi tingkat tinggi untuk transmisi data taktis pengawasan laut.
- Interoperabilitas API antar-lembaga maritim sesuai kerangka Satu Data Kelautan Indonesia.",
                ],
            ],

            'Circular Economy', 'Blue Circular Economy' => [
                [
                    'title' => "Modul 1: Prinsip Sirkularitas Kelautan & Reduksi Limbah Pesisir — {$track}",
                    'instruction' => "Pelajari siklus hidup material pesisir, ancaman jaring hantu (ghost nets), dan pendekatan zero-waste pada rantai pasok industri kelautan.",
                    'body' => "## Modul 1: Prinsip Sirkularitas Kelautan & Reduksi Limbah Pesisir

Ekonomi Sirkular Biru (*Blue Circular Economy*) mentransformasi sistem linier 'ambil-pakai-buang' menjadi sistem restoratif dan regeneratif yang mempertahankan nilai material setinggi mungkin.

### 1. Krisis Sampah Laut & Alat Tangkap Terbengkalai:
- **Ghost Nets (ALDFG)**: Jaring ikan nilon yang hilang atau sengaja dibuang, terus menjerat satwa laut (*ghost fishing*) dan merusak terumbu karang selama puluhan tahun.
- **Pencemaran Mikroplastik**: Pelapukan sampah plastik kemasan daratan oleh radiasi UV dan deburan ombak, masuk ke dalam rantai makanan biota laut dan garam konsumsi manusia.

### 2. Tiga Pilar Sirkularitas Biru:
1. **Desain Ulang Material**: Mengganti plastik konvensional sekali pakai dengan bioplastik berbahan dasar rumput laut (*seaweed-based biomaterials*).
2. **Perpanjangan Umur Pakai**: Perawatan, perbaikan, dan standarisasi alat tangkap nelayan agar tahan lama.
3. **Regenerasi Sistem Alam**: Memastikan air limbah dan residu organik yang kembali ke laut dalam kondisi bersih dan bebas zat toksik.",
                ],
                [
                    'title' => "Modul 2: Logistik Balik (Reverse Logistics) & Daur Ulang Mekanis — {$track}",
                    'instruction' => "Pelajari alur pengumpulan limbah jaring bekas, pemilahan material polimer (PA6/PE/PP), dan rekayasa daur ulang menjadi komoditas industri.",
                    'body' => "## Modul 2: Logistik Balik (Reverse Logistics) & Daur Ulang Mekanis

Membangun rantai nilai sirkular di wilayah kepulauan membutuhkan sistem logistik balik (*reverse logistics*) yang terstruktur dan hemat biaya pengangkutan.

### 1. Skema Pengumpulan Berbasis Insentif:
- **Buy-Back Scheme**: Memberikan imbalan tunai atau voucher kebutuhan melaut bagi nelayan yang membawa kembali jaring usang ke dermaga pelabuhan.
- **Pemberdayaan Bank Sampah Pesisir**: Unit pengumpulan di pulau-pulau kecil yang dilengkapi alat pres hidrolik untuk menekan volume sampah sebelum dikapalkan.

### 2. Pemrosesan & Karakterisasi Polimer:
- Identifikasi jenis polimer: Poliamida-6 (Nilon), Polietilena (PE), dan Polipropilena (PP).
- Pencucian mekanis untuk menghilangkan garam laut dan kontaminan organik, dilanjutkan proses pencacahan (*shredding*) dan ekstrusi menjadi pelet plastik daur ulang kualitas ekspor.",
                ],
                [
                    'title' => "Modul 3: Extended Producer Responsibility (EPR) & Kredit Plastik — {$track}",
                    'instruction' => "Pelajari kewajiban regulasi produsen manufaktur, skema Plastic Offsetting/Credits, dan valuasi ekonomi pengelolaan limbah laut.",
                    'body' => "## Modul 3: Extended Producer Responsibility (EPR) & Kredit Plastik

Keberlanjutan pendanaan pengelolaan limbah pesisir didorong oleh penegakan instrumen kebijakan Extended Producer Responsibility (EPR) dan inovasi pasar kredit plastik.

### 1. Kerangka Regulasi EPR di Indonesia:
- Peraturan Menteri LHK No. 75/2019 tentang Peta Jalan Pengurangan Sampah oleh Produsen manufaktur, jasa makanan, dan ritel.
- Kemitraan produsen dengan operator daur ulang pesisir untuk memenuhi target daur ulang tahunan.

### 2. Mekanisme Kredit Plastik (*Plastic Credits*):
- Standar sertifikasi penghapusan plastik laut (misal Verra Plastic Waste Reduction Standard).
- Setiap metrik ton sampah plastik yang berhasil diangkat dari laut dan didaur ulang dapat dimonetisasi sebagai kredit plastik untuk pendanaan operasional nelayan.",
                ],
            ],

            'Blue Community Development' => [
                [
                    'title' => "Modul 1: Sosiologi Masyarakat Pesisir & Pemetaan Sosial Partisipatif — {$track}",
                    'instruction' => "Pelajari struktur sosial nelayan, dinamika patron-klien, dan metode analisis pemetaan sosial partisipatif (Participatory Rural Appraisal).",
                    'body' => "## Modul 1: Sosiologi Masyarakat Pesisir & Pemetaan Sosial Partisipatif

Pemberdayaan masyarakat pesisir yang efektif harus berakar pada pemahaman mendalam tentang sosiokultural, struktur relasi kekuasaan, dan dinamika mata pencaharian nelayan.

### 1. Struktur Relasi Sosial Nelayan:
- **Hubungan Patron-Klien (Ponggawa-Sawi)**: Keterikatan ekonomi nelayan kecil terhadap juragan kapal atau pelepas uang yang sering membatasi kebebasan tawar harga hasil tangkapan.
- **Kerentanan Musiman**: Siklus musim paceklik akibat ombak besar yang memaksa nelayan berutang untuk memenuhi kebutuhan pangan dasar.

### 2. Metodologi Pemetaan Sosial Partisipatif:
- **Participatory Rural Appraisal (PRA)**: Pemetaan bersama warga desa mengenai aset perairan, titik tangkapan, zonasi adat, dan kalender musim melaut.
- Identifikasi agen perubahan lokal (*local champions*): Pemuda pesisir, tokoh adat laut, dan ketua kelompok perempuan pengolah ikan.",
                ],
                [
                    'title' => "Modul 2: Kearifan Lokal Kelautan & Integrasi Regulasi Desa — {$track}",
                    'instruction' => "Pelajari tradisi hukum adat laut Indonesia (Sasi, Awig-awig, Panglima Laot), perlindungan hak kelola nelayan, dan penyusunan Peraturan Desa.",
                    'body' => "## Modul 2: Kearifan Lokal Kelautan & Integrasi Regulasi Desa

Indonesia kaya akan kearifan lokal konservasi maritim yang telah terbukti menjaga kelestarian stok ikan secara turun-temurun selama ratusan tahun.

### 1. Praktik Konservasi Adat Laut Nusantara:
- **Sasi Laut (Maluku & Papua)**: Larangan mengambil jenis biota laut tertentu (seperti teripang, lola, lobster) dalam periode waktu tertentu agar biota dapat bereproduksi secara maksimal.
- **Awig-Awig (Lombok & Bali)**: Aturan adat nelayan yang melarang penggunaan racun portas, bom ikan, dan alat tangkap destruktif dengan sanksi sosial tegas.
- **Panglima Laot (Aceh)**: Lembaga adat pengatur tata tertib melaut, penyelesai sengketa antar-nelayan, dan penjaga keselamatan navigasi.

### 2. Harmonisasi Hukum Adat ke Hukum Positif:
- Formalisasi hukum adat laut ke dalam Peraturan Desa (Perdes) yang memiliki kekuatan hukum mengikat.
- Pengakuan Hak Kelola Perikanan Tradisional oleh Dinas Kelautan dan Perikanan Kabupaten/Provinsi.",
                ],
                [
                    'title' => "Modul 3: Inkubasi Koperasi Multi-Pihak & Pemberdayaan Perempuan Pesisir — {$track}",
                    'instruction' => "Pelajari modernisasi koperasi nelayan, pendirian SPBN desa, pembiayaan mikro syariah, dan diversifikasi mata pencaharian perempuan nelayan.",
                    'body' => "## Modul 3: Inkubasi Koperasi Multi-Pihak & Pemberdayaan Perempuan Pesisir

Kemandirian ekonomi pesisir diwujudkan melalui transformasi kelembagaan ekonomi rakyat yang berkeadilan dan inklusif secara gender.

### 1. Model Koperasi Multi-Pihak Modern:
- Memfasilitasi kepemilikan saham koperasi bersama antara nelayan tangkap, pengolah hasil laut, dan manajemen profesional.
- Pengoperasian Stasiun Pengisian Bahan Bakar Nelayan (SPBN) mandiri untuk menjamin pasokan solar bersubsidi tanpa tengkulak.

### 2. Pemberdayaan Ekonomi Perempuan Nelayan:
- Mengembangkan unit pengolahan abon ikan, kerupuk tulang ikan, dan suvenir kerang bernilai jual tinggi.
- Literasi keuangan digital dan akses tabungan mikro keluarga nelayan untuk menghadapi musim gelombang badai.",
                ],
            ],

            'Blue Farming' => [
                [
                    'title' => "Modul 1: Prinsip Budidaya Laut/Payau Berkelanjutan & Biosekuriti — {$track}",
                    'instruction' => "Pelajari standar budidaya ramah lingkungan, pemilihan lokasi bebas mangrove, dan protokol biosekuriti ketat pencegahan wabah penyakit.",
                    'body' => "## Modul 1: Prinsip Budidaya Laut/Payau Berkelanjutan & Biosekuriti

Akuakultur berkelanjutan (*Sustainable Aquaculture*) merupakan penopang utama pasokan protein masa depan yang wajib beroperasi tanpa merusak habitat mangrove dan bentang pesisir.

### 1. Kriteria Lokasi & Zonasi Tambak:
- Larangan membuka tambak di zona inti hutan mangrove dan sabuk hijau pantai (*greenbelt* minimal 100–130 kali rata-rata pasang surut).
- Evaluasi kualitas air sumber: salinitas stabil, bebas logam berat, dan memiliki pasokan air tawar pendukung.

### 2. Protokol Biosekuriti Ketat:
- **Pencegahan Penyakit Viral & Bakterial**: Menangkal infeksi White Spot Syndrome Virus (WSSV), Early Mortality Syndrome (EMS/AHPND), dan Enterocytozoon hepatopenaei (EHP).
- Sterilisasi tandon air masuk (*inlet reservoir*) menggunakan ozonasi atau klorinasi terukur sebelum dialirkan ke kolam budidaya.
- Penggunaan benur/benih unggul bebas patogen spesifik (*Specific Pathogen Free - SPF*).",
                ],
                [
                    'title' => "Modul 2: Teknologi Bioflok, Kualitas Air & Rekayasa IPAL Nol Limbah — {$track}",
                    'instruction' => "Pelajari manajemen bakteri heterotrof bioflok, kontrol rasio C:N, dan perancangan instalasi pengolahan air limbah (IPAL) 3 tahap.",
                    'body' => "## Modul 2: Teknologi Bioflok, Kualitas Air & Rekayasa IPAL Nol Limbah

Pengendalian kualitas air kolam secara biologis meminimalisasi pergantian air (*zero water exchange*) dan mencegah pencemaran perairan pesisir di sekitarnya.

### 1. Mekanisme Sistem Bioflok:
- Menumbuhkan konsorsium bakteri heterotrof, alga, dan protozoa dengan menambahkan sumber karbon organik (molase/tetes tebu, dedak terfermentasi) pada rasio C:N > 12:1.
- Bakteri mengonversi amonia beracun (NH₃/NH₄⁺) menjadi biomassa protein sel tunggal yang dapat dimakan kembali oleh udang/ikan.

### 2. Rekayasa IPAL Pesisir 3 Tahap:
1. **Kolam Pengendapan (Sedimentation Pond)**: Mengendapkan lumpur feses dan sisa pakan padat.
2. **Kolam Aerasi & Oksidasi**: Menurunkan kebutuhan oksigen biologis (BOD) dan kimiawi (COD).
3. **Kolam Biofilter Biologis**: Pemanfaatan ikan herbivora (bandeng/nila) dan rumput laut untuk menyerap residu nitrogen dan fosfor sebelum air dilepas ke laut lepas.",
                ],
                [
                    'title' => "Modul 3: Efisiensi Pakan (FCR Rendah) & Sertifikasi Standar Global — {$track}",
                    'instruction' => "Pelajari strategi pakan hemat (FCR < 1,2), penggantian tepung ikan dengan protein nabati/serangga, dan kepatuhan sertifikasi CBIB/ASC.",
                    'body' => "## Modul 3: Efisiensi Pakan (FCR Rendah) & Sertifikasi Standar Global

Biaya pakan mencakup 60–70% biaya operasional budidaya, sehingga efisiensi pakan menentukan daya tahan finansial dan jejak ekologis usaha.

### 1. Optimalisasi Feed Conversion Ratio (FCR):
- Menggunakan pakan berkualitas tinggi dengan auto-feeder berbasis sensor suara akustik kunyah udang.
- Menargetkan rasio konversi pakan FCR di bawah 1,2 kg pakan per 1 kg biomassa panen.
- Substitusi tepung ikan komersial dengan protein maggot (BSF) atau bungkil kedelai fermentasi untuk mengurangi tekanan penangkapan ikan rucah (*trash fish*).

### 2. Sertifikasi Pasar Ekspor:
- **CBIB**: Sertifikasi Cara Budidaya Ikan yang Baik dari Kementerian Kelautan dan Perikanan.
- **BAP & ASC**: Standar internasional jaminan ketertelusuran, kesejahteraan pekerja, dan perlindungan lingkungan.",
                ],
            ],

            'Blue Tourism' => [
                [
                    'title' => "Modul 1: Konsep Ekowisata Bahari Berkelanjutan & Ekologi Destinasi — {$track}",
                    'instruction' => "Pelajari karakteristik destinasi bahari, keanekaragaman hayati terumbu karang, dan prinsip pariwisata laut yang bertanggung jawab.",
                    'body' => "## Modul 1: Konsep Ekowisata Bahari Berkelanjutan & Ekologi Destinasi

Ekowisata Bahari adalah kegiatan wisata bahari yang bertanggung jawab terhadap kelestarian alam perairan, meminimalkan dampak negatif, serta meningkatkan kesejahteraan masyarakat lokal.

### 1. Nilai Penting Keanekaragaman Terumbu Karang:
- Terumbu karang adalah pusat daya tarik wisata selam dan snorkeling yang sangat rentan terhadap sentuhan fisik, pemutihan karang (*coral bleaching*), dan limbah kimiawi.
- Keberadaan megafauna laut karismatik (hiu paus, pari manta, penyu laut) sebagai atraksi bernilai ekonomi tinggi yang membutuhkan zona perlindungan tenang.

### 2. Prinsip Pariwisata Berkelanjutan (UNWTO & GSTC):
- Mengedepankan edukasi dan interpretasi alam bagi para pengunjung.
- Mengalokasikan sebagian pendapatan tiket masuk untuk program konservasi langsung.
- Memprioritaskan tenaga kerja dan pemandu lokal bersertifikasi.",
                ],
                [
                    'title' => "Modul 2: Manajemen Daya Dukung (Carrying Capacity) & Standar Green Fins — {$track}",
                    'instruction' => "Pelajari kalkulasi daya dukung harian (Carrying Capacity Limits), penataan fasilitas tambat apung, dan kepatuhan kode etik Green Fins.",
                    'body' => "## Modul 2: Manajemen Daya Dukung (Carrying Capacity) & Standar Green Fins

Lonjakan wisatawan tanpa batas (*overtourism*) terbukti merusak terumbu karang dan mengusir satwa laut langka dari habitat alaminya.

### 1. Metodologi Kalkulasi Daya Dukung:
- **Physical Carrying Capacity (PCC)**: Batas ruang fisik maksimum luas terumbu karang per penyelam.
- **Real Carrying Capacity (RCC)**: Koreksi batas fisik terhadap faktor biologi satwa (waktu bertelur, musim pasang surut).
- **Effective Carrying Capacity (ECC)**: Batas akhir yang disesuaikan dengan kapasitas petugas pengawas dan sarana penyelamatan di lapangan.

### 2. Standar Penyelaman Green Fins:
- Larangan memegang karang, berdiri di atas karang, atau memberi makan ikan (*fish feeding*).
- Pemasangan tambat apung (*mooring buoys*) di seluruh spot selam populer agar kapal wisata tidak melempar jangkar besi ke terumbu karang.",
                ],
                [
                    'title' => "Modul 3: Sistem Tiket Konservasi Digital & Ekowisata Berbasis Komunitas — {$track}",
                    'instruction' => "Pelajari skema retribusi konservasi terpadu (digital user fee), model pariwisata berbasis komunitas (CBT), dan transparansi pengelolaan dana.",
                    'body' => "## Modul 3: Sistem Tiket Konservasi Digital & Ekowisata Berbasis Komunitas

Manajemen pariwisata berkelanjutan menuntut tata kelola retribusi yang transparan dan akuntabel berbasis teknologi informasi.

### 1. Skema Tiket Konservasi Digital (*Conservation User Fee*):
- Sistem reservasi dan pembayaran tiket online pra-kedatangan terintegrasi untuk mengendalikan kuota kuota pengunjung harian secara otomatis.
- Pendapatan tiket dialokasikan secara transparan: 50% untuk patroli dan restorasi karang, 30% untuk pemberdayaan desa, dan 20% operasional pengelola.

### 2. Community-Based Tourism (CBT):
- Mengembangkan homestay ramah lingkungan milik warga desa pesisir dibandingkan resor masif investor luar.
- Memberdayakan mantan nelayan pengebom karang menjadi instruktur selam dan pemandu konservasi terumbu karang.",
                ],
            ],

            'Blue Shipping' => [
                [
                    'title' => "Modul 1: Dekarbonisasi Pelayaran & Regulasi IMO MARPOL Annex VI — {$track}",
                    'instruction' => "Pelajari peta jalan dekarbonisasi maritim global IMO 2050, indikator intensitas karbon (CII & EEXI), dan audit emisi armada kapal.",
                    'body' => "## Modul 1: Dekarbonisasi Pelayaran & Regulasi IMO MARPOL Annex VI

Sektor pelayaran komersial menyumbang hampir 3% dari total emisi gas rumah kaca global, memicu regulasi ketat dari International Maritime Organization (IMO) menuju target net-zero 2050.

### 1. Kerangka Regulasi Dekarbonisasi IMO:
- **EEXI (Energy Efficiency Existing Ship Index)**: Standar teknis efisiensi desain energi pada kapal niaga yang beroperasi.
- **CII (Carbon Intensity Indicator)**: Penilaian operasional tahunan efisiensi emisi karbon per ton-mil nautika dengan peringkat A hingga E.
- **Kepatuhan MARPOL Annex VI**: Pembatasan ketat kandungan sulfur bahan bakar minyak laut (*VLSFO < 0.5%*) dan kawasan kontrol emisi khusus (ECA).

### 2. Inventarisasi Jejak Karbon Armada:
- Metode penghitungan konsumsi bahan bakar menggunakan flow-meter digital terkalibrasi.
- Pencatatan emisi Scope 1 (langsung dari cerobong kapal) dan Scope 2/3 pada operasional terminal logistik.",
                ],
                [
                    'title' => "Modul 2: Teknologi Green Port & Onshore Power Supply (Cold Ironing) — {$track}",
                    'instruction' => "Pelajari infrastruktur kelistrikan darat Onshore Power Supply, penanganan limbah pelayaran MARPOL, dan bahan bakar alternatif masa depan.",
                    'body' => "## Modul 2: Teknologi Green Port & Onshore Power Supply (Cold Ironing)

Pelabuhan hijau (*Green Port*) adalah simpul penting yang menghubungkan kapal bersih dengan infrastruktur logistik daratan rendah karbon.

### 1. Onshore Power Supply (OPS / Cold Ironing):
- Penyediaan sambungan daya listrik tegangan tinggi dari darat ke kapal saat bersandar di dermaga pelabuhan.
- Memungkinkan kapal mematikan mesin bantu diesel (*auxiliary engines*), memangkas 100% emisi partikulat NOx, SOx, dan kebisingan di lingkungan pelabuhan.

### 2. Transisi Bahan Bakar Rendah Karbon:
- Pemanfaatan Biodiesel B35/B40 pada armada penyeberangan domestik.
- Elektrifikasi baterai pada kapal penyeberangan jarak pendek (Ro-Ro ferry).
- Kesiapan bunkering gas alam cair (LNG) dan metanol hijau untuk kapal kargo samudera.",
                ],
                [
                    'title' => "Modul 3: Optimasi Logistik Pelayaran, Weather Routing & Digital Clearance — {$track}",
                    'instruction' => "Pelajari manajemen kecepatan kapal (slow steaming), optimasi rute pelayaran berbasis data cuaca oseanografi, dan digitalisasi pelabuhan.",
                    'body' => "## Modul 3: Optimasi Logistik Pelayaran, Weather Routing & Digital Clearance

Efisiensi energi tidak hanya dicapai melalui peremajaan mesin, tetapi juga lewat optimalisasi operasional pelayaran berbasis data real-time.

### 1. Optimalisasi Navigasi & Operasional:
- **Slow Steaming**: Menurunkan kecepatan jelajah sebesar 10–20% dapat menghemat konsumsi bahan bakar hingga 25–40%.
- **Weather Routing**: Menggunakan prakiraan angin laut, tinggi gelombang, dan arus laut BMKG untuk menentukan rute pelayaran yang paling hemat daya dorong.

### 2. Digital Port Clearance & Just-In-Time Arrival:
- Integrasi sistem Inaportnet dan digital clearance untuk memangkas waktu lego jangkar di kolam pelabuhan (*waiting time*).
- Konsep Just-In-Time (JIT) Arrival: Kapal mengatur waktu kedatangan tepat saat dermaga kosong guna mengeliminasi emisi saat mengapung mengantre.",
                ],
            ],

            'Blue Finance' => [
                [
                    'title' => "Modul 1: Taksonomi Keuangan Berkelanjutan & Kerangka Sovereign Blue Bond — {$track}",
                    'instruction' => "Pelajari Taksonomi Keuangan Berkelanjutan Indonesia (TKBI), standar ICMA Blue/Green Bond, dan kriteria proyek laut yang memenuhi syarat.",
                    'body' => "## Modul 1: Taksonomi Keuangan Berkelanjutan & Kerangka Sovereign Blue Bond

Pembiayaan Biru (*Blue Finance*) menyediakan aliran modal terstruktur untuk mendanai transisi sektor kelautan menuju ekonomi rendah karbon dan tangguh iklim.

### 1. Kerangka Taksonomi Keuangan Berkelanjutan Indonesia (TKBI):
- Panduan Otoritas Jasa Keuangan (OJK) yang mengklasifikasikan kegiatan ekonomi maritim ke dalam kategori Hijau, Transisi, dan Abu-Abu.
- Kriteria ketat pencegahan *blue-washing* (klaim palsu kelestarian proyek perairan).

### 2. Arsitektur Sovereign & Corporate Blue Bond:
- **Use of Proceeds**: Alokasi penerbitan obligasi khusus untuk proyek restorasi pesisir, pengolahan limbah air pulau, dan perikanan tangkap ramah lingkungan.
- **Exclusion List**: Larangan keras penggunaan dana untuk proyek penangkapan ikan destruktif, pertambangan pasir laut merusak, atau tambak penggusur mangrove.
- **Second Party Opinion (SPO)**: Penilaian independen lembaga audit internasional atas kepatuhan kerangka kerja obligasi terhadap standar ICMA.",
                ],
                [
                    'title' => "Modul 2: Struktur Blended Finance & Instrumen Mitigasi Risiko Investasi — {$track}",
                    'instruction' => "Pelajari skema percampuran modal filantropi dan komersial (Blended Finance), penjaminan kredit (credit enhancement), dan obligasi dampak.",
                    'body' => "## Modul 2: Struktur Blended Finance & Instrumen Mitigasi Risiko Investasi

Tingginya profil risiko proyek maritim perintis membutuhkan inovasi struktur permodalan campuran (*Blended Finance*) untuk menarik investor komersial.

### 1. Struktur Blended Finance Maritim:
- **First-Loss Capital**: Dana hibah dari donor filantropi atau lembaga multilateral yang bersedia menanggung kerugian awal jika proyek gagal.
- **Concessional Debt**: Pinjaman dengan suku bunga di bawah pasar dan tenor jangka panjang untuk pembangunan infrastruktur pesisir dasar.
- **Commercial Capital**: Investasi modal ventura dan ekuitas swasta yang masuk setelah profil risiko ditekan oleh dana konsesional.

### 2. Instrumen Mitigasi Risiko Kelautan:
- Asuransi Parametrik Terumbu Karang: Klaim asuransi cair otomatis berbasis intensitas kecepatan badai siklon untuk mendanai perbaikan karang segera.
- Jaminan Kredit Parsial (*Partial Credit Guarantees*) untuk koperasi nelayan skala kecil.",
                ],
                [
                    'title' => "Modul 3: Pelaporan Transparansi, KPI Dampak & Monetisasi Aset Biru — {$track}",
                    'instruction' => "Pelajari perancangan Key Performance Indicators (KPI) dampak lingkungan, audit transparansi tahunan, dan integrasi pasar karbon biru.",
                    'body' => "## Modul 3: Pelaporan Transparansi, KPI Dampak & Monetisasi Aset Biru

Kredibilitas instrumen Blue Finance di mata investor global ditentukan oleh kualitas pengukuran dampak (*impact metrics*) dan keterbukaan informasi publik.

### 1. Key Performance Indicators (KPI) Dampak:
- **Indikator Biofisik**: Luas habitat pesisir terpulihkan (ha), ton emisi gas rumah kaca dihindari (tCO₂e), volume limbah plastik dicegah masuk laut (ton).
- **Indikator Sosio-Ekonomi**: Peningkatan rata-rata pendapatan keluarga nelayan (%), jumlah lapangan kerja hijau pesisir (*green/blue jobs*).

### 2. Pelaporan Dampak Tahunan & Audit Pihak Ketiga:
- Penyusunan Annual Allocation and Impact Report sesuai mandat OJK dan investor institusi.
- Monetisasi aset biru melalui penerbitan kredit biodiversitas laut (*marine biodiversity credits*) dan kredit karbon biru terverifikasi.",
                ],
            ],

            'Blue Energy' => [
                [
                    'title' => "Modul 1: Potensi Energi Terbarukan Laut (Marine Renewable Energy) — {$track}",
                    'instruction' => "Pelajari karakteristik energi pasang surut, arus laut selat sempit nusantara, Ocean Thermal Energy Conversion (OTEC), dan gelombang laut.",
                    'body' => "## Modul 1: Potensi Energi Terbarukan Laut (Marine Renewable Energy)

Indonesia sebagai negara kepulauan terbesar di dunia memiliki potensi energi terbarukan samudera (*Marine Renewable Energy*) teoretis lebih dari 60 GW yang belum tergarap optimal.

### 1. Jenis Teknologi Energi Samudera:
- **Energi Arus Laut Pasang Surut (*Tidal Stream Energy*)**: Memanfaatkan aliran air deras di selat-selat sempit kepulauan (Selat Pantar, Selat Lombok, Selat Alas) dengan kecepatan puncak > 3,0 m/s.
- **Ocean Thermal Energy Conversion (OTEC)**: Memanfaatkan perbedaan suhu antara air permukaan laut hangat (28°C) dan air laut dalam dingin (4°C pada kedalaman 1.000 m).
- **Energi Gelombang Laut (*Wave Energy*)**: Mengubah energi kinetik ombak pantai selatan Jawa, Bali, dan Nusa Tenggara menjadi tenaga listrik.

### 2. Keunggulan Energi Arus Laut:
- **Tingkat Kepastian Tinggi (*Predictability*)**: Siklus pasang surut air laut dapat diprediksi secara matematis puluhan tahun ke depan, berbeda dengan angin dan matahari yang intermiten.
- **Kerapatan Energi Tinggi**: Kerapatan massa air laut 830 kali lebih padat dibandingkan udara, menghasilkan daya kinetik besar pada ukuran turbin kompak.",
                ],
                [
                    'title' => "Modul 2: Rekayasa Turbin Arus Laut, Ketahanan Korosi & Transmisi Kabel — {$track}",
                    'instruction' => "Pelajari desain turbin horisontal vs vertikal bawah laut, mitigasi biofouling teritip karang, dan sistem kabel bawah laut pulau terluar.",
                    'body' => "## Modul 2: Rekayasa Turbin Arus Laut, Ketahanan Korosi & Transmisi Kabel

Pemasangan pembangkit listrik di lingkungan laut dalam membutuhkan rekayasa material khusus yang tahan terhadap korosi air asin dan biofouling ekstrem.

### 1. Desain Turbin Bawah Laut:
- **Horizontal Axis Tidal Turbines (HATT)**: Mirip kincir angin darat, efisiensi tinggi pada arah arus laminer satu arah.
- **Vertical Axis Turbines**: Mampu menangkap daya dari segala arah arus pasang surut tanpa memerlukan mekanisme yaw mekanis yang rumit.

### 2. Mitigasi Korosi & Perlindungan Ekologis:
- Penggunaan pelapis anti-korosi ramah lingkungan dan anoda korban (*sacrificial anodes*) untuk mencegah korosi galvanik.
- Desain putaran sudu turbin kecepatan rendah (< 20 rpm) dan sistem sensor sonar untuk mencegah tabrakan dengan mamalia laut (*cetacean-safe design*).
- Sistem kabel transmisi bawah laut berperisai baja lapis ganda menuju gardu induk daratan.",
                ],
                [
                    'title' => "Modul 3: Smart Microgrid Pulau Mandiri & Analisis Biaya LCOE — {$track}",
                    'instruction' => "Pelajari integrasi energi laut dengan Battery Energy Storage System (BESS), stabilitas beban dasar pulau terpencil, dan kalkulasi LCOE.",
                    'body' => "## Modul 3: Smart Microgrid Pulau Mandiri & Analisis Biaya LCOE

Penerapan energi arus laut paling mendesak dilakukan di pulau-pulau 3T (Terdepan, Terluar, Tertinggal) yang saat ini masih membebani negara dengan subsidi genset solar diesel mahal.

### 1. Arsitektur Smart Microgrid Pulau Mandiri:
- Integrasi Pembangkit Listrik Tenaga Arus Laut (PLTAL) sebagai penyedia beban dasar (*baseload power*).
- Battery Energy Storage System (BESS) untuk meratakan fluktuasi daya saat perubahan arah arus pasang dan surut.
- Cadangan PLTS terapung di perairan teluk tenang untuk mendukung beban puncak siang hari.

### 2. Analisis Levelized Cost of Electricity (LCOE):
- Menghitung biaya modal (CapEx) turbin dan kabel laut terhadap masa pakai operasional (25 tahun).
- Pembuktian bahwa LCOE PLTAL di pulau terpencil jauh lebih murah dibandingkan biaya pokok produksi (BPP) listrik PLTD diesel BBM pulau terluar.",
                ],
            ],

            'Blue Food' => [
                [
                    'title' => "Modul 1: Sistem Pangan Biru (Blue Foods) & Ketahanan Gizi Pesisir — {$track}",
                    'instruction' => "Pelajari peran pangan laut bernilai gizi tinggi, keunggulan jejak emisi rendah dibandingkan pangan terestrial, dan diversifikasi pangan alga.",
                    'body' => "## Modul 1: Sistem Pangan Biru (Blue Foods) & Ketahanan Gizi Pesisir

Pangan Biru (*Blue Foods*) mencakup seluruh hewan, tumbuhan, dan mikroorganisme yang dipanen dari perairan tawar dan laut untuk konsumsi manusia dengan nilai nutrisi superior.

### 1. Keunggulan Nutrisi Pangan Biru:
- Sumber protein hewani berkualitas tinggi, kaya asam lemak esensial Omega-3 (DHA & EPA), vitamin D, kalsium, fosfor, dan zat besi bio-available.
- Peran krusial dalam pencegahan stunting pada balita dan anemia pada ibu hamil di kawasan kepulauan.

### 2. Keunggulan Jejak Ekologis Rendah:
- Bivalvia (kerang, tiram) dan makroalga (rumput laut) tidak memerlukan pakan buatan, pupuk sintetis, atau lahan darat, serta menyerap karbon dan menyaring air laut secara alami.
- Jejak gas rumah kaca per gram protein jauh lebih rendah dibandingkan daging sapi atau unggas daratan.",
                ],
                [
                    'title' => "Modul 2: Hilirisasi Makroalga & Biokonversi Limbah Ikan Menjadi HPI — {$track}",
                    'instruction' => "Pelajari teknologi pengolahan rumput laut menjadi pangan fungsional, ekstraksi kolagen ikan, dan produksi Hidrolisat Protein Ikan (HPI).",
                    'body' => "## Modul 2: Hilirisasi Makroalga & Biokonversi Limbah Ikan Menjadi HPI

Hilirisasi biomassa laut mentah menjadi produk pangan bernilai tambah tinggi menaikkan taraf hidup nelayan dan mengatasi krisis pangan nasional.

### 1. Pengolahan Pangan Fungsional Rumput Laut:
- Ekstraksi hidrokoloid (karagenan dan agar) untuk pengganti gelatin hewani, pengental makanan nabati, dan bahan pengemas makanan biodegradable yang dapat dimakan (*edible film*).
- Fortifikasi tepung alga kaya iodium dan serat pangan pada biskuit program gizi balita pesisir.

### 2. Hidrolisat Protein Ikan (HPI):
- Biokonversi enzimatis terhadap limbah kepala, tulang, dan jeroan ikan dari industri filet perikanan.
- Menghasilkan tepung peptida bebas bau amis dengan kadar protein > 80% yang mudah larut air untuk susu protein dan bahan campuran makanan pokok lokal.",
                ],
                [
                    'title' => "Modul 3: Rantai Dingin Tenaga Surya & Ketertelusuran Mutu Digital — {$track}",
                    'instruction' => "Pelajari teknologi rantai dingin bertenaga surya di pulau terpencil, sistem keterlacakan barcode/QR, dan sertifikasi keamanan pangan HACCP.",
                    'body' => "## Modul 3: Rantai Dingin Tenaga Surya & Ketertelusuran Mutu Digital

Kelemahan terbesar rantai pasok pangan laut Indonesia adalah kerugian pasca-panen (*post-harvest losses*) yang mencapai 20–30% akibat ketiadaan fasilitas pendingin.

### 1. Solar-Powered Cold Chain di Pulau Nelayan:
- Pembangunan pabrik es curah mini tenaga surya di dermaga pendaratan ikan pulau terluar.
- Penggunaan cool-box berinsulasi poliuretan untuk mempertahankan kesegaran ikan segar tangkapan nelayan pada suhu 0–4°C tanpa bahan pengawet kimia.

### 2. Standar Keamanan & Ketertelusuran Digital:
- Penerapan standar Hazard Analysis Critical Control Point (HACCP) pada unit pengolahan ikan rakyat.
- Pelabelan digital QR-code kemasan untuk menampilkan riwayat nelayan penangkap, tanggal panen, dan hasil uji laboratorium mutu mikrobiologi.",
                ],
            ],

            'Blue Port' => [
                [
                    'title' => "Modul 1: Standar Internasional Green Port & Audit Lingkungan Pelabuhan — {$track}",
                    'instruction' => "Pelajari kerangka kerja EcoPorts, inventarisasi emisi pelabuhan, manajemen tumpahan bahan berbahaya, dan pengelolaan pengerukan sedimen.",
                    'body' => "## Modul 1: Standar Internasional Green Port & Audit Lingkungan Pelabuhan

Pelabuhan modern berfungsi sebagai simpul logistik maritim yang wajib menerapkan standar keberlanjutan lingkungan terintegrasi (*Green Port*).

### 1. Standar Green Port Internasional:
- Pedoman Green Port Network dan EcoPorts PERS (Port Environmental Review System).
- Pemantauan mutu air kolam pelabuhan, pencegahan kontaminasi hidrokarbon, dan perlindungan ekosistem bakau di batas perimeter pelabuhan.

### 2. Manajemen Sedimentasi & Pengerukan Alur:
- Pengerukan pemeliharaan alur pelayaran (*maintenance dredging*) yang ramah lingkungan dengan menempatkan material kerukan di area pembuangan laut berizin.
- Pemanfaatan sedimen kerukan non-toksik untuk reklamasi pulau ramah lingkungan atau pembuatan tanggul alami pemecah gelombang.",
                ],
                [
                    'title' => "Modul 2: Elektrifikasi Peralatan Bongkar Muat & Fasilitas Resepsi MARPOL — {$track}",
                    'instruction' => "Pelajari transformasi alat bongkar muat elektrik (e-RTG), pengelolaan air balas kapal, dan fasilitas penampungan limbah kapal (PRF).",
                    'body' => "## Modul 2: Elektrifikasi Peralatan Bongkar Muat & Fasilitas Resepsi MARPOL

Penurunan emisi terminal pelabuhan dilakukan melalui elektrifikasi menyeluruh seluruh armada peralatan bongkar muat di daratan.

### 1. Elektrifikasi Terminal Peti Kemas:
- Konversi Rubber Tyred Gantry (RTG) crane berbahan bakar diesel menjadi e-RTG berbasis listrik rel atau kabel gulung otomatis.
- Pengoperasian Automated Guided Vehicles (AGV) dan truk terminal listrik bertenaga baterai di dalam dermaga.

### 2. Port Reception Facilities (PRF) Mandatori:
- Fasilitas penerima limbah kapal sesuai MARPOL: penampungan oli bekas, lumpur minyak (*sludge*), air cucian palka, dan sampah domestik kapal.
- Instalasi pengelolaan air balas (*Ballast Water Management System - BWMS*) darat untuk mencegah invasi spesies asing laut invasif.",
                ],
                [
                    'title' => "Modul 3: Terminal Booking System & Pembangunan Sabuk Hijau Pesisir — {$track}",
                    'instruction' => "Pelajari digitalisasi logistik truk pelabuhan, pemangkasan antrean kemacetan jalan tol, dan restorasi sabuk mangrove penahan banjir rob.",
                    'body' => "## Modul 3: Terminal Booking System & Pembangunan Sabuk Hijau Pesisir

Transformasi pelabuhan hijau menggabungkan optimalisasi efisiensi logistik digital dengan penguatan infrastruktur berbasis alam (*nature-based solutions*).

### 1. Digital Truck Appointment System (TAS):
- Sistem reservasi jadwal kedatangan truk kontainer ke gerbang pelabuhan secara digital untuk mengurai kemacetan antrean truk berjam-jam.
- Pemangkasan emisi mesin truk saat diam (*idling*) hingga lebih dari 50% di sekitar pemukiman perkotaan pelabuhan.

### 2. Sabuk Hijau Mangrove Pelabuhan:
- Pembangunan kawasan sabuk hijau mangrove mengelilingi fasilitas pelabuhan untuk menyerap polusi debu partikulat.
- Benteng alami peredam gelombang badai dan penahan banjir rob pasang air laut yang melindungi dermaga logistik.",
                ],
            ],

            'Blue Food & Energy Circular' => [
                [
                    'title' => "Modul 1: Keterpaduan Sistem Energi dan Pangan Sirkular Kepulauan — {$track}",
                    'instruction' => "Pelajari konsep nexus air-energi-pangan pesisir (Water-Energy-Food Nexus), siklus tertutup sumber daya lokal, dan ketahanan iklim pulau.",
                    'body' => "## Modul 1: Keterpaduan Sistem Energi dan Pangan Sirkular Kepulauan

Wilayah kepulauan terpencil menghadapi kerentanan ganda: ketergantungan impor bahan bakar diesel fosil yang mahal dan kerawanan pangan akibat isolasi logistik saat cuaca buruk.

### 1. Pendekatan Nexus Pangan-Energi-Air Laut:
- Mengintegrasikan pembangkit energi terbarukan laut untuk mendukung langsung kebutuhan primer pulau: desalinasi air minum, pendingin ikan nelayan, dan pengolahan pangan.
- Menghapuskan paradigma sektor terpisah; menjadikan limbah dari satu sektor sebagai input berharga bagi sektor lainnya.

### 2. Prinsip Sirkularitas Pulau Tertutup:
- Memaksimalkan kemandirian sumber daya tanpa mengandalkan suplai kapal tongkang daratan utama.
- Pemanfaatan residu biomassa hasil panen laut menjadi pupuk hayati organik untuk pertanian sayur pesisir.",
                ],
                [
                    'title' => "Modul 2: Desalinasi Air Laut (SWRO), Pabrik Es Nelayan & Biorefineri Alga — {$track}",
                    'instruction' => "Pelajari operasional pabrik es bertenaga energi bersih, instalasi pemurnian air laut SWRO, dan fasilitas biorefineri makroalga multi-produk.",
                    'body' => "## Modul 2: Desalinasi Air Laut (SWRO), Pabrik Es Nelayan & Biorefineri Alga

Pemanfaatan listrik bersih dari arus laut dan surya dialokasikan secara prioritas pada infrastruktur penopang rantai ekonomi masyarakat pulau.

### 1. Desalinasi Sea Water Reverse Osmosis (SWRO):
- Penyediaan air tawar bersih layak minum bagi warga pulau menggunakan teknologi membran osmosis terbalik bertenaga surya/arus laut.
- Pemanfaatan air garam pekat sisa desalinasi (*brine*) untuk tambak garam kristal bernilai ekonomi tinggi.

### 2. Pabrik Es & Biorefineri Rumput Laut:
- Pabrik es curah nelayan bertenaga mandiri untuk mempertahankan kualitas ekspor hasil tangkapan ikan lokal.
- Biorefineri alga terintegrasi: mengekstrak karagenan kualitas tinggi untuk pangan, protein untuk pakan ternak, dan residu selulosa untuk bio-kompos tanah pesisir.",
                ],
                [
                    'title' => "Modul 3: Desain Masterplan Pulau Mandiri & Tata Kelola Keberlanjutan — {$track}",
                    'instruction' => "Pelajari pemodelan tekno-ekonomi pulau mandiri energi-pangan, kelembagaan BUMDes/Koperasi pengelola, dan mitigasi risiko jangka panjang.",
                    'body' => "## Modul 3: Desain Masterplan Pulau Mandiri & Tata Kelola Keberlanjutan

Keberhasilan implementasi pulau mandiri membutuhkan masterplan komprehensif yang mengawinkan kelayakan teknologi dengan kelembagaan masyarakat lokal yang kuat.

### 1. Pemodelan Tekno-Ekonomi Terpadu:
- Perhitungan neraca energi harian pulau terhadap proyeksi kebutuhan beban listrik rumah tangga, pabrik es, dan desalinasi.
- Skema tarif utilitas yang terjangkau bagi nelayan lokal namun mampu menutupi biaya operasional pemeliharaan suku cadang (*O&M reserve*).

### 2. Tata Kelola Kelembagaan Komunitas:
- Pembentukan Badan Usaha Milik Desa (BUMDes) Bersama atau Koperasi Nelayan Pulau sebagai operator utama fasilitas.
- Pelatihan teknis intensif bagi generasi muda pulau sebagai operator mesin turbin, membran SWRO, dan laboratorium mutu pengolahan alga.",
                ],
            ],

            default => [
                [
                    'title' => "Modul 1: Konsep Fundamental & Kerangka Operasional — {$track}",
                    'instruction' => "Unduh dan pelajari materi Modul 1 mengenai konsep fundamental dan kerangka operasional {$track} sebelum melanjutkan ke modul berikutnya.",
                    'body' => "## Modul 1: Konsep Fundamental & Kerangka Operasional — {$track}

Pembangunan sektor maritim dalam spesialisasi {$track} memerlukan pemahaman komprehensif mengenai prinsip keberlanjutan ekologis, efisiensi sumber daya perairan, dan tata kelola berbasis sains.

### 1. Konsep Dasar & Prinsip Utama:
- Mengintegrasikan produktivitas ekonomi dengan perlindungan keanekaragaman hayati laut.
- Penyelarasan dengan Tujuan Pembangunan Berkelanjutan (SDG 14: Life Below Water) dan hukum maritim nasional.

### 2. Kerangka Operasional Sektor:
- Identifikasi pemangku kepentingan kunci: nelayan tradisional, industri kelautan, regulator kementerian, dan komunitas pesisir.
- Pemetaan alur operasional dari hulu ke hilir berbasis efisiensi sumber daya dan zero-waste.",
                ],
                [
                    'title' => "Modul 2: Metodologi Teknis, Standar Industri & Kepatuhan Regulasi — {$track}",
                    'instruction' => "Pelajari metodologi teknis, standar industri kelautan, dan kerangka kepatuhan regulasi nasional serta internasional dalam bidang {$track}.",
                    'body' => "## Modul 2: Metodologi Teknis, Standar Industri & Kepatuhan Regulasi — {$track}

Penerapan standar teknis yang ketat dan kepatuhan terhadap regulasi maritim menjadi prasyarat utama untuk menjamin keberlanjutan operasional {$track}.

### 1. Standar Teknis & Metodologi:
- Prosedur operasional baku (SOP) pelaksanaan kegiatan maritim ramah lingkungan.
- Instrumen pemantauan kualitas perairan dan mitigasi dampak lingkungan hidup.

### 2. Kepatuhan Regulasi & Kebijakan:
- Penyelarasan dengan peraturan perundang-undangan kelautan dan perikanan nasional.
- Penerapan standar sertifikasi internasional dan audit kepatuhan lingkungan secara periodik.",
                ],
                [
                    'title' => "Modul 3: Studi Kelayakan Proyek, Mitigasi Risiko & Implementasi Komersial — {$track}",
                    'instruction' => "Pelajari analisis kelayakan finansial proyek maritim, mitigasi risiko ekologis, dan strategi eksekusi komersial dalam bidang {$track}.",
                    'body' => "## Modul 3: Studi Kelayakan Proyek, Mitigasi Risiko & Implementasi Komersial — {$track}

Eksekusi komersial proyek maritim menuntut analisis kelayakan multidimensi yang menyeimbangkan profitabilitas finansial dengan dampak sosial-ekologis positif.

### 1. Analisis Kelayakan & Finansial:
- Proyeksi CapEx, OpEx, serta penilaian arus kas dan periode pengembalian investasi.
- Akses ke skema pembiayaan berkelanjutan (Blended Finance, Green/Blue Bond).

### 2. Mitigasi Risiko & Kemitraan Komunitas:
- Manajemen risiko biofisik kelautan, perubahan iklim, dan fluktuasi pasar global.
- Kemitraan inklusif dengan masyarakat pesisir untuk menjamin keberlanjutan jangka panjang.",
                ],
            ],
        };
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
