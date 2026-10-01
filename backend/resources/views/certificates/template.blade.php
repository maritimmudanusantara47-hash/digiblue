<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - {{ $user->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page { margin: 0; size: A4 landscape; }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            background: #ffffff;
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
        }

        /* Corner decorations — Navy Blue & Orange/Gold */
        .corner-tl, .corner-tr, .corner-bl, .corner-br {
            position: absolute;
            width: 80px;
            height: 80px;
        }
        .corner-tl { top: 0; left: 0; border-top: 20px solid #1E3A5F; border-left: 20px solid #1E3A5F; }
        .corner-tr { top: 0; right: 0; border-top: 20px solid #F4A820; border-right: 20px solid #F4A820; }
        .corner-bl { bottom: 0; left: 0; border-bottom: 20px solid #F4A820; border-left: 20px solid #F4A820; }
        .corner-br { bottom: 0; right: 0; border-bottom: 20px solid #1E3A5F; border-right: 20px solid #1E3A5F; }

        /* Serial number top right */
        .serial-top {
            position: absolute;
            top: 18px;
            right: 100px;
            font-size: 9px;
            color: #555;
        }

        /* Main content wrapper */
        .content {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 30px 80px;
        }

        /* Logo area */
        .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
        }
        .org-name {
            font-size: 11px;
            font-weight: bold;
            color: #1E3A5F;
            line-height: 1.4;
            text-align: left;
        }

        /* Title */
        h1.cert-title {
            font-size: 34px;
            font-family: 'DejaVu Serif', Georgia, serif;
            color: #1E3A5F;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .subtitle { font-size: 12px; color: #444; margin-bottom: 6px; }

        /* Recipient name */
        .recipient-name {
            font-size: 26px;
            font-weight: bold;
            color: #1E3A5F;
            border-bottom: 2px solid #1E3A5F;
            padding-bottom: 4px;
            margin: 8px 0 10px;
            min-width: 300px;
        }

        .recognized-text { font-size: 11px; color: #555; margin-bottom: 8px; }

        /* Badge */
        .badge {
            background: #F4A820;
            color: #1E3A5F;
            font-size: 15px;
            font-weight: bold;
            padding: 8px 30px;
            border-radius: 4px;
            margin-bottom: 8px;
            display: inline-block;
        }

        .level-text { font-size: 11px; color: #333; margin-bottom: 4px; }
        .level-value { font-size: 14px; font-weight: bold; color: #1E3A5F; margin-bottom: 8px; }
        .rights-text { font-size: 9px; color: #777; margin-bottom: 12px; }

        /* Grade & Date */
        .meta-row { font-size: 11px; color: #333; margin-bottom: 3px; }
        .meta-row strong { color: #1E3A5F; }

        /* Bottom section: QR + Logo + QR */
        .bottom-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-top: 14px;
        }

        .qr-box { width: 70px; height: 70px; }
        .qr-box img { width: 70px; height: 70px; }

        .signatories {
            display: flex;
            gap: 60px;
            justify-content: center;
            flex: 1;
        }

        .signatory { text-align: center; font-size: 9px; color: #333; }
        .signatory .sig-name { font-weight: bold; font-size: 10px; color: #1E3A5F; margin-top: 4px; }
        .signatory .sig-title { color: #777; line-height: 1.3; }
    </style>
</head>
<body>
    <!-- Corner decorations -->
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="corner-bl"></div>
    <div class="corner-br"></div>

    <!-- Serial number -->
    <div class="serial-top">Certificate Serial No. {{ $certificate->serial_number }}</div>

    <div class="content">
        <!-- Logo & Org -->
        <div class="logo-area">
            <div class="org-name">
                The Blue<br>Economist<br>
                <span style="font-weight:normal;font-size:9px">International Association</span>
            </div>
        </div>

        <!-- Title -->
        <h1 class="cert-title">Certificate of Competence</h1>
        <p class="subtitle">This is to certify:</p>

        <!-- Recipient -->
        <div class="recipient-name">{{ $user->name }}</div>

        <p class="recognized-text">has successfully completed the requirements to be recognized as a:</p>

        <!-- Badge -->
        <div class="badge">Certified Blue Economist (CBEc)</div>

        <!-- Level -->
        <p class="level-text">Level:</p>
        <p class="level-value">{{ $level->name }}</p>

        <p class="rights-text">with all the rights, honours and privileges thereto appertaining.</p>

        <!-- Grade & Date -->
        <p class="meta-row"><strong>Grade:</strong> {{ $certificate->grade }}</p>
        <p class="meta-row"><strong>Date of issue:</strong> {{ \Carbon\Carbon::parse($certificate->date_of_issue)->format('F j, Y') }}</p>
        <p class="meta-row"><strong>Place of issue:</strong> {{ $certificate->place_of_issue }}</p>

        <!-- Bottom row: QR | Signatories | QR -->
        <div class="bottom-row">
            <!-- QR Code kiri -->
            <div class="qr-box">
                @if($qrImageBase64 ?? false)
                    <img src="data:image/svg+xml;base64,{{ $qrImageBase64 }}" alt="QR Code" width="70" height="70">
                @endif
            </div>

            <!-- Signatories -->
            <div class="signatories">
                <div class="signatory">
                    <div class="sig-name">Prof. Dr. Nurul Taufiqu Rochman, MEng, PhD, CBEc</div>
                    <div class="sig-title">
                        President<br>
                        The Blue Economist International Association
                    </div>
                </div>
                <div class="signatory">
                    <div class="sig-name">Leena Ndahafa Kadhila, MSc, MBA, CBEc</div>
                    <div class="sig-title">
                        Director of Blue Economy Education and Social Affairs<br>
                        The Blue Economist International Association
                    </div>
                </div>
            </div>

            <!-- QR Code kanan (sama) -->
            <div class="qr-box">
                @if($qrImageBase64 ?? false)
                    <img src="data:image/svg+xml;base64,{{ $qrImageBase64 }}" alt="QR Code" width="70" height="70">
                @endif
            </div>
        </div>
    </div>
</body>
</html>
