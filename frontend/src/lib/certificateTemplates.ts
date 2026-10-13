import type { Course } from '@/types';

export interface CertificateTemplate {
  id: string;
  levelCode: 'FND' | 'SPEC' | 'FIELD_STUDY' | 'NAT' | 'SGL' | string;
  badgeText: string;
  badgeStyle: {
    badge: string;
    border: string;
    bg: string;
    text: string;
  };
  title: string;
  subtitle: string;
  categoryLabel: string;
  description: string;
  imageFront: string;
  imageBack?: string;
  hasBack: boolean;
  frontHighlights: string[];
  backHighlights: string[];
  credibilityPoints: {
    icon: string;
    title: string;
    desc: string;
  }[];
  isOptionalAttendance?: boolean;
  attendanceConditionNote?: string;
}

/**
 * Returns mapped certificate template(s) for a given course.
 * - Foundation courses return both Foundation CBEc and Field Study certificates.
 * - Specialization courses return both Specialization CBEc and Field Study Specialization certificates (with optional attendance condition).
 */
export function getCertificateTemplatesForCourse(
  course: Course | null,
  locale = 'id'
): CertificateTemplate[] {
  const isEn = locale === 'en';

  if (!course) {
    return [
      getDefaultSpecTemplate('Certified Blue Economist', isEn),
      getFieldStudySpecializationTemplate('Certified Blue Economist', isEn),
    ];
  }

  const rawCode = (course.certification_level?.code ?? '').toUpperCase();
  const rawTitle = course.title || '';
  const rawSlug = course.slug || '';
  const levelName = course.certification_level?.name || '';

  const isFieldStudyOnly =
    rawCode === 'FIELD_STUDY' ||
    rawSlug.includes('field-study') ||
    rawSlug.includes('field-trip') ||
    rawSlug.includes('pelatihan-lapangan') ||
    rawTitle.toLowerCase().includes('field study') ||
    rawTitle.toLowerCase().includes('training course');

  const isFoundation =
    rawCode === 'FND' ||
    rawTitle.toLowerCase().includes('foundation') ||
    levelName.toLowerCase().includes('foundation');

  const isNational =
    rawCode === 'NAT' ||
    rawSlug.includes('national') ||
    levelName.toLowerCase().includes('national');

  const isSingleModule =
    rawCode === 'SGL' ||
    rawSlug.includes('modular') ||
    levelName.toLowerCase().includes('single module');

  // Case 1: Standalone Field Study Program
  if (isFieldStudyOnly) {
    return [getFieldStudyTemplate(isEn)];
  }

  // Case 2: Foundation Level (Includes main Foundation CBEc + companion Field Study Certificate)
  if (isFoundation) {
    return [
      getFoundationTemplate(isEn),
      getFieldStudyTemplate(isEn),
    ];
  }

  // Case 3: National Training Course
  if (isNational) {
    return [getNationalTemplate(rawTitle, isEn)];
  }

  // Case 4: Single Modular Course
  if (isSingleModule) {
    return [getSingleModuleTemplate(rawTitle, isEn)];
  }

  // Case 5: Specialization Track (SPEC) or Default
  // Every specialization course contains a field study section.
  // Participating grants both CBEc Specialization + Field Study Specialization.
  // Not participating grants only the CBEc Specialization certificate.
  return [
    getSpecializationTemplate(rawTitle, isEn),
    getFieldStudySpecializationTemplate(rawTitle, isEn),
  ];
}

