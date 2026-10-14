import React from 'react';

export interface CertificateData {
  recipient_name?: string;
  program_name?: string;
  level?: string;
  specialization?: string;
  serial_number?: string;
  serial_url_key?: string;
  grade?: string;
  date_of_issue?: string;
  place_of_issue?: string;
  verification_url?: string;
  qr_code_svg?: string;
  qr_code_base64?: string;
  [key: string]: string | undefined;
}

export interface TemplateConfig {
  front: string;
  back: string;
  hasBack: boolean;
  typeLabel: string;
}

/**
 * Resolves certificate template graphics based on level and specialization title
 */
export function resolveTemplateImages(data?: CertificateData): TemplateConfig {
  if (!data) {
    return {
      front: '/images/certificates/template_foundation.png',
      back: '/images/certificates/template_back.png',
      hasBack: true,
      typeLabel: 'Foundation Level',
    };
  }

  const spec = (data.specialization || '').toLowerCase();
  const level = (data.level || '').toLowerCase();
  const serial = (data.serial_number || '').toLowerCase();

  // 1. Critical Thinking
  if (
    spec.includes('critical thinking') ||
    level.includes('critical thinking') ||
    serial.includes('cbetc')
  ) {
    return {
      front: '/images/certificates/template_critical_thinking_front.png',
      back: '/images/certificates/template_critical_thinking_back.png',
      hasBack: true,
      typeLabel: 'Critical Thinking Completion',
    };
  }

  // 2. Field Study
  const isFieldStudy =
    spec.includes('field study') ||
    spec.includes('pelatihan lapangan') ||
    serial.includes('fs');

  // Slug matching for specialization back templates
  let backSlug = '';
  if (spec.includes('tourism') || spec.includes('wisata')) backSlug = 'blue-tourism';
  else if (spec.includes('shipping') || spec.includes('pelayaran') || spec.includes('maritim')) backSlug = 'blue-shipping';
  else if (spec.includes('finance') || spec.includes('keuangan')) backSlug = 'blue-finance';
  else if (spec.includes('farming') || spec.includes('akuakultur') || spec.includes('budidaya')) backSlug = 'blue-farming';
  else if (spec.includes('energy') || spec.includes('energi')) backSlug = 'blue-energy';
  else if (spec.includes('data') || spec.includes('intelligence')) backSlug = 'blue-data-intelligence';
  else if (spec.includes('community') || spec.includes('komunitas')) backSlug = 'blue-community-development';
  else if (spec.includes('business') || spec.includes('bisnis')) backSlug = 'blue-business-development';
  else if (spec.includes('carbon') || spec.includes('karbon')) backSlug = 'blue-carbon';
  else if (spec.includes('circular') || spec.includes('sirkular')) backSlug = 'blue-circular-economy';

  if (isFieldStudy) {
    const backImg = backSlug
      ? `/images/certificates/template_fs_back_${backSlug}.png`
      : '/images/certificates/template_field_study_back.png';
    return {
      front: '/images/certificates/template_field_study_front.png',
      back: backImg,
      hasBack: true,
      typeLabel: 'Field Study Specialization',
    };
  }

  // 3. Foundation Level
  if (level.includes('foundation') || spec.includes('foundation')) {
    return {
      front: '/images/certificates/template_foundation.png',
      back: '/images/certificates/template_back.png',
      hasBack: true,
      typeLabel: 'Foundation Level',
    };
  }

  // 4. CBEc Specialization Level
  const backImg = backSlug
    ? `/images/certificates/template_cbec_back_${backSlug}.png`
    : '/images/certificates/template_back.png';

  return {
    front: '/images/certificates/template_CBEc.png',
    back: backImg,
    hasBack: true,
    typeLabel: 'Specialization Track',
  };
}

/**
 * Format ISO or YYYY-MM-DD date to a clean readable format
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Real scannable SVG QR Code element that renders crisply on certificate sheets
 */
export function CertificateQrCode({
  qrBase64,
  urlKey,
}: {
  qrBase64?: string;
  urlKey?: string;
}) {
  const qrSrc = qrBase64
    ? `data:image/svg+xml;base64,${qrBase64}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(
      `https://theblueeconomist.org/certification/${urlKey || ''}`
    )}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={qrSrc}
      alt="QR Verification Code"
      className="w-full h-full block object-contain"
    />
  );
}

