<?php

namespace Database\Seeders;

use App\Models\CertificationLevel;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $foundation = CertificationLevel::where('code', 'FND')->first();
        $spec       = CertificationLevel::where('code', 'SPEC')->first();

        // Foundation
        Course::firstOrCreate(
            ['slug' => 'certified-blue-economist-foundation'],
            [
                'certification_level_id' => $foundation->id,
                'title' => 'Certified Blue Economist (CBEc) — Foundation Level',
                'description' => 'Program sertifikasi dasar komprehensif yang membekali peserta dengan pemahaman mendalam tentang ekonomi biru.',
                'price' => 0,
                'is_active' => true,
                'order_index' => 1,
            ]
        );

        // 12 Specialization Tracks (Sesuai Academic Handbook MaritimX Academy Entry 2026)
        $specializations = [
            [
                'title'       => 'Blue Business Development',
                'slug'        => 'blue-business-development',
                'acronym'     => 'CBEc. (BizDev.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Carbon',
                'slug'        => 'blue-carbon',
                'acronym'     => 'CBEc. (Carb.)',
                'legacy_slugs'=> ['the-blue-carbon', 'cbec-specialization-blue-carbon-2'],
            ],
            [
                'title'       => 'Blue Community Development',
                'slug'        => 'blue-community-development',
                'acronym'     => 'CBEc. (CommDev.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Circular Economy',
                'slug'        => 'blue-circular-economy',
                'acronym'     => 'CBEc. (CirEc.)',
                'legacy_slugs'=> ['circular-economy', 'cbec-specialization-blue-circular-economy-5'],
            ],
            [
                'title'       => 'Blue Data Intelligence',
                'slug'        => 'blue-data-intelligence',
                'acronym'     => 'CBEc. (DataIntel.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Energy',
                'slug'        => 'blue-energy',
                'acronym'     => 'CBEc. (Ener.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Farming',
                'slug'        => 'blue-farming',
                'acronym'     => 'CBEc. (Farm.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Finance',
                'slug'        => 'blue-finance',
                'acronym'     => 'CBEc. (Fin.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Food',
                'slug'        => 'blue-food',
                'acronym'     => 'CBEc. (Food.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Port',
                'slug'        => 'blue-port',
                'acronym'     => 'CBEc. (Port.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Shipping',
                'slug'        => 'blue-shipping',
                'acronym'     => 'CBEc. (Ship.)',
                'legacy_slugs'=> [],
            ],
            [
                'title'       => 'Blue Tourism',
                'slug'        => 'blue-tourism',
                'acronym'     => 'CBEc. (Tour.)',
                'legacy_slugs'=> [],
            ],
        ];

        foreach ($specializations as $index => $spec_course) {
            // Normalisasi data jika ada kursus dengan slug lama
            $existing = null;
            if (!empty($spec_course['legacy_slugs'])) {
                $existing = Course::whereIn('slug', $spec_course['legacy_slugs'])->first();
            }

            if (!$existing) {
                $existing = Course::where('slug', $spec_course['slug'])->first();
            }

            $data = [
                'certification_level_id' => $spec->id,
                'slug'                   => $spec_course['slug'],
                'title'                  => 'CBEc Specialization — ' . $spec_course['title'],
                'description'            => "Program sertifikasi peminatan {$spec_course['title']} : {$spec_course['acronym']} dalam ekosistem Blue Economy.",
                'price'                  => 0,
                'is_active'              => true,
                'order_index'            => $index + 1,
            ];

            if ($existing) {
                $existing->update($data);
            } else {
                Course::create($data);
            }
        }

        // Hapus track lama gabungan jika sudah tidak digunakan dan tanpa enrollment
        $legacyCombined = Course::where('slug', 'blue-food-energy-circular')->first();
        if ($legacyCombined && $legacyCombined->enrollments()->count() === 0) {
            $legacyCombined->sections()->delete();
            $legacyCombined->delete();
        }
    }
}
