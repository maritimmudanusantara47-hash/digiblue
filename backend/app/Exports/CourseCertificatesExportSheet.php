<?php

namespace App\Exports;

use App\Models\Certificate;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class CourseCertificatesExportSheet implements 
    FromCollection, 
    WithHeadings, 
    WithMapping, 
    WithStyles, 
    WithTitle, 
    ShouldAutoSize
{
    private int $rowNumber = 0;

    public function __construct(
        private ?int $courseId,
        private string $sheetTitle,
        private array $filters = []
    ) {}

    public function collection(): \Illuminate\Support\Enumerable
    {
        $query = Certificate::with(['user', 'enrollment.course.certificationLevel']);

        if ($this->courseId !== null) {
            $query->whereHas('enrollment', fn($e) => $e->where('course_id', $this->courseId));
        } else {
            $query->whereDoesntHave('enrollment.course');
        }

        return $query->orderBy('serial_number')->get();
    }

    /** Kolom header identik dengan format master database sertifikat */
    public function headings(): array
    {
        return [
            'No.',
            'Nama Peserta',
            'Certificate Serial No.(sertifikat)',
            'Certificate Serial No. (URL)',
            'Grade',
            'Date of Issue',
            'Place of Issue',
            'Link URL',
            'Level',
            'Sync TBE',
        ];
    }

    public function map($cert): array
    {
        $this->rowNumber++;

        $dateOfIssue = $cert->date_of_issue 
            ? Carbon::parse($cert->date_of_issue)->locale('id')->isoFormat('MMMM D, YYYY')
            : '-';

        $url = "https://theblueeconomist.org/certification/{$cert->serial_url_key}";
        $levelName = $cert->enrollment?->course?->certificationLevel?->name ?? 'Foundation Level';
        $syncStatus = $cert->sync_status === 'synced' ? '✓' : ($cert->sync_status ?? '-');

        return [
            $this->rowNumber,
            $cert->user?->name ?? '-',
            $cert->serial_number,
            $cert->serial_url_key,
            $cert->grade,
            $dateOfIssue,
            $cert->place_of_issue ?? 'Jakarta',
            $url,
            $levelName,
            $syncStatus,
        ];
    }

    public function title(): string
    {
        return $this->sheetTitle;
    }

    public function styles(Worksheet $sheet): array
    {
        $highestRow = max($sheet->getHighestRow(), 1);

        $sheet->getRowDimension(1)->setRowHeight(28);
        $sheet->setShowGridLines(true);

        // Header style: Oranye seperti Google Sheets dengan teks bold
        $sheet->getStyle('A1:J1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => '000000'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => 'solid',
                'startColor' => ['rgb' => 'E69138'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Border & alignment vertikal untuk semua baris
        if ($highestRow >= 1) {
            $sheet->getStyle("A1:J{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['rgb' => 'D0D0D0'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);
        }

        // Perataan teks kolom data
        if ($highestRow > 1) {
            $sheet->getStyle("A2:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B2:B{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle("C2:C{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D2:D{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E2:E{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F2:F{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G2:G{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H2:H{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle("I2:I{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("J2:J{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Kolom Link URL warna biru dan garis bawah
            $sheet->getStyle("H2:H{$highestRow}")->getFont()->getColor()->setRGB('1155CC');
            $sheet->getStyle("H2:H{$highestRow}")->getFont()->setUnderline(true);
        }

        return [];
    }
}