function getFoundationTemplate(isEn: boolean): CertificateTemplate {
  return {
    id: 'fnd_cbec',
    levelCode: 'FND',
    badgeText: isEn ? 'Foundation Level' : 'Level Foundation',
    badgeStyle: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      border: 'border-amber-500',
      bg: 'bg-amber-500',
      text: 'text-amber-800',
    },
    title: 'Certified Blue Economist (CBEc) — Foundation Level',
    subtitle: isEn
      ? 'International Blue Economy Foundation Certification'
      : 'Sertifikasi Kompetensi Dasar Ekonomi Biru Internasional',
    categoryLabel: isEn ? 'Primary Foundation Credential' : 'Sertifikat Kompetensi Utama',
    description: isEn
      ? 'Official digital certificate issued by The Blue Economist & Maritim Muda Nusantara for Foundation Level graduates.'
      : 'Sertifikat resmi terakreditasi internasional yang diterbitkan oleh The Blue Economist & Maritim Muda Nusantara untuk lulusan Foundation Level.',
    imageFront: '/images/certificates/template_foundation.png',
    imageBack: '/images/certificates/template_back.png',
    hasBack: true,
    frontHighlights: isEn
      ? [
          'Full legal name of the certified recipient',
          'Professional designation: Certified Blue Economist (CBEc)',
          'Unique anti-counterfeit registration serial number',
          'Official consortium validation signatures & seal',
          'Live instant QR Code linking to The Blue Economist registry',
        ]
      : [
          'Nama lengkap resmi peserta yang lulus asesmen',
          'Gelar profesi non-akademik: Certified Blue Economist (CBEc)',
          'Nomor seri registrasi sertifikat unik anti-pemalsuan',
          'Tanda tangan & stempel resmi pimpinan konsorsium',
          'QR Code aktif verifikasi langsung ke database global The Blue Economist',
        ],
    backHighlights: isEn
      ? [
          'Comprehensive matrix of Blue Economy foundational competency units',
          'Official curriculum workload and assessment criteria',
          'International consortium accreditation endorsement',
        ]
      : [
          'Matriks daftar unit kompetensi dasar Blue Economy terakreditasi',
          'Rincian beban kurikulum & standar kelulusan asesmen',
          'Pernyataan akreditasi resmi konsorsium internasional',
        ],
    credibilityPoints: [
      {
        icon: 'scan',
        title: isEn ? 'Instant QR Verification' : 'Verifikasi QR Code Instan',
        desc: isEn
          ? 'Verifiable online anytime by global employers via QR code.'
          : 'Dapat dipindai & diverifikasi langsung oleh instansi/pemberi kerja.',
      },
      {
        icon: 'shield-2-check',
        title: isEn ? 'Anti-Counterfeit Serial' : 'ID Serial Unik Terdaftar',
        desc: isEn
          ? 'Each certificate features an immutable tracking sequence.'
          : 'Setiap lembar sertifikat memiliki kode penomoran unik resmi.',
      },
      {
        icon: 'graduation-cap-1',
        title: isEn ? 'Global Recognition' : 'Pengakuan Internasional',
        desc: isEn
          ? 'Accredited by The Blue Economist International Association.'
          : 'Diakui oleh jaringan profesional The Blue Economist global.',
      },
    ],
  };
}

function getFieldStudyTemplate(isEn: boolean): CertificateTemplate {
  return {
    id: 'field_study',
    levelCode: 'FIELD_STUDY',
    badgeText: isEn ? 'Field Study Program' : 'Pelatihan Lapangan (Field Study)',
    badgeStyle: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      border: 'border-emerald-600',
      bg: 'bg-emerald-600',
      text: 'text-emerald-800',
    },
    title: 'Training Course (Field Study) Certificate',
    subtitle: isEn
      ? 'Integrated Maritime Field Study Competency (1.5 ECTS)'
      : 'Praktikum Lapangan Terpadu Konsorsium (30 Jam · 1.5 ECTS)',
    categoryLabel: isEn ? 'Practical Field Study Credential' : 'Sertifikat Praktikum Lapangan',
    description: isEn
      ? 'Specialized certificate for participants of the International Blue Economist Training Course / Field Study, including 30 hours of fieldwork and 1.5 ECTS credits.'
      : 'Sertifikat khusus bagi peserta praktikum lapangan Training Course (Field Study) dengan beban 30 jam pembelajaran terpadu setara 1.5 ECTS credit transfer.',
    imageFront: '/images/certificates/template_field_study_front.png',
    imageBack: '/images/certificates/template_field_study_back.png',
    hasBack: true,
    frontHighlights: isEn
      ? [
          'Participant identity and training course title',
          'Period and verified date of field study participation',
          'Consortium issue date & official registration number (CBETC)',
          'Consortium presidential authorization seal',
        ]
      : [
          'Identitas peserta dan nama program pelatihan lapangan',
          'Periode & tanggal pelaksanaan praktikum observasi',
          'Nomor registrasi konsorsium resmi (format CBETC unik)',
          'Otorisasi & stempel kepemimpinan konsorsium maritim',
        ],
    backHighlights: isEn
      ? [
          'Field study curriculum structure (30 Hours / 1.5 ECTS)',
          'Modules: Coastal Observation, Community Dialogue, Field FGD & Recommendation',
          'Evaluation and competence breakdown',
        ]
      : [
          'Struktur kurikulum Field Study terperinci (30 Jam, 1.5 ECTS)',
          'Materi: Observasi Lapangan, Dialog Komunitas, Riset Data, dan FGD',
          'Transkrip capaian kompetensi praktis peserta',
        ],
    credibilityPoints: [
      {
        icon: 'water-drop-1',
        title: isEn ? '1.5 ECTS Credit Transfer' : 'Setara 1.5 ECTS Credit',
        desc: isEn
          ? 'Standardized 30-hour workload recognized for university credits.'
          : 'Beban 30 jam pembelajaran praktis berstandar akademik Eropa.',
      },
      {
        icon: 'shield-2-check',
        title: isEn ? 'Verified Fieldwork' : 'Verifikasi Kehadiran Nyata',
        desc: isEn
          ? 'Awarded only upon completion and verification of on-site fieldwork.'
          : 'Diterbitkan khusus bagi peserta yang tervalidasi hadir di lokasi.',
      },
      {
        icon: 'file-multiple',
        title: isEn ? 'Two-sided Transcript' : 'Transkrip 2 Halaman Lengkap',
        desc: isEn
          ? 'Front certificate and detailed curriculum transcript on reverse side.'
          : 'Tampak depan sertifikat dan tampak belakang transkrip kompetensi.',
      },
    ],
  };
}

