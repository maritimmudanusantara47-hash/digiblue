<?php

namespace Tests\Feature;

use App\Models\CertificationLevel;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CourseContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_courses_catalog(): void
    {
        $level = CertificationLevel::create([
            'name'        => 'Foundation Level',
            'code'        => 'FND',
            'order_index' => 1,
            'is_active'   => true,
        ]);

        $course = Course::create([
            'certification_level_id' => $level->id,
            'title'                  => 'Pengantar Ekonomi Biru',
            'slug'                   => 'pengantar-ekonomi-biru',
            'description'            => 'Kursus dasar ekonomi kelautan berkelanjutan',
            'price_idr'              => 500000,
            'is_active'              => true,
            'order_index'            => 1,
        ]);

        $response = $this->getJson('/api/v1/courses');

        $response->assertStatus(200)
                 ->assertJsonFragment(['slug' => 'pengantar-ekonomi-biru']);
    }

    public function test_course_detail_hides_sensitive_module_body_and_internal_files_from_guest(): void
    {
        $level = CertificationLevel::create([
            'name'        => 'Foundation Level',
            'code'        => 'FND',
            'order_index' => 1,
            'is_active'   => true,
        ]);

        $course = Course::create([
            'certification_level_id' => $level->id,
            'title'                  => 'Manajemen Pesisir Terpadu',
            'slug'                   => 'manajemen-pesisir-terpadu',
            'description'            => 'Silabus pembelajaran mendalam',
            'price_idr'              => 750000,
            'is_active'              => true,
            'order_index'            => 1,
        ]);

        $section = CourseSection::create([
            'course_id'   => $course->id,
            'title'       => 'Modul 1: Prinsip Tata Kelola Pesisir',
            'order_index' => 1,
        ]);

        CourseContent::create([
            'section_id'       => $section->id,
            'content_type'     => 'pdf_module',
            'title'            => 'Bahan Bacaan Inti Modul 1',
            'file_path'        => 'secure_docs/rahasia_kurikulum.pdf',
            'embed_url'        => 'https://private-cdn.com/embed/12345',
            'content_body'     => 'Ini adalah teks isi materi eksklusif berbayar yang tidak boleh bocor ke publik.',
            'instruction_text' => 'Pelajari materi ini dengan teliti sebelum kuis.',
            'order_index'      => 1,
        ]);

        $response = $this->getJson('/api/v1/courses/manajemen-pesisir-terpadu');

        $response->assertStatus(200);

        // Pastikan judul modul tampil
        $response->assertSee('Bahan Bacaan Inti Modul 1');

        // Pastikan isi materi premium (content_body), instruksi, dan path internal TIDAK bocor ke publik
        $response->assertDontSee('Ini adalah teks isi materi eksklusif berbayar yang tidak boleh bocor ke publik.');
        $response->assertDontSee('secure_docs/rahasia_kurikulum.pdf');
        $response->assertDontSee('https://private-cdn.com/embed/12345');
        $response->assertDontSee('Pelajari materi ini dengan teliti sebelum kuis.');
    }
}
