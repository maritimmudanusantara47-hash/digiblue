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
            $b1 = CourseBatch::firstOrCreate(
                ['course_id' => $c->id, 'batch_name' => 'Batch 1'],
                [
                    'batch_code'      => 'B1',
                    'start_date'      => '2026-10-01',
                    'end_date'        => '2026-11-30',
                    'field_trip_date' => '2026-11-20',
                    'is_active'       => true,
                ]
            );

            $b2 = CourseBatch::firstOrCreate(
                ['course_id' => $c->id, 'batch_name' => 'Batch 2'],
                [
                    'batch_code'      => 'B2',
                    'start_date'      => '2026-12-01',
                    'end_date'        => '2027-01-31',
                    'field_trip_date' => '2027-01-20',
                    'is_active'       => true,
                ]
            );

            // Assign the first enrollment of this course to Batch 1, leaving others as Self-Paced (null)
            $firstEnrollment = Enrollment::where('course_id', $c->id)->first();
            if ($firstEnrollment && !$firstEnrollment->batch_id) {
                $firstEnrollment->update(['batch_id' => $b1->id]);
            }
        }
    }
}
