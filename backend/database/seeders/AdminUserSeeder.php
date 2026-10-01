<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@digibluecamp.id'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123secure!'),
                'institution' => 'The Blue Economist International Association',
                'phone_number' => '',
                'email_verified_at' => now(),
            ]
        );

        $admin->assignRole('admin');

        // Default Assessor Account
        $assessor = User::firstOrCreate(
            ['email' => 'assessor@digibluecamp.id'],
            [
                'name' => 'Default Assessor',
                'password' => Hash::make('assessor123secure!'),
                'institution' => 'DigiBlueCamp',
                'phone_number' => '',
                'email_verified_at' => now(),
            ]
        );

        $assessor->assignRole('assessor');
    }
}
