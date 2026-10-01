<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'assessor', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student',  'guard_name' => 'web']);
    }
}
