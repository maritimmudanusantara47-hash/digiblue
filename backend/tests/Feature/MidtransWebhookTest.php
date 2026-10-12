<?php

namespace Tests\Feature;

use App\Models\CertificationLevel;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MidtransWebhookTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private Course $course;
    private Enrollment $enrollment;
    private string $serverKey = 'Mid-server-test-key-12345';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('midtrans.server_key', $this->serverKey);

        Role::create(['name' => 'student', 'guard_name' => 'web']);

        $this->student = User::create([
            'name'     => 'Peserta Kursus',
            'email'    => 'peserta@example.com',
            'password' => Hash::make('password'),
        ]);
        $this->student->assignRole('student');

        $level = CertificationLevel::create([
            'name'        => 'Foundation Level',
            'code'        => 'FND',
            'order_index' => 1,
            'is_active'   => true,
        ]);

        $this->course = Course::create([
            'certification_level_id' => $level->id,
            'title'                  => 'Ekonomi Biru Indonesia',
            'slug'                   => 'ekonomi-biru-indonesia',
            'price_idr'              => 500000,
            'is_active'              => true,
            'order_index'            => 1,
        ]);

        $this->enrollment = Enrollment::create([
            'user_id'              => $this->student->id,
            'course_id'            => $this->course->id,
            'status'               => 'payment_pending',
            'payment_status'       => 'pending',
            'final_payment_amount' => 500000,
            'order_id'             => 'DIGIBLUE-999-12345678',
            'enrollment_type'      => 'self_paid',
        ]);
    }

    public function test_webhook_rejects_tampered_or_invalid_signature(): void
    {
        $payload = [
            'order_id'           => "DIGIBLUE-{$this->enrollment->id}-12345678",
            'status_code'        => '200',
            'gross_amount'       => '500000.00',
            'signature_key'      => 'fake_tampered_signature_key',
            'transaction_status' => 'settlement',
        ];

        $service = app(MidtransService::class);
        $result  = $service->handleNotification($payload);

        $this->assertEquals('invalid_signature', $result['status']);
        $this->assertEquals('payment_pending', $this->enrollment->fresh()->status);
    }

    public function test_webhook_settlement_activates_enrollment(): void
    {
        $orderId     = "DIGIBLUE-{$this->enrollment->id}-12345678";
        $statusCode  = '200';
        $grossAmount = '500000.00';
        $validSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        $payload = [
            'order_id'           => $orderId,
            'status_code'        => $statusCode,
            'gross_amount'       => $grossAmount,
            'signature_key'      => $validSignature,
            'transaction_status' => 'settlement',
        ];

        $service = app(MidtransService::class);
        $result  = $service->handleNotification($payload);

        $this->assertEquals('success', $result['status']);
        $this->assertEquals('active', $this->enrollment->fresh()->status);
        $this->assertEquals('paid', $this->enrollment->fresh()->payment_status);
        $this->assertNotNull($this->enrollment->fresh()->paid_at);
    }

    public function test_webhook_idempotency_prevents_status_rollback_on_delayed_expire(): void
    {
        // Set enrollment sudah lunas terlebih dahulu
        $this->enrollment->update([
            'status'         => 'active',
            'payment_status' => 'paid',
            'paid_at'        => now(),
        ]);

        $orderId     = "DIGIBLUE-{$this->enrollment->id}-12345678";
        $statusCode  = '200';
        $grossAmount = '500000.00';
        $validSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        // Simulasi notifikasi expired/cancelled yang terlambat tiba
        $delayedPayload = [
            'order_id'           => $orderId,
            'status_code'        => $statusCode,
            'gross_amount'       => $grossAmount,
            'signature_key'      => $validSignature,
            'transaction_status' => 'expire',
        ];

        $service = app(MidtransService::class);
        $service->handleNotification($delayedPayload);

        // Status WAJIB tetap active dan paid, tidak boleh ditimpa menjadi failed
        $this->assertEquals('active', $this->enrollment->fresh()->status);
        $this->assertEquals('paid', $this->enrollment->fresh()->payment_status);
    }

    public function test_webhook_rejects_underpaid_gross_amount(): void
    {
        $orderId     = "DIGIBLUE-{$this->enrollment->id}-12345678";
        $statusCode  = '200';
        $tamperedAmount = '10000.00'; // Tagihan 500.000, tapi manipulasi menjadi 10.000
        $signature = hash('sha512', $orderId . $statusCode . $tamperedAmount . $this->serverKey);

        $payload = [
            'order_id'           => $orderId,
            'status_code'        => $statusCode,
            'gross_amount'       => $tamperedAmount,
            'signature_key'      => $signature,
            'transaction_status' => 'settlement',
        ];

        $service = app(MidtransService::class);
        $result  = $service->handleNotification($payload);

        $this->assertEquals('amount_mismatch', $result['status']);
        $this->assertEquals('payment_pending', $this->enrollment->fresh()->status);
    }
}
