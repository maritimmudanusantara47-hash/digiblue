<?php

namespace Tests\Feature;

use App\Models\CertificationLevel;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminBatchBulkTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private CertificationLevel $specLevel;
    private CertificationLevel $fndLevel;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::create([
            'name'              => 'Admin User',
            'email'             => 'admin@example.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $this->admin->assignRole('admin');

        $this->fndLevel = CertificationLevel::create([
            'code'        => 'FND',
            'name'        => 'Foundation Level',
            'order_index' => 1,
            'is_active'   => true,
        ]);

        $this->specLevel = CertificationLevel::create([
            'code'        => 'SPEC',
            'name'        => 'Specialization Level',
            'order_index' => 2,
            'is_active'   => true,
        ]);

        // Foundation course
        Course::create([
            'title'                  => 'Foundation Course',
            'slug'                   => 'foundation-course',
            'description'            => 'Foundation Description',
            'certification_level_id' => $this->fndLevel->id,
            'price'                  => 500000,
            'is_active'              => true,
        ]);

        // 3 Specialization courses
        for ($i = 1; $i <= 3; $i++) {
            Course::create([
                'title'                  => "Specialization Track {$i}",
                'slug'                   => "specialization-track-{$i}",
                'description'            => "Specialization Description {$i}",
                'certification_level_id' => $this->specLevel->id,
                'price'                  => 750000,
                'is_active'              => true,
            ]);
        }
    }

    public function test_admin_can_bulk_create_batches_for_all_specializations(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'target_scope'            => 'all_specialization',
            'batch_name'              => 'Batch 19',
            'batch_code'              => 'B19',
            'registration_start_date' => '2026-10-01',
            'registration_end_date'   => '2026-10-20',
            'start_date'              => '2026-10-25',
            'end_date'                => '2026-11-25',
            'field_trip_date'         => '2026-11-20',
            'is_active'               => true,
        ];

        $response = $this->postJson('/api/v1/admin/batches/bulk', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'created_count' => 3,
            ]);

        $this->assertDatabaseCount('course_batches', 3);

        $specCourseIds = Course::where('certification_level_id', $this->specLevel->id)->pluck('id');
        foreach ($specCourseIds as $cid) {
            $this->assertDatabaseHas('course_batches', [
                'course_id'  => $cid,
                'batch_name' => 'Batch 19',
                'batch_code' => 'B19',
            ]);
        }
    }

    public function test_admin_can_bulk_create_batches_for_all_courses(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'target_scope'            => 'all_courses',
            'batch_name'              => 'Batch 20',
            'batch_code'              => 'B20',
            'registration_start_date' => '2026-11-01',
            'registration_end_date'   => '2026-11-20',
            'start_date'              => '2026-12-01',
            'end_date'                => '2026-12-31',
            'is_active'               => true,
        ];

        $response = $this->postJson('/api/v1/admin/batches/bulk', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'created_count' => 4, // 1 foundation + 3 spec
            ]);

        $this->assertDatabaseCount('course_batches', 4);
    }

    public function test_validation_fails_if_end_date_before_start_date(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'target_scope'            => 'all_specialization',
            'batch_name'              => 'Invalid Batch Dates',
            'registration_start_date' => '2026-10-20',
            'registration_end_date'   => '2026-10-10', // Invalid: before start
        ];

        $response = $this->postJson('/api/v1/admin/batches/bulk', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['registration_end_date']);
    }

    public function test_unauthorized_for_guests(): void
    {
        $payload = [
            'target_scope' => 'all_specialization',
            'batch_name'   => 'Batch Guest',
        ];

        $response = $this->postJson('/api/v1/admin/batches/bulk', $payload);

        $response->assertStatus(401);
    }
}
