<?php

namespace App\Exports;

use App\Models\Certificate;
use App\Models\Course;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class CertificatesExport implements WithMultipleSheets, Export
{
    public function __construct(private array $filters = []) {}

    public function sheets(): array
    {
        $coursesQuery = Course::with('certificationLevel');

        if (!empty($this->filters['level'])) {
            $coursesQuery->whereHas('certificationLevel', fn($l) => $l->where('code', $this->filters['level']));
        }

        // Urutkan sheet sesuai standar database sertifikat (Foundation pertama, diikuti spesialisasi)
        $courses = $coursesQuery->get()->sortBy(function ($course) {
            $title = strtolower($course->title);
            if (str_contains($title, 'foundation')) return 1;
            if (str_contains($title, 'carbon')) return 2;
            if (str_contains($title, 'business') || str_contains($title, 'bizdev')) return 3;
            if (str_contains($title, 'data')) return 4;
            if (str_contains($title, 'circular')) return 5;
            if (str_contains($title, 'community')) return 6;
            if (str_contains($title, 'farming')) return 7;
            if (str_contains($title, 'tourism')) return 8;
            if (str_contains($title, 'shipping')) return 9;
            if (str_contains($title, 'finance')) return 10;
            if (str_contains($title, 'energy')) return 11;
            if (str_contains($title, 'food')) return 12;
            if (str_contains($title, 'port')) return 13;
            return 99;
        });

        $sheets = [];

        foreach ($courses as $course) {
            $sheetTitle = self::getSheetTitle($course->title);
            $sheets[] = new CourseCertificatesExportSheet($course->id, $sheetTitle, $this->filters);
        }

        // Sertifikat tanpa kursus tertentu (jika ada)
        $orphanCertsCount = Certificate::whereDoesntHave('enrollment.course')->count();
        if ($orphanCertsCount > 0) {
            $sheets[] = new CourseCertificatesExportSheet(null, 'Lainnya', $this->filters);
        }

        if (empty($sheets)) {
            $sheets[] = new CourseCertificatesExportSheet(null, 'CBeC Foundation', $this->filters);
        }

        return $sheets;
    }

    public static function getSheetTitle(string $title): string
    {
        $lower = strtolower($title);
        if (str_contains($lower, 'foundation')) return 'CBeC Foundation';
        if (str_contains($lower, 'carbon')) return 'CBeC Blue Carbon';
        if (str_contains($lower, 'business') || str_contains($lower, 'bizdev')) return 'CBeC Bizdev';
        if (str_contains($lower, 'data')) return 'CBeC Blue Data Intelligence';
        if (str_contains($lower, 'circular')) return 'CBeC Circular eco';
        if (str_contains($lower, 'community')) return 'CBeC CommDev';
        if (str_contains($lower, 'farming')) return 'CBeC Farming';
        if (str_contains($lower, 'tourism')) return 'CBeC Tourism';
        if (str_contains($lower, 'shipping')) return 'CBeC Shipping';
        if (str_contains($lower, 'finance')) return 'CBeC Finance';
        if (str_contains($lower, 'energy')) return 'CBeC Energy';
        if (str_contains($lower, 'food')) return 'CBeC Food';
        if (str_contains($lower, 'port')) return 'CBeC Port';

        return substr('CBeC ' . preg_replace('/[^a-zA-Z0-9 ]/', '', $title), 0, 31);
    }
}