export interface RenderedCertificateSheetProps {
  side: 'front' | 'back';
  data?: CertificateData;
  templateConfig: TemplateConfig;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * RENDERED CERTIFICATE SHEET COMPONENT
 * Uses CSS Container Queries (@container & cqw units) to ensure all text elements
 * (Name, Ribbon, Level, Serial Number, Date, QR Codes) stay 100% aligned with
 * the template background image at ANY screen width or zoom factor!
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function RenderedCertificateSheet({
  side,
  data,
  templateConfig,
}: RenderedCertificateSheetProps) {
  const imgSrc = side === 'back' ? templateConfig.back : templateConfig.front;
  const isFieldStudy =
    templateConfig.typeLabel === 'Field Study Specialization' ||
    templateConfig.typeLabel === 'Critical Thinking Completion';

  return (
    <div
      className="relative w-full aspect-[297/210] overflow-hidden rounded-xl bg-white select-none shadow-md"
      style={{ containerType: 'inline-size' }}
    >
      {/* Underlying Template Graphic */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={side === 'front' ? 'Certificate Front' : 'Certificate Back'}
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
      />

      {/* ── FRONT SIDE OVERLAYS ── */}
      {side === 'front' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {isFieldStudy ? (
            /* Field Study / Critical Thinking Front Layout */
            <>
              {/* Recipient Name */}
              <div
                className="absolute left-0 right-0 text-center font-bold text-black"
                style={{
                  top: '33.33%',
                  fontSize: '3.8cqw',
                  lineHeight: '1.2',
                  fontFamily: "'Arial MT Pro', Arial, Helvetica, sans-serif",
                }}
              >
                {data?.recipient_name}
              </div>

              {/* Course Title */}
              <div
                className="absolute text-center font-bold"
                style={{
                  top: '51.67%',
                  left: '5%',
                  right: '5%',
                  fontSize: '2.25cqw',
                  lineHeight: '1.25',
                  color: '#133e7c',
                  fontFamily: "'Arial MT Pro', Arial, Helvetica, sans-serif",
                }}
              >
                {data?.specialization || 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE'}
              </div>

              {/* Date of Issue & Place */}
              <div
                className="absolute left-0 right-0 text-center font-normal text-black"
                style={{
                  top: '67.38%',
                  fontSize: '1.6cqw',
                  fontFamily: "'Arial MT Pro', Arial, Helvetica, sans-serif",
                }}
              >
                {data?.place_of_issue || 'Jakarta'}, {formatDisplayDate(data?.date_of_issue)}
              </div>
            </>
          ) : (
            /* Standard Foundation & Specialization CBEc Front Layout */
            <>
              {/* 1. Serial Number (Top Right) */}
              <div
                className="absolute font-mono text-slate-900 font-semibold text-right"
                style={{
                  top: '6.19%',
                  right: '5.55%',
                  fontSize: '1.3cqw',
                  lineHeight: '1.4',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Certificate Serial No. {data?.serial_number}
              </div>

              {/* 2. Recipient Name (Centered above the blue divider line) */}
              <div
                className="absolute left-0 right-0 text-center font-bold text-black tracking-wide"
                style={{
                  top: '33.1%',
                  fontSize: '3.85cqw',
                  lineHeight: '1.15',
                  fontFamily: "'Arial MT Pro', Arial, Helvetica, sans-serif",
                }}
              >
                {data?.recipient_name}
              </div>

              {/* 3. Ribbon Text (Centered inside the golden ribbon banner) */}
              <div
                className="absolute text-center font-bold tracking-tight"
                style={{
                  top: '47.14%',
                  left: '6.7%',
                  right: '6.7%',
                  fontSize: '2.5cqw',
                  lineHeight: '1.3',
                  color: '#173874',
                  fontFamily: "'Arial MT Pro', Arial, Helvetica, sans-serif",
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {data?.level?.toLowerCase().includes('foundation')
                  ? (data?.program_name || 'Certified Blue Economist (CBEc)')
                  : (data?.specialization || data?.program_name || 'Certified Blue Economist')}
              </div>

              {/* 4. Level Value (Directly below "Level:") */}
              <div
                className="absolute left-0 right-0 text-center font-bold text-black"
                style={{
                  top: '58.48%',
                  fontSize: '1.7cqw',
                  lineHeight: '1.3',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {data?.level || 'Foundation Level'}
              </div>

              {/* 5. Meta Block (Grade, Date, Place) */}
              <div
                className="absolute text-center"
                style={{
                  top: '65.71%',
                  left: '34.85%',
                  width: '30.3%',
                  fontSize: '1.25cqw',
                  lineHeight: '1.4',
                  color: '#1f2937',
                  fontFamily: "'Poppins', sans-serif",
                  backgroundColor: 'rgba(248, 248, 248, 0.9)',
                  padding: '0.4cqw 0.8cqw',
                  borderRadius: '0.4cqw',
                }}
              >
                <div><strong>Grade:</strong> {data?.grade || 'Good'}</div>
                <div><strong>Date of issue:</strong> {data?.date_of_issue}</div>
                <div><strong>Place of issue:</strong> {data?.place_of_issue || 'Jakarta, Indonesia'}</div>
              </div>

              {/* 6. QR Code Left */}
              <div
                className="absolute bg-white border border-slate-300 rounded-[3px] shadow-xs flex items-center justify-center p-[0.35cqw] overflow-hidden"
                style={{
                  top: '70.24%',
                  left: '22.56%',
                  width: '8.42%',
                  aspectRatio: '1 / 1',
                }}
              >
                <CertificateQrCode qrBase64={data?.qr_code_base64} urlKey={data?.serial_url_key} />
              </div>

              {/* 7. QR Code Right */}
              <div
                className="absolute bg-white border border-slate-300 rounded-[3px] shadow-xs flex items-center justify-center p-[0.35cqw] overflow-hidden"
                style={{
                  top: '70.24%',
                  left: '66.13%',
                  width: '8.42%',
                  aspectRatio: '1 / 1',
                }}
              >
                <CertificateQrCode qrBase64={data?.qr_code_base64} urlKey={data?.serial_url_key} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── BACK SIDE OVERLAYS ── */}
      {side === 'back' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {isFieldStudy ? (
            /* Field Study Back Meta */
            <>
              <div
                className="absolute font-bold text-black"
                style={{
                  top: '11.9%',
                  left: '10.77%',
                  fontSize: '1.55cqw',
                  fontFamily: "'Arial MT Pro', Arial, sans-serif",
                }}
              >
                {data?.recipient_name}
              </div>
              <div
                className="absolute font-bold text-black"
                style={{
                  top: '14.05%',
                  left: '19.19%',
                  fontSize: '1.55cqw',
                  fontFamily: "'Arial MT Pro', Arial, sans-serif",
                }}
              >
                {data?.serial_number}
              </div>
            </>
          ) : (
            /* Standard Foundation & Specialization CBEc Back Title Block */
            <div
              className="absolute left-[6.7%] right-[6.7%] text-center"
              style={{
                top: '9.8%',
                fontFamily: "'Poppins', 'DejaVu Sans', Arial, sans-serif",
              }}
            >
              {data?.level?.toLowerCase().includes('foundation') ? (
                <>
                  <div
                    className="font-bold text-black tracking-tight"
                    style={{ fontSize: '1.85cqw', lineHeight: 1.25 }}
                  >
                    List of Competency Units of Certified Blue Economist (CBEc)
                  </div>
                  <div
                    className="font-normal text-black"
                    style={{ fontSize: '1.58cqw', marginTop: '0.4cqw', lineHeight: 1.2 }}
                  >
                    Foundation Level
                  </div>
                </>
              ) : (
                <div
                  className="font-bold text-black tracking-tight"
                  style={{ fontSize: '1.85cqw', lineHeight: 1.25, marginTop: '0.6cqw' }}
                >
                  List of Competency Units of {data?.specialization || data?.program_name || 'Certified Blue Economist'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
