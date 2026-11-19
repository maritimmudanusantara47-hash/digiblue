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

        $nTop = $L['ct_recipient_name']['top'] ?? $L['fs_recipient_name']['top'] ?? 70.0;
        $nLeft = $L['ct_recipient_name']['left'] ?? $L['fs_recipient_name']['left'] ?? 0;
        $nFs = $L['ct_recipient_name']['font_size'] ?? $L['fs_recipient_name']['font_size'] ?? 33.0;

        $tTop = $L['ct_course_title']['top'] ?? $L['fs_course_title']['top'] ?? 108.5;
        $tLeft = $L['ct_course_title']['left'] ?? $L['fs_course_title']['left'] ?? 0;
        $tFs = $L['ct_course_title']['font_size'] ?? $L['fs_course_title']['font_size'] ?? 19.0;

        $pTop = $L['ct_date_participation']['top'] ?? $L['fs_date_participation']['top'] ?? 134.5;
        $pLeft = $L['ct_date_participation']['left'] ?? $L['fs_date_participation']['left'] ?? 0;
        $pFs = $L['ct_date_participation']['font_size'] ?? $L['fs_date_participation']['font_size'] ?? 14.0;

        $iTop = $L['ct_date_issue']['top'] ?? $L['fs_date_issue']['top'] ?? 141.5;
        $iLeft = $L['ct_date_issue']['left'] ?? $L['fs_date_issue']['left'] ?? 0;
        $iFs = $L['ct_date_issue']['font_size'] ?? $L['fs_date_issue']['font_size'] ?? 14.0;

        $bnTop = $L['ct_back_name']['top'] ?? $L['fs_back_name']['top'] ?? 25.5;
        $bnLeft = $L['ct_back_name']['left'] ?? $L['fs_back_name']['left'] ?? 16.5;
        $bnFs = $L['ct_back_name']['font_size'] ?? $L['fs_back_name']['font_size'] ?? 11.5;

        $brTop = $L['ct_back_reg_no']['top'] ?? $L['fs_back_reg_no']['top'] ?? 30.8;
        $brLeft = $L['ct_back_reg_no']['left'] ?? $L['fs_back_reg_no']['left'] ?? 16.5;
        $brFs = $L['ct_back_reg_no']['font_size'] ?? $L['fs_back_reg_no']['font_size'] ?? 11.5;

        $issueCarbon = \Carbon\Carbon::parse($certificate->date_of_issue);
        $issueDateFormatted = $issueCarbon->format('j F Y');
        $place = $certificate->place_of_issue ?? 'Jakarta';
        // Hapus trailing 'Indonesia' jika format 'Jakarta, Indonesia' agar pas 'Jakarta, 11 June 2026'
        $placeShort = trim(explode(',', $place)[0]);

        $partDate = $participationDate ?? ('20 May – ' . $issueCarbon->format('j F Y'));
    @endphp

    {{-- ==================== PAGE 1: FRONT ==================== --}}
    <div class="cert-page cert-page-front">
        @if($templateFrontBase64 ?? false)
            <img class="bg-template" src="data:image/png;base64,{{ $templateFrontBase64 }}"
                alt="Field Study Certificate Front">
        @endif

        <div class="overlay">
            {{-- Recipient Name --}}
            <div class="fs-name" style="top: {{ $nTop }}mm; left: {{ $nLeft }}mm; width: 297mm; font-size: {{ $nFs }}pt;">
                {{ $user->name }}
            </div>

            {{-- Training Course Title --}}
            <div class="fs-title" style="top: {{ $tTop }}mm; left: {{ 15 + $tLeft }}mm; right: {{ 15 - $tLeft }}mm; font-size: {{ $tFs }}pt;">
                INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE
            </div>

            {{-- Date of Participation (with clean background matching template to blend seamlessly) --}}
            <div class="fs-part-date" style="top: {{ $pTop }}mm; left: {{ $pLeft }}mm; width: 297mm; font-size: {{ $pFs }}pt;">
                <span style="background: #F8F8F8; padding: 0 4mm;">on {{ $partDate }}</span>
            </div>

            {{-- Place & Issue Date (with clean background matching template to blend seamlessly) --}}
            <div class="fs-issue-date" style="top: {{ $iTop }}mm; left: {{ $iLeft }}mm; width: 297mm; font-size: {{ $iFs }}pt;">
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
                {{-- Clean mask covering Canva's uneven label text --}}
                <div style="position: absolute; top: 23.5mm; left: 14mm; width: 240mm; height: 14.5mm; background: #F8F8F8;"></div>

                {{-- Name --}}
                <div class="fs-back-text" style="top: {{ $bnTop }}mm; left: {{ $bnLeft }}mm; font-size: {{ $bnFs }}pt;">
                    <span style="font-weight: normal; color: #111827;">Name : </span><strong>{{ $user->name }}</strong>
                </div>

                {{-- Registration Number --}}
                <div class="fs-back-text" style="top: {{ $brTop }}mm; left: {{ $brLeft }}mm; font-size: {{ $brFs }}pt;">
                    <span style="font-weight: normal; color: #111827;">Registration Number : </span><strong>{{ $regNo }}</strong>
                </div>
            </div>
        </div>
    @endif
</body>

</html>