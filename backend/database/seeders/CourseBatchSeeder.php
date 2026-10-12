<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Enrollment;
use Illuminate\Database\Seeder;

class CourseBatchSeeder extends Seeder
{
    public function run(): void
    {
        $courses = Course::all();

        foreach ($courses as $c) {
            // Batch 18 (batch aktif saat ini)
            $b18 = CourseBatch::firstOrCreate(
                ['course_id' => $c->id, 'batch_name' => 'Batch 18'],
                [
                    'batch_code'      => 'B18',
                    'start_date'      => '2026-10-01',
                    'end_date'        => '2026-11-30',
                    'field_trip_date' => '2026-11-20',
                    'is_active'       => true,
                ]
            );

            // Assign the first enrollment of this course to Batch 18, leaving others as Self-Paced (null)
            $firstEnrollment = Enrollment::where('course_id', $c->id)->first();
            if ($firstEnrollment && !$firstEnrollment->batch_id) {
                $firstEnrollment->update(['batch_id' => $b18->id]);
            }
        }
    }
}
