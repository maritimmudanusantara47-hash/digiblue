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

class AdminBatchTemplateTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Course $course1;
    private Course $course2;

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

        $level = CertificationLevel::create([
            'name'        => 'Basic Level',
            'slug'        => 'basic-level',
            'order_index' => 1,
            'is_active'   => true,
        ]);

        $this->course1 = Course::create([
            'title'                  => 'Kursus Konservasi Laut',
            'slug'                   => 'kursus-konservasi-laut',
            'description'            => 'Deskripsi kursus 1',
            'certification_level_id' => $level->id,
            'price'                  => 100000,
            'is_published'           => true,
        ]);

        $this->course2 = Course::create([
            'title'                  => 'Kursus Budidaya Mangrove',
            'slug'                   => 'kursus-budidaya-mangrove',
            'description'            => 'Deskripsi kursus 2',
            'certification_level_id' => $level->id,
            'price'                  => 100000,
            'is_published'           => true,
        ]);
    }

    public function test_can_fetch_template_by_batch_name(): void
    {
        Sanctum::actingAs($this->admin);

        CourseBatch::create([
            'course_id'               => $this->course1->id,
            'batch_name'              => 'Batch 19',
            'batch_code'              => 'B19',
            'registration_start_date' => '2026-09-01',
            'registration_end_date'   => '2026-09-30',
            'start_date'              => '2026-10-01',
            'end_date'                => '2026-11-30',
            'field_trip_date'         => '2026-11-20',
            'is_active'               => true,
        ]);

        $res = $this->getJson('/api/v1/admin/batches/template?batch_name=Batch 19');
        $res->assertOk()
            ->assertJsonPath('data.batch_name', 'Batch 19')
            ->assertJsonPath('data.batch_code', 'B19')
            ->assertJsonPath('data.start_date', '2026-10-01T00:00:00.000000Z')
            ->assertJsonPath('data.end_date', '2026-11-30T00:00:00.000000Z')
            ->assertJsonPath('data.field_trip_date', '2026-11-20T00:00:00.000000Z');
    }

    public function test_template_case_insensitive_matching(): void
    {
        Sanctum::actingAs($this->admin);

        CourseBatch::create([
            'course_id'               => $this->course1->id,
            'batch_name'              => 'Batch 19',
            'batch_code'              => 'B19',
            'registration_start_date' => '2026-09-01',
            'registration_end_date'   => '2026-09-30',
            'start_date'              => '2026-10-01',
            'end_date'                => '2026-11-30',
            'field_trip_date'         => '2026-11-20',
            'is_active'               => true,
        ]);

        $res = $this->getJson('/api/v1/admin/batches/template?batch_name=batch 19');
        $res->assertOk()
            ->assertJsonPath('data.batch_name', 'Batch 19');
    }

    public function test_template_returns_null_when_not_found(): void
    {
        Sanctum::actingAs($this->admin);

        $res = $this->getJson('/api/v1/admin/batches/template?batch_name=Batch 999');
        $res->assertOk()
            ->assertJsonPath('data', null);
    }
}
