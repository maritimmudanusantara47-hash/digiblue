<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Certificate of Completion – {{ $user->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            size: A4 landscape;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #F8F8F8;
        }

        .cert-page {
            width: 297mm;
            height: 209.5mm;
            position: relative;
            overflow: hidden;
            background: #F8F8F8;
            page-break-after: always;
        }

        .cert-page:last-child {
            page-break-after: avoid;
        }

        .bg-template {
            position: absolute;
            top: 0;
            left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 1;
        }

        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 2;
        }

        /* ── FRONT FIELDS ── */
        .fs-name {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-weight: bold;
            color: #000000;
            letter-spacing: 0.3px;
        }

        .fs-title {
            position: absolute;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-weight: bold;
            color: #133e7c;
            letter-spacing: 0.2px;
        }

        .fs-part-date {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-weight: bold;
            color: #000000;
        }

        .fs-issue-date {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            color: #000000;
        }

        /* ── BACK FIELDS ── */
        .fs-back-text {
            position: absolute;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 500;
            color: #111827;
        }
    </style>
</head>

<body>
    @php
        $L = $layout ?? [];

        $nTop = $L['fs_recipient_name']['top'] ?? 70.0;
        $nFs = $L['fs_recipient_name']['font_size'] ?? 33.0;

        $tTop = $L['fs_course_title']['top'] ?? 108.5;
        $tFs = $L['fs_course_title']['font_size'] ?? 19.0;

        $pTop = $L['fs_date_participation']['top'] ?? 134.5;
        $pFs = $L['fs_date_participation']['font_size'] ?? 14.0;

        $iTop = $L['fs_date_issue']['top'] ?? 141.5;
        $iFs = $L['fs_date_issue']['font_size'] ?? 14.0;

        $bnTop = $L['fs_back_name']['top'] ?? 26.7;
        $bnLeft = $L['fs_back_name']['left'] ?? 29.2;
        $bnFs = $L['fs_back_name']['font_size'] ?? 11.5;

        $brTop = $L['fs_back_reg_no']['top'] ?? 30.9;
        $brLeft = $L['fs_back_reg_no']['left'] ?? 54.5;
        $brFs = $L['fs_back_reg_no']['font_size'] ?? 11.5;

        $issueCarbon = \Carbon\Carbon::parse($certificate->date_of_issue);
        $issueDateFormatted = $issueCarbon->format('j F Y');
        $place = $certificate->place_of_issue ?? 'Jakarta';
        // Hapus trailing 'Indonesia' jika format 'Jakarta, Indonesia' agar pas 'Jakarta, 11 June 2026'
        $placeShort = trim(explode(',', $place)[0]);

        $partDate = $participationDate ?? ('20 May – ' . $issueCarbon->format('j F Y'));

        $rawCourseSlug = $course->slug ?? '';
        $rawCourseTitle = $course->title ?? '';
        $levelName = $course->certificationLevel->name ?? '';
        $levelCode = $course->certificationLevel->code ?? '';

        $isFoundation = str_contains(strtolower($rawCourseTitle), 'foundation')
            || str_contains(strtolower($levelName), 'foundation')
            || strtolower($levelCode) === 'fnd'
            || strtolower($levelCode) === 'foundation';

        $isGroupB = in_array($rawCourseSlug, [
            'blue-energy',
            'blue-circular-economy',
            'blue-community-development',
            'blue-business-development',
            'blue-data-intelligence',
        ])
            || str_contains(strtolower($rawCourseTitle), 'energy')
            || str_contains(strtolower($rawCourseTitle), 'circular')
            || str_contains(strtolower($rawCourseTitle), 'community')
            || str_contains(strtolower($rawCourseTitle), 'business development')
            || str_contains(strtolower($rawCourseTitle), 'data intelligence');

        if ($isFoundation) {
            $bnTop += -1.4;
            $bnLeft += 2.5;
            $brTop += -1.0;
            $brLeft += 2.5;
        } elseif ($isGroupB) {
            $bnTop += -1.1;
            $bnLeft += -2.0;
            $brTop += 0.4;
            $brLeft += -6.5;
        }

        if ($isFoundation) {
            $displayCourseTitle = 'International Blue Economist Certification Training Course';
        } else {
            // Format judul spesialisasi: "International Blue Economist Certification Training Course - {Track} Specialization"
            $specName = preg_replace('/^Certified Blue Economist in\s*/i', '', $rawCourseTitle);
            $specName = preg_replace('/\s*\(CBEc\)/i', '', $specName);
            $specName = trim($specName);

            if (!empty($specName)) {
                if (!str_contains(strtolower($specName), 'specialization')) {
                    $specName .= ' Specialization';
                }
                $displayCourseTitle = "International Blue Economist Certification Training Course - {$specName}";
            } else {
                $displayCourseTitle = 'International Blue Economist Certification Training Course';
            }
        }
    @endphp

    {{-- ==================== PAGE 1: FRONT ==================== --}}
    <div class="cert-page cert-page-front">
        @if($templateFrontBase64 ?? false)
            <img class="bg-template" src="data:image/png;base64,{{ $templateFrontBase64 }}"
                alt="Field Study Certificate Front">
        @endif

        <div class="overlay">
            {{-- Recipient Name --}}
            <div class="fs-name" style="top: {{ $nTop }}mm; font-size: {{ $nFs }}pt;">
                {{ $user->name }}
            </div>

            {{-- Training Course Title --}}
            <div class="fs-title" style="top: {{ $tTop }}mm; font-size: {{ $tFs }}pt;">
                {{ $displayCourseTitle }}
            </div>

            {{-- Date of Participation (with clean background matching template to blend seamlessly) --}}
            <div class="fs-part-date" style="top: {{ $pTop }}mm; font-size: {{ $pFs }}pt;">
                <span style="background: #F8F8F8; padding: 0 4mm;">on {{ $partDate }}</span>
            </div>

            {{-- Place & Issue Date (with clean background matching template to blend seamlessly) --}}
            <div class="fs-issue-date" style="top: {{ $iTop }}mm; font-size: {{ $iFs }}pt;">
                <span style="background: #F8F8F8; padding: 0 4mm;">{{ $placeShort }}, {{ $issueDateFormatted }}</span>
            </div>
        </div>
    </div>

    {{-- ==================== PAGE 2: BACK ==================== --}}
    @if($templateBackBase64 ?? false)
        <div class="cert-page cert-page-back">
            <img class="bg-template" src="data:image/png;base64,{{ $templateBackBase64 }}"
                alt="Field Study Curriculum Structure Back">

            <div class="overlay">
                {{-- Name after "Name : " --}}
                <div class="fs-back-text" style="top: {{ $bnTop }}mm; left: {{ $bnLeft }}mm; font-size: {{ $bnFs }}pt;">
                    {{ $user->name }}
                </div>

                {{-- Registration Number after "Registration Number : " --}}
                <div class="fs-back-text" style="top: {{ $brTop }}mm; left: {{ $brLeft }}mm; font-size: {{ $brFs }}pt;">
                    {{ $regNo }}
                </div>
            </div>
        </div>
    @endif
</body>

</html>