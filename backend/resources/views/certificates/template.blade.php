<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Certificate – {{ $user->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; size: A4 landscape; }

        body {
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            background: #F8F8F8;
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

        /* ── Serial Number (Covers template placeholder completely) ── */
        .f-serial {
            position: absolute;
            top: 13.0mm;
            right: 14.0mm;
            width: 105mm;
            height: 7.5mm;
            line-height: 7.5mm;
            background: #F8F8F8;
            font-size: 8.8pt;
            color: #111827;
            text-align: right;
            z-index: 3;
        }

        /* ── Recipient Name (Centered right above the blue line) ── */
        .f-name {
            position: absolute;
            top: 67.0mm;
            left: 0;
            right: 0;
            height: 16mm;
            line-height: 16mm;
            text-align: center;
            font-size: 27pt;
            font-weight: bold;
            color: #000000;
            letter-spacing: 0.3px;
            z-index: 3;
        }

        /* ── Ribbon Specialization / Course Title ── */
        .f-ribbon {
            position: absolute;
            top: 100.5mm;
            left: 20mm;
            right: 20mm;
            height: 14mm;
            line-height: 14mm;
            text-align: center;
            font-size: 14.5pt;
            font-weight: bold;
            color: #173874;
            letter-spacing: 0.1px;
            z-index: 3;
        }

        /* ── Level Value (Directly below "Level:") ── */
        .f-level {
            position: absolute;
            top: 124.5mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 11.5pt;
            font-weight: bold;
            color: #000000;
            z-index: 3;
        }

        /* ── Grade, Date of issue, Place of issue (Blends seamlessly into #F8F8F8) ── */
        .f-meta-block {
            position: absolute;
            top: 138.2mm;
            left: 103.5mm;
            width: 90mm;
            height: 18.5mm;
            background: #F8F8F8;
            text-align: center;
            font-size: 8.4pt;
            line-height: 1.55;
            color: #111827;
            z-index: 3;
        }

        .f-meta-block strong {
            font-weight: bold;
            color: #000000;
        }

        /* ── QR Codes (Left and Right of TBE bottom logo) ── */
        .f-qr-left {
            position: absolute;
            top: 147.5mm;
            left: 67.0mm;
            width: 26mm;
            height: 26mm;
            z-index: 3;
        }

        .f-qr-right {
            position: absolute;
            top: 147.5mm;
            left: 196.4mm;
            width: 26mm;
            height: 26mm;
            z-index: 3;
        }

        .f-qr-img {
            width: 26mm;
            height: 26mm;
            display: block;
        }
    </style>
</head>
<body>

    @php
        // Dynamic course/level text formatting
        $courseTitle = $course->title ?? '';
        $levelName   = $level->name ?? '';
        $levelCode   = $level->code ?? '';

        $isFoundation = str_contains(strtolower($courseTitle), 'foundation');

        if ($isFoundation) {
            $ribbonText   = 'Certified Blue Economist (CBEc) — Foundation Level';
            $levelDisplay = 'Foundation Level';
        } else {
            // Extract specialization name
            $specName = preg_replace('/^Certified Blue Economist\s*(in)?\s*/i', '', $courseTitle);
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
        $sRight = $L['serial_no']['right'] ?? 14.0;
        $sWidth = $L['serial_no']['width'] ?? 105;
        $sFs    = $L['serial_no']['font_size'] ?? 8.8;

        $nTop = $L['recipient_name']['top'] ?? 67.0;
        $nFs  = $L['recipient_name']['font_size'] ?? 27;

        $rTop = $L['ribbon_text']['top'] ?? 100.5;
        $rFs  = $L['ribbon_text']['font_size'] ?? 14.5;
        $rH   = $L['ribbon_text']['height'] ?? 14.0;

        $lTop = $L['level_value']['top'] ?? 124.5;
        $lFs  = $L['level_value']['font_size'] ?? 11.5;

        $mTop = $L['meta_block']['top'] ?? 138.2;
        $mFs  = $L['meta_block']['font_size'] ?? 8.4;

        $qlTop  = $L['qr_left']['top'] ?? 147.5;
        $qlLeft = $L['qr_left']['left'] ?? 67.0;
        $qSize  = $L['qr_left']['size'] ?? 26;

        $qrTop  = $L['qr_right']['top'] ?? 147.5;
        $qrLeft = $L['qr_right']['left'] ?? 196.4;
    @endphp

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
            <div><strong>Grade:</strong> {{ $certificate->grade ?? 'Excellent' }}</div>
            <div><strong>Date of issue:</strong> {{ \Carbon\Carbon::parse($certificate->date_of_issue)->format('F j, Y') }}</div>
            <div><strong>Place of issue:</strong> {{ $certificate->place_of_issue ?? 'Jakarta' }}</div>
        </div>

        {{-- Left QR Code --}}
        @if($qrImageBase64 ?? false)
            <div class="f-qr-left" style="top: {{ $qlTop }}mm; left: {{ $qlLeft }}mm; width: {{ $qSize }}mm; height: {{ $qSize }}mm;">
                <img class="f-qr-img" style="width: {{ $qSize }}mm; height: {{ $qSize }}mm;" src="data:image/svg+xml;base64,{{ $qrImageBase64 }}" alt="QR Code Left">
            </div>
        @endif

        {{-- Right QR Code --}}
        @if($qrImageBase64 ?? false)
            <div class="f-qr-right" style="top: {{ $qrTop }}mm; left: {{ $qrLeft }}mm; width: {{ $qSize }}mm; height: {{ $qSize }}mm;">
                <img class="f-qr-img" style="width: {{ $qSize }}mm; height: {{ $qSize }}mm;" src="data:image/svg+xml;base64,{{ $qrImageBase64 }}" alt="QR Code Right">
            </div>
        @endif

    </div>

</body>
</html>
