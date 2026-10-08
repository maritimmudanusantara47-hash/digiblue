<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Certificate – {{ $user->name }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; size: A4 landscape; }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', 'DejaVu Sans', Arial, Helvetica, sans-serif;
            background: #ffffff;
        }

        .cert-page {
            width: 297mm;
            height: 209.5mm;
            position: relative;
            overflow: hidden;
            page-break-after: always;
        }

        .cert-page:last-child {
            page-break-after: avoid;
        }

        .bg-template {
            position: absolute;
            top: 0; left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 1;
        }

        .overlay {
            position: absolute;
            top: 0; left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 2;
        }

        /* ── Serial Number ── */
        .f-serial {
            position: absolute;
            top: 13.0mm;
            right: 16.5mm;
            width: 105mm;
            height: 7.5mm;
            line-height: 7.5mm;
            background: transparent;
            font-size: 11pt;
            font-family: 'Poppins', 'DejaVu Sans', sans-serif;
            color: #111827;
            text-align: right;
            z-index: 3;
        }

        /* ── Recipient Name (Centered right above the blue line) ── */
        .f-name {
            position: absolute;
            top: 69.5mm;
            left: 0;
            right: 0;
            height: 16mm;
            line-height: 16mm;
            text-align: center;
            font-size: 32.5pt;
            font-weight: bold;
            font-family: 'Arial MT Pro', Arial, Helvetica, sans-serif;
            color: #000000;
            letter-spacing: 0.3px;
            z-index: 3;
        }

        /* ── Ribbon Specialization / Course Title ── */
        .f-ribbon {
            position: absolute;
            top: 99.0mm;
            left: 20mm;
            right: 20mm;
            height: 14mm;
            line-height: 14mm;
            text-align: center;
            font-size: 22.5pt;
            font-weight: bold;
            font-family: 'Arial MT Pro', Arial, Helvetica, sans-serif;
            color: #173874;
            letter-spacing: 0.1px;
            white-space: nowrap;
            z-index: 3;
        }

        /* ── Level Value (Directly below "Level:") ── */
        .f-level {
            position: absolute;
            top: 122.8mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 14.5pt;
            font-weight: bold;
            font-family: 'Poppins', 'DejaVu Sans', sans-serif;
            color: #000000;
            z-index: 3;
        }

        /* ── Grade, Date of issue, Place of issue ── */
        .f-meta-block {
            position: absolute;
            top: 138.0mm;
            left: 103.5mm;
            width: 90mm;
            background: transparent;
            text-align: center;
            font-size: 10.5pt;
            font-family: 'Poppins', 'DejaVu Sans', sans-serif;
            line-height: 1.35;
            color: #1f2937;
            z-index: 3;
        }

        .f-meta-block .meta-line {
            margin: 0;
            padding: 0;
            line-height: 1.35;
        }

        .f-meta-block strong {
            font-weight: bold;
            color: #111827;
        }

        /* ── QR Codes with Clean Framed Card ── */
        .f-qr-left {
            position: absolute;
            top: 147.5mm;
            left: 67.0mm;
            width: 25mm;
            height: 25mm;
            z-index: 3;
        }

        .f-qr-right {
            position: absolute;
            top: 147.5mm;
            left: 196.4mm;
            width: 25mm;
            height: 25mm;
            z-index: 3;
        }

        .f-qr-card {
            background: #ffffff;
            border: 0.5pt solid #cbd5e1;
            border-radius: 4px;
            padding: 1.2mm;
            box-sizing: border-box;
        }

        .f-qr-img {
            width: 100%;
            height: 100%;
            display: block;
        }

        /* ── Page 2: Back Side Competencies Title Block ── */
        .back-title-block {
            position: absolute;
            top: 21.0mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            z-index: 3;
        }

        .back-title {
            font-family: 'Poppins', 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 15.5pt;
            font-weight: 700;
            color: #000000;
            letter-spacing: 0.1px;
            line-height: 1.25;
            margin: 0;
            padding: 0;
        }

        .back-subtitle {
            font-family: 'Poppins', 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 13.5pt;
            font-weight: 400;
            color: #000000;
            margin-top: 2.2mm;
            line-height: 1.2;
        }
    </style>