function getFieldStudySpecializationTemplate(courseTitle: string, isEn: boolean): CertificateTemplate {
  return {
    id: 'field_study_spec',
    levelCode: 'FIELD_STUDY',
    badgeText: isEn ? 'Field Study Specialization' : 'Field Study Specialization',
    badgeStyle: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      border: 'border-emerald-600',
      bg: 'bg-emerald-600',
      text: 'text-emerald-800',
    },
    title: isEn
      ? `Training Course (Field Study) — ${courseTitle}`
      : `Sertifikat Praktikum Lapangan (Field Study) — ${courseTitle}`,
    subtitle: isEn
      ? 'Specialization Integrated Fieldwork (30 Hours · 1.5 ECTS)'
      : 'Praktikum Lapangan Terpadu Peminatan Spesialisasi (30 Jam · 1.5 ECTS)',
    categoryLabel: isEn ? 'Field Study Specialization' : 'Field Study Specialization',
    description: isEn
      ? 'Official companion certificate earned by participants who confirm and attend the Specialization Field Study. Attending grants BOTH certificates (CBEc Specialization + Field Study Specialization). Not attending grants only the CBEc Specialization certificate.'
      : 'Sertifikat pendamping resmi bagi peserta kursus Specialization yang mengonfirmasi & mengikuti kegiatan Field Study. Jika mengikuti, peserta mendapatkan 2 Sertifikat (CBEc Specialization + Field Study Specialization). Jika tidak mengikuti, peserta tetap lulus dan hanya mendapatkan Sertifikat CBEc Specialization.',
    imageFront: '/images/certificates/template_field_study_front.png',
    imageBack: '/images/certificates/template_field_study_back.png',
    hasBack: true,
    isOptionalAttendance: true,
    attendanceConditionNote: isEn
      ? 'Awarded upon confirming and completing the Field Study program. If you do not participate, you will receive only the CBEc Specialization certificate.'
      : 'Didapatkan jika mengonfirmasi & mengikuti program Field Study. Jika tidak mengikuti, kamu hanya mendapatkan Sertifikat CBEc Specialization.',
    frontHighlights: isEn
      ? [
          'Recipient identity and specialization field study program',
          'Period and verified date of field study fieldwork',
          'Official CBETC registration serial number',
          'Consortium presidential authorization seal & signatures',
        ]
      : [
          'Identitas peserta dan nama program peminatan spesialisasi',
          'Periode & tanggal pelaksanaan praktikum observasi lapangan',
          'Nomor seri registrasi konsorsium resmi (format unik CBETC)',
          'Otorisasi & stempel kepemimpinan konsorsium maritim',
        ],
    backHighlights: isEn
      ? [
          'Field study specialized curriculum structure (30 Hours / 1.5 ECTS)',
          'Specialized modules: Coastal Industry Observation, Community Dialogue & Sectoral FGD',
          'Transcript of practical competencies and evaluation breakdown',
        ]
      : [
          'Struktur kurikulum Field Study terperinci (30 Jam, 1.5 ECTS)',
          'Materi spesialisasi: Observasi Industri Pesisir, Dialog Komunitas, Riset Sektoral, dan FGD',
          'Transkrip capaian kompetensi praktis peserta terverifikasi',
        ],
    credibilityPoints: [
      {
        icon: 'water-drop-1',
        title: isEn ? '1.5 ECTS Credit Transfer' : 'Setara 1.5 ECTS Credit',
        desc: isEn
          ? 'Standardized 30-hour workload recognized for university credits.'
          : 'Beban 30 jam pembelajaran praktis berstandar akademik Eropa.',
      },
      {
        icon: 'shield-2-check',
        title: isEn ? 'Verified On-site Fieldwork' : 'Verifikasi Kehadiran Nyata',
        desc: isEn
          ? 'Awarded only upon completion and attendance verification of on-site fieldwork.'
          : 'Diterbitkan khusus bagi peserta yang terverifikasi hadir di lokasi.',
      },
      {
        icon: 'file-multiple',
        title: isEn ? 'Two-sided Transcript' : 'Transkrip 2 Halaman Lengkap',
        desc: isEn
          ? 'Front certificate and detailed curriculum transcript on reverse side.'
          : 'Tampak depan sertifikat dan tampak belakang transkrip kompetensi.',
      },
    ],
  };
}

