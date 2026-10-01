<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentUserSeeder extends Seeder
{
    public function run(): void
    {
        $students = [
            [
                'name'         => 'Budi Santoso',
                'email'        => 'student@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '081234567890',
                'institution'  => 'Universitas Indonesia',
            ],
            [
                'name'         => 'Siti Rahma',
                'email'        => 'student2@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '082345678901',
                'institution'  => 'Institut Teknologi Bandung',
            ],
            [
                'name'         => 'Ahmad Fauzi',
                'email'        => 'student3@digibluecamp.id',
                'password'     => 'student123!',
                'phone_number' => '083456789012',
                'institution'  => 'Universitas Gadjah Mada',
            ],
        ];

        foreach ($students as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => Hash::make($data['password']),
                    'phone_number'      => $data['phone_number'],
                    'institution'       => $data['institution'],
                    'email_verified_at' => now(),
                ]
            );

            $user->assignRole('student');
        }
    }
}
