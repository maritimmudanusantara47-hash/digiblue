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
            left: 14mm;
            right: 14mm;
            text-align: center;
            font-weight: bold;
            color: #133e7c;
            letter-spacing: 0.2px;
            white-space: nowrap;
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
        .fs-back-title {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: bold;
            color: #000000;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .fs-back-text {
            position: absolute;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: normal;
            color: #111827;
        }

        .fs-table {
            position: absolute;
            left: 19.0mm;
            width: 259.0mm;
            table-layout: fixed;
            border-collapse: collapse;
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            border: 0.35mm solid #000000;
        }

        .fs-table th {
            background-color: #1B75BC;
            color: #FFFFFF;
            font-weight: normal;
            text-align: center;
            vertical-align: middle;
            border: 0.35mm solid #000000;
            padding: 0 1.5mm;
            height: 9.5mm;
            font-size: 9.5pt;
        }

        .fs-table td {
            border: 0.35mm solid #000000;
            vertical-align: middle;
            padding: 1.5mm 2.5mm;
            background-color: transparent;
            font-weight: normal;
        }

        .fs-table .col-no {
            text-align: center;
            vertical-align: middle;
            width: 3.5%;
            font-size: 9.5pt;
            font-weight: normal;
            padding: 0;
        }

        .fs-table .col-mod {
            width: 21.8%;
            font-weight: normal;
            vertical-align: middle;
            line-height: 1.32;
            font-size: 9.5pt;
            padding: 1.5mm 2.5mm;
        }

        .fs-table .col-topic {
            width: 63.8%;
            vertical-align: middle;
            font-size: 9.2pt;
            font-weight: normal;
            padding: 1.5mm 2.5mm;
        }

        .fs-table .col-hours {
            width: 10.9%;
            text-align: center;
            vertical-align: middle;
            font-weight: normal;
            font-size: 10.0pt;
            padding: 0;
        }

        .fs-table ul.topic-list {
            margin: 0;
            padding-left: 3.5mm;
            list-style-type: disc;
            line-height: 1.38;
        }

        .fs-table ul.topic-list li {
            margin-bottom: 0.45mm;
        }
        .fs-table ul.topic-list li:last-child {
            margin-bottom: 0;
        }

        .fs-table .row-summary td {
            font-weight: bold;
            font-size: 9.5pt;
            height: 12.5mm;
            text-align: center;
            vertical-align: middle;
            padding: 0 3mm;
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

        $btTop = $L['ct_back_title']['top'] ?? $L['fs_back_title']['top'] ?? 14.5;
        $btFs = $L['ct_back_title']['font_size'] ?? $L['fs_back_title']['font_size'] ?? 16.0;

        $bnTop = $L['ct_back_name']['top'] ?? $L['fs_back_name']['top'] ?? 25.5;
        $bnLeft = $L['ct_back_name']['left'] ?? $L['fs_back_name']['left'] ?? 19.0;
        $bnFs = $L['ct_back_name']['font_size'] ?? $L['fs_back_name']['font_size'] ?? 11.0;
        $bnPrefix = $L['ct_back_name']['prefix'] ?? $L['fs_back_name']['prefix'] ?? 'Name : ';

        $brTop = $L['ct_back_reg_no']['top'] ?? $L['fs_back_reg_no']['top'] ?? 30.8;
        $brLeft = $L['ct_back_reg_no']['left'] ?? $L['fs_back_reg_no']['left'] ?? 19.0;
        $brFs = $L['ct_back_reg_no']['font_size'] ?? $L['fs_back_reg_no']['font_size'] ?? 11.0;
        $brPrefix = $L['ct_back_reg_no']['prefix'] ?? $L['fs_back_reg_no']['prefix'] ?? 'Registration Number : ';

        $tblTop = $L['ct_back_table']['top'] ?? $L['fs_back_table']['top'] ?? 37.5;
        $tblFs = $L['ct_back_table']['font_size'] ?? $L['fs_back_table']['font_size'] ?? 8.0;

        $issueCarbon = \Carbon\Carbon::parse($certificate->date_of_issue);
        $issueDateFormatted = $issueCarbon->format('j F Y');
        $place = $certificate->place_of_issue ?? 'Jakarta';
        // Hapus trailing 'Indonesia' jika format 'Jakarta, Indonesia' agar pas 'Jakarta, 11 June 2026'
        $placeShort = trim(explode(',', $place)[0]);

        $partDate = $participationDate ?? ('20 May – ' . $issueCarbon->format('j F Y'));

        $rawCourseSlug = $courseSlug ?? ($course->slug ?? '');
        $rawCourseTitle = $course->title ?? '';
        $levelName = $course->certificationLevel->name ?? '';
        $levelCode = $course->certificationLevel->code ?? '';

        $isFoundation = str_contains(strtolower($rawCourseTitle), 'foundation')
            || str_contains(strtolower($levelName), 'foundation')
            || strtolower($levelCode) === 'fnd'
            || strtolower($levelCode) === 'foundation'
            || $rawCourseSlug === 'foundation';

        if ($isFoundation) {
            $displayCourseTitle = 'International Blue Economist Certification Training Course';
        } else {
            $specName = preg_replace('/^International Blue Economist Certification Training Course\s*[-–:]*\s*/i', '', $rawCourseTitle);
            $specName = preg_replace('/^Certified Blue Economist in\s*/i', '', $specName);
            $specName = preg_replace('/\s*\(CBEc\)/i', '', $specName);
            $specName = trim($specName);

            if (empty($specName) || $specName === 'Foundation Level') {
                $specName = ucwords(str_replace(['blue-', '-'], ['Blue ', ' '], $rawCourseSlug));
            }

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
            <div class="fs-name" style="top: {{ $nTop }}mm; left: {{ $nLeft }}mm; width: 297mm; font-size: {{ $nFs }}pt;">
                {{ $user->name }}
            </div>

            {{-- Training Course Title --}}
            @php
                $tLen = strlen($displayCourseTitle);
                $calculatedTitleFs = ($tLen > 90) ? 14.5 : (($tLen > 75) ? 15.5 : $tFs);
            @endphp
            <div class="fs-title" style="top: {{ $tTop }}mm; left: {{ 15 + $tLeft }}mm; right: {{ 15 - $tLeft }}mm; font-size: {{ $calculatedTitleFs }}pt;">
                {{ $displayCourseTitle }}
            </div>

            {{-- Date of Participation (with clean background matching template to blend seamlessly) --}}
            <div class="fs-part-date" style="top: {{ $pTop }}mm; left: {{ $pLeft }}mm; width: 297mm; font-size: {{ $pFs }}pt;">
                <span style="background: #F8F8F8; padding: 0 4mm;">{{ $partDate }}</span>
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
                @php
                    $currTitle = $curriculum['title'] ?? 'CURRICULUM STRUCTURE';
                    $currModules = $curriculum['modules'] ?? [];
                    $currTotalHours = $curriculum['total_hours'] ?? '30';
                    $currTotalCredits = $curriculum['total_credits'] ?? '1.5 ECTS';
                @endphp

                {{-- Title CURRICULUM STRUCTURE --}}
                <div class="fs-back-title" style="top: {{ $btTop }}mm; font-size: {{ $btFs }}pt;">
                    {{ $currTitle }}
                </div>

                {{-- Name --}}
                <div class="fs-back-text" style="top: {{ $bnTop }}mm; left: {{ $bnLeft }}mm; font-size: {{ $bnFs }}pt;">
                    {{ $bnPrefix }}{{ $user->name }}
                </div>

                {{-- Registration Number --}}
                <div class="fs-back-text" style="top: {{ $brTop }}mm; left: {{ $brLeft }}mm; font-size: {{ $brFs }}pt;">
                    {{ $brPrefix }}{{ $regNo }}
                </div>

                {{-- Dynamic Curriculum Table (Locked position: top: 38.0mm, exact Canva parity) --}}
                <table class="fs-table" style="top: {{ $tblTop }}mm;">
                    <colgroup>
                        <col style="width: 3.5%;">
                        <col style="width: 21.8%;">
                        <col style="width: 63.8%;">
                        <col style="width: 10.9%;">
                    </colgroup>
                    <thead>
                        <tr style="height: 9.0mm;">
                            <th class="col-no">No.</th>
                            <th class="col-mod">Module</th>
                            <th class="col-topic">Topic</th>
                            <th class="col-hours">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        @php
                            $modCount = count($currModules);
                        @endphp
                        @forelse($currModules as $idx => $mod)
                            @php
                                $isCompactRow = ($modCount === 4 && $idx === 3);
                                $rowHeight = ($modCount === 4) ? ($isCompactRow ? '21.0mm' : '25.5mm') : '31.0mm';
                            @endphp
                            <tr style="height: {{ $rowHeight }};">
                                <td class="col-no" style="height: {{ $rowHeight }};">{{ $mod['no'] ?? ($idx + 1) }}</td>
                                <td class="col-mod" style="height: {{ $rowHeight }};">{{ $mod['title'] ?? '' }}</td>
                                <td class="col-topic" style="height: {{ $rowHeight }};">
                                    <ul class="topic-list">
                                        @foreach($mod['topics'] ?? [] as $topic)
                                            <li>{{ $topic }}</li>
                                        @endforeach
                                    </ul>
                                </td>
                                <td class="col-hours" style="height: {{ $rowHeight }};">{{ $mod['hours'] ?? '' }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 4mm;">Belum ada modul kurikulum yang diatur.</td>
                            </tr>
                        @endforelse
                        @php
                            $summaryH = ($modCount === 4) ? '12.5mm' : '13.5mm';
                        @endphp
                        <tr class="row-summary" style="height: {{ $summaryH }};">
                            <td colspan="3" style="text-align: center; height: {{ $summaryH }};">Total Hours</td>
                            <td class="col-hours" style="height: {{ $summaryH }};">{{ $currTotalHours }}</td>
                        </tr>
                        <tr class="row-summary" style="height: {{ $summaryH }};">
                            <td colspan="3" style="text-align: center; height: {{ $summaryH }};">Total Credits</td>
                            <td class="col-hours" style="height: {{ $summaryH }};">{{ $currTotalCredits }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    @endif
</body>

</html>