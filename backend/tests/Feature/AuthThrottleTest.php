<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthThrottleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'student', 'guard_name' => 'web']);
    }

    public function test_user_can_register_successfully(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Budi Santoso',
            'email'                 => 'budi@example.com',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
            'phone_number'          => '08123456789',
            'country'               => 'Indonesia',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'token',
                         'user',
                     ]
                 ]);

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::create([
            'name'     => 'Citra Lestari',
            'email'    => 'citra@example.com',
            'password' => Hash::make('Secret123!'),
        ]);
        $user->assignRole('student');

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'citra@example.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'token',
                         'user',
                     ]
                 ]);
    }

    public function test_auth_routes_are_protected_by_rate_limiting(): void
    {
        // 10 request awal diizinkan
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email'    => 'unknown@example.com',
                'password' => 'WrongPassword',
            ]);
        }

        // Request ke-11 harus diblokir oleh throttle (HTTP 429 Too Many Requests)
        $rateLimitedResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => 'unknown@example.com',
            'password' => 'WrongPassword',
        ]);

        $rateLimitedResponse->assertStatus(429);
    }
}