function getSpecializationTemplate(courseTitle: string, isEn: boolean): CertificateTemplate {
  let cleanTitle = courseTitle;
  if (!cleanTitle.includes('Certified Blue Economist')) {
    cleanTitle = `Certified Blue Economist in ${courseTitle} (CBEc)`;
  }

  return {
    id: 'spec_cbec',
    levelCode: 'SPEC',
    badgeText: isEn ? 'Specialization Track' : 'Peminatan Spesialisasi',
    badgeStyle: {
      badge: 'bg-navy/10 text-navy border-navy/30',
      border: 'border-navy',
      bg: 'bg-navy',
      text: 'text-navy',
    },
    title: cleanTitle,
    subtitle: isEn
      ? 'Accredited Blue Economy Specialization Credential'
      : 'Sertifikasi Keahlian Khusus Peminatan Ekonomi Biru',
    categoryLabel: isEn ? 'Specialization Credential' : 'Sertifikat Peminatan Terakreditasi',
    description: isEn
      ? 'Professional certificate recognizing advanced competency in this specialization track with non-academic post-nominal CBEc.'
      : 'Sertifikat resmi keahlian mendalam pada jalur peminatan dengan hak pencantuman gelar profesi non-akademik CBEc.',
    imageFront: '/images/certificates/template_CBEc.png',
    imageBack: '/images/certificates/template_back.png',
    hasBack: true,
    frontHighlights: isEn
      ? [
          'Graduate name & specialized sector attribution',
          'Professional designation: CBEc with specialization post-nominal',
          'Serial registration code & evaluation grade (Good/Excellent)',
          'Consortium verification seal & leadership signatures',
          'Live instant QR Code linking to The Blue Economist global directory',
        ]
      : [
          'Nama lulusan beserta sektor spesialisasi maritim terkait',
          'Pencantuman gelar non-akademik CBEc ber-akronim resmi',
          'Predikat kelulusan (Good/Excellent) & nomor seri sertifikat',
          'Stempel konsorsium dan tanda tangan pimpinan penguji',
          'QR Code verifikasi instan ke direktori global The Blue Economist',
        ],
    backHighlights: isEn
      ? [
          'Detailed list of industry competency units for this specialization',
          'Assessment scores and qualification criteria',
          'Consortium international verification framework',
        ]
      : [
          'Daftar lengkap unit kompetensi industri pada bidang peminatan ini',
          'Standar penilaian asesmen dan kualifikasi keahlian',
          'Kerangka kerja verifikasi konsorsium internasional',
        ],
    credibilityPoints: [
      {
        icon: 'scan',
        title: isEn ? 'Instant QR Verification' : 'Verifikasi QR Code Instan',
        desc: isEn
          ? 'Direct employer verification on the international registry.'
          : 'Pemberi kerja dapat memverifikasi keaslian via scan QR dalam hitungan detik.',
      },
      {
        icon: 'shield-2-check',
        title: isEn ? 'Industry Post-Nominal' : 'Gelar Profesi Non-Akademik',
        desc: isEn
          ? 'Authorized to use the professional CBEc credential on professional profiles.'
          : 'Hak resmi mencantumkan gelar CBEc di CV, profil LinkedIn & portofolio.',
      },
      {
        icon: 'graduation-cap-1',
        title: isEn ? 'Specialized Domain Competency' : 'Standar Kompetensi Spesifik',
        desc: isEn
          ? 'Endorsed by international practitioners and academic consortiums.'
          : 'Disusun bersama praktisi industri & akademisi maritim terkemuka.',
      },
    ],
  };
}

