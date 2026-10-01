<?php

namespace App\Exports;

use App\Models\Certificate;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CertificatesExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    public function __construct(private array $filters = []) {}

    public function collection()
    {
        return Certificate::with(['user', 'enrollment.course.certificationLevel'])
            ->when($this->filters['level'] ?? null, fn($q) => $q->whereHas(
                'enrollment.course.certificationLevel', fn($l) => $l->where('code', $this->filters['level'])
            ))
            ->orderByDesc('date_of_issue')
            ->get();
    }

    /** Kolom header identik dengan format spreadsheet lama */
    public function headings(): array
    {
        return [
            'No.',
            'Nama',
            'Certificate Serial No. (Sertifikat)',
            'Certificate Serial No. (URL)',
            'Grade',
            'Date of Issue',
            'Place of Issue',
            'Level',
            'Specialization Track',
            'Verification URL',
            'Sync Status',
        ];
    }

    public function map($cert): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $cert->user->name,
            $cert->serial_number,
            $cert->serial_url_key,
            $cert->grade,
            $cert->date_of_issue,
            $cert->place_of_issue,
            $cert->enrollment->course->certificationLevel->name,
            $cert->enrollment->course->title,
            "https://theblueeconomist.org/certification/{$cert->serial_url_key}",
            $cert->sync_status,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [ // Header row style
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A5F']],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }
}
