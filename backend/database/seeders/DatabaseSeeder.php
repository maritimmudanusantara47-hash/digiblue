<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            CertificationLevelSeeder::class,
            CourseSeeder::class,
            CourseContentSeeder::class,
            AdminUserSeeder::class,
            StudentUserSeeder::class,
        ]);
    }
}
