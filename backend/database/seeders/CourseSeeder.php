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

        // 10 Specialization Tracks
        $specializations = [
            ['title' => 'The Blue Carbon',             'slug' => 'the-blue-carbon'],
            ['title' => 'Blue Business Development',   'slug' => 'blue-business-development'],
            ['title' => 'Blue Data Intelligence',      'slug' => 'blue-data-intelligence'],
            ['title' => 'Circular Economy',            'slug' => 'circular-economy'],
            ['title' => 'Blue Community Development',  'slug' => 'blue-community-development'],
            ['title' => 'Blue Farming',                'slug' => 'blue-farming'],
            ['title' => 'Blue Tourism',                'slug' => 'blue-tourism'],
            ['title' => 'Blue Shipping',               'slug' => 'blue-shipping'],
            ['title' => 'Blue Finance',                'slug' => 'blue-finance'],
            ['title' => 'Blue Food & Energy Circular', 'slug' => 'blue-food-energy-circular'],
        ];

        foreach ($specializations as $index => $spec_course) {
            Course::firstOrCreate(
                ['slug' => $spec_course['slug']],
                [
                    'certification_level_id' => $spec->id,
                    'title' => 'CBEc Specialization — ' . $spec_course['title'],
                    'description' => 'Program sertifikasi peminatan ' . $spec_course['title'] . ' dalam ekosistem Blue Economy.',
                    'price' => 0,
                    'is_active' => true,
                    'order_index' => $index + 1,
                ]
            );
        }
    }
}