function getNationalTemplate(courseTitle: string, isEn: boolean): CertificateTemplate {
  return {
    id: 'nat_cert',
    levelCode: 'NAT',
    badgeText: isEn ? 'National Training' : 'Pelatihan Tingkat Nasional',
    badgeStyle: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      border: 'border-emerald-600',
      bg: 'bg-emerald-600',
      text: 'text-emerald-800',
    },
    title: courseTitle || (isEn ? 'National Blue Economy Certificate' : 'Sertifikat Pelatihan Nasional Blue Economy'),
    subtitle: isEn
      ? 'National Competency Training Certification'
      : 'Sertifikasi Pelatihan Kompetensi Standar Nasional',
    categoryLabel: isEn ? 'National Competency Credential' : 'Sertifikat Kompetensi Nasional',
    description: isEn
      ? 'Certificate of completion for national-level training programs in the Blue Economy ecosystem.'
      : 'Sertifikat kelulusan resmi program pelatihan standar nasional dalam ekosistem ekonomi biru.',
    imageFront: '/images/certificates/template_foundation.png',
    imageBack: '/images/certificates/template_back.png',
    hasBack: true,
    frontHighlights: isEn
      ? [
          'Recipient identity and completion grade',
          'Official program identifier and national serial number',
          'Instant QR verification code',
        ]
      : [
          'Identitas penerima sertifikat & predikat kelulusan',
          'Nomor seri registrasi sertifikat nasional',
          'QR Code verifikasi instan',
        ],
    backHighlights: isEn
      ? ['National training competency modules and curriculum structure']
      : ['Modul kompetensi pelatihan nasional & struktur pembelajaran'],
    credibilityPoints: [
      {
        icon: 'scan',
        title: isEn ? 'Verified QR Code' : 'Verifikasi QR Code',
        desc: isEn ? 'Direct link to verification database.' : 'Tautan langsung ke basis data sertifikat terdaftar.',
      },
      {
        icon: 'shield-2-check',
        title: isEn ? 'National Scope' : 'Standar Nasional Resmi',
        desc: isEn ? 'Aligned with national blue economy frameworks.' : 'Sesuai dengan pedoman kompetensi maritim nasional.',
      },
    ],
  };
}

function getSingleModuleTemplate(courseTitle: string, isEn: boolean): CertificateTemplate {
  return {
    id: 'sgl_cert',
    levelCode: 'SGL',
    badgeText: isEn ? 'Single Modular' : 'Modul Mandiri (Single Module)',
    badgeStyle: {
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      border: 'border-purple-600',
      bg: 'bg-purple-600',
      text: 'text-purple-800',
    },
    title: courseTitle || (isEn ? 'Modular Certificate of Completion' : 'Sertifikat Kelulusan Modul Tematik'),
    subtitle: isEn
      ? 'Thematic Module Competency Credential'
      : 'Sertifikat Kelulusan Modul Kompetensi Tematik',
    categoryLabel: isEn ? 'Modular Credential' : 'Sertifikat Modul Terverifikasi',
    description: isEn
      ? 'Certificate awarded upon mastering this dedicated thematic learning module.'
      : 'Sertifikat tanda kelulusan penguasaan materi modul tematik spesifik ekonomi biru.',
    imageFront: '/images/certificates/template_foundation.png',
    imageBack: '/images/certificates/template_back.png',
    hasBack: true,
    frontHighlights: isEn
      ? [
          'Recipient name & module title',
          'Verified completion date and serial code',
          'QR Code for online verification',
        ]
      : [
          'Nama penerima & judul modul tematik',
          'Tanggal kelulusan & nomor registrasi digital',
          'QR Code verifikasi online',
        ],
    backHighlights: isEn
      ? ['Learning outcomes and competency syllabus units']
      : ['Capaian pembelajaran & unit silabus modul'],
    credibilityPoints: [
      {
        icon: 'scan',
        title: isEn ? 'Online Verification' : 'Verifikasi Online',
        desc: isEn ? 'Verifiable credential record.' : 'Catatan kelulusan terverifikasi online.',
      },
      {
        icon: 'shield-2-check',
        title: isEn ? 'Modular Credit' : 'Akreditasi Modul',
        desc: isEn ? 'Recognized thematic achievement.' : 'Pengakuan pencapaian materi pembelajaran mandiri.',
      },
    ],
  };
}

function getDefaultSpecTemplate(courseTitle: string, isEn: boolean): CertificateTemplate {
  return getSpecializationTemplate(courseTitle, isEn);
}