</head>
<body>

    @php
        // Dynamic course/level text formatting
        $courseTitle = $course->title ?? '';
        $levelName   = $level->name ?? '';
        $levelCode   = $level->code ?? '';

        $isFoundation = str_contains(strtolower($courseTitle), 'foundation')
            || str_contains(strtolower($levelName), 'foundation')
            || strtolower($levelCode) === 'fnd'
            || strtolower($levelCode) === 'foundation';

        if ($isFoundation) {
            $ribbonText   = 'Certified Blue Economist (CBEc)';
            $levelDisplay = 'Foundation Level';
        } else {
            // Extract specialization name
            $specName = preg_replace('/^(Certified Blue Economist|CBEc Specialization|CBEc)\s*(in|—|-)?\s*/iu', '', $courseTitle);
            $specName = trim(str_replace(['—', '-'], '', $specName));
            if (empty($specName)) {
                $specName = $levelName ?: 'Specialization';
            }

            $codeSuffix = $levelCode ? "({$levelCode}.)" : "";
            $ribbonText = "Certified Blue Economist in {$specName} - CBEc. {$codeSuffix}";
            $ribbonText = trim($ribbonText);

            $levelDisplay = str_contains(strtolower($levelName), 'specialization')
                ? $levelName
                : "{$specName} Specialization";
        }
        // Load optional layout overrides from cert_layout.json
        $layoutPath = storage_path('app/cert_layout.json');
        $L = file_exists($layoutPath) ? json_decode(file_get_contents($layoutPath), true) : [];

        $sTop   = $L['serial_no']['top'] ?? 13.0;
        $sRight = $L['serial_no']['right'] ?? 16.5;
        $sWidth = $L['serial_no']['width'] ?? 105;
        $sFs    = $L['serial_no']['font_size'] ?? 11.0;

        $nTop = $L['recipient_name']['top'] ?? 69.5;
        $nFs  = $L['recipient_name']['font_size'] ?? 32.5;

        $rTop = $L['ribbon_text']['top'] ?? 99.0;
        $rFs  = $L['ribbon_text']['font_size'] ?? 22.5;
        if (mb_strlen($ribbonText) > 65) {
            $rFs = min($rFs, 17.5);
        } elseif (mb_strlen($ribbonText) > 52) {
            $rFs = min($rFs, 19.5);
        }
        $rH   = $L['ribbon_text']['height'] ?? 14.0;

        $lTop = $L['level_value']['top'] ?? 122.8;
        $lFs  = $L['level_value']['font_size'] ?? 14.5;

        $mTop = $L['meta_block']['top'] ?? 138.0;
        $mFs  = $L['meta_block']['font_size'] ?? 10.5;

        $qlTop  = $L['qr_left']['top'] ?? 147.5;
        $qlLeft = $L['qr_left']['left'] ?? 67.0;
        $qSize  = $L['qr_left']['size'] ?? 26;

        $qrTop  = $L['qr_right']['top'] ?? 147.5;
        $qrLeft = $L['qr_right']['left'] ?? 196.4;

        $btTop = $L['back_title']['top'] ?? 20.0;
        $btFs  = $L['back_title']['font_size'] ?? 15.0;
    @endphp

    {{-- ==================== PAGE 1: FRONT ==================== --}}
    <div class="cert-page cert-page-front">
        {{-- Background Template Image --}}
        @if($templateBase64 ?? false)
            <img class="bg-template" src="data:image/png;base64,{{ $templateBase64 }}" alt="Certificate Template">
        @endif

        <div class="overlay">

            {{-- Serial Number --}}
            <div class="f-serial" style="top: {{ $sTop }}mm; right: {{ $sRight }}mm; width: {{ $sWidth }}mm; font-size: {{ $sFs }}pt;">
                Certificate Serial No. {{ $certificate->serial_number }}
            </div>

            {{-- Recipient Name --}}
            <div class="f-name" style="top: {{ $nTop }}mm; font-size: {{ $nFs }}pt;">
                {{ $user->name }}
            </div>

            {{-- Gold Ribbon Specialization Text --}}
            <div class="f-ribbon" style="top: {{ $rTop }}mm; height: {{ $rH }}mm; line-height: {{ $rH }}mm; font-size: {{ $rFs }}pt;">
                {{ $ribbonText }}
            </div>

            {{-- Level Value --}}
            <div class="f-level" style="top: {{ $lTop }}mm; font-size: {{ $lFs }}pt;">
                {{ $levelDisplay }}
            </div>

            {{-- Grade, Date, Place block --}}
            <div class="f-meta-block" style="top: {{ $mTop }}mm; font-size: {{ $mFs }}pt;">
                <div class="meta-line"><strong>Grade:</strong> {{ $certificate->grade ?? 'Excellent' }}</div>
                <div class="meta-line"><strong>Date of issue:</strong> {{ \Carbon\Carbon::parse($certificate->date_of_issue)->format('F j, Y') }}</div>
                <div class="meta-line"><strong>Place of issue:</strong> {{ $certificate->place_of_issue ?? 'Jakarta' }}</div>
            </div>

            {{-- Left QR Code --}}
            @if($qrImageBase64 ?? false)
                <div class="f-qr-left f-qr-card" style="top: {{ $qlTop }}mm; left: {{ $qlLeft }}mm; width: {{ $qSize }}mm; height: {{ $qSize }}mm;">
                    <img class="f-qr-img" src="data:image/svg+xml;base64,{{ $qrImageBase64 }}" alt="QR Code Left">
                </div>
            @endif

            {{-- Right QR Code --}}
            @if($qrImageBase64 ?? false)
                <div class="f-qr-right f-qr-card" style="top: {{ $qrTop }}mm; left: {{ $qrLeft }}mm; width: {{ $qSize }}mm; height: {{ $qSize }}mm;">
                    <img class="f-qr-img" src="data:image/svg+xml;base64,{{ $qrImageBase64 }}" alt="QR Code Right">
                </div>
            @endif

        </div>
    </div>

    {{-- ==================== PAGE 2: BACK ==================== --}}
    @if($templateBackBase64 ?? false)
    <div class="cert-page cert-page-back">
        <img class="bg-template" src="data:image/png;base64,{{ $templateBackBase64 }}" alt="Certificate Back Template">

        <div class="overlay">
            <div class="back-title-block" style="top: {{ $btTop }}mm;">
                @if($isFoundation)
                    <div class="back-title" style="font-size: {{ $btFs }}pt;">List of Competency Units of Certified Blue Economist (CBEc)</div>
                    <div class="back-subtitle" style="font-size: {{ max(10, $btFs - 2.0) }}pt;">Foundation Level</div>
                @else
                    <div class="back-title" style="margin-top: 3.5mm; font-size: {{ $btFs }}pt;">List of Competency Units of {{ $ribbonText }}</div>
                @endif
            </div>
        </div>
    </div>
    @endif

</body>
</html>
