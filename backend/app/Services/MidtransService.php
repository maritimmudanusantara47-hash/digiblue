<?php

namespace App\Services;

use App\Models\Enrollment;
use Exception;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    public function __construct()
    {
        $this->initMidtrans();
    }

    protected function initMidtrans(): void
    {
        // Pastikan library Midtrans ter-load
        if (!class_exists('\Midtrans\Config')) {
            $midtransPath = base_path('vendor/midtrans/midtrans-php/Midtrans.php');
            if (file_exists($midtransPath)) {
                require_once $midtransPath;
            }
        }

        \Midtrans\Config::$serverKey    = config('midtrans.server_key');
        \Midtrans\Config::$clientKey    = config('midtrans.client_key');
        \Midtrans\Config::$isProduction = (bool) config('midtrans.is_production', false);
        \Midtrans\Config::$isSanitized  = (bool) config('midtrans.is_sanitized', true);
        \Midtrans\Config::$is3ds        = (bool) config('midtrans.is_3ds', true);
    }

    /**
     * Generate Snap Token untuk transaksi Enrollment
     */
    public function createSnapToken(Enrollment $enrollment): array
    {
        $this->initMidtrans();

        $course = $enrollment->course;
        $user   = $enrollment->user;

        // Tentukan nominal pembayaran:
        // Jika final_payment_amount sudah ada (misal beasiswa parsial), pakai itu.
        // Jika tidak, gunakan harga kursus (atau default 500.000 jika 0/null untuk tes)
        $amount = (int) ($enrollment->final_payment_amount ?? $course->price_idr ?? 500000);
        if ($amount <= 0) {
            $amount = 100000; // Minimal transaksi dummy di Sandbox
        }

        $orderId = 'DIGIBLUE-' . $enrollment->id . '-' . time();

        $params = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone_number ?? '081234567890',
            ],
            'item_details' => [
                [
                    'id'       => (string) $course->id,
                    'price'    => $amount,
                    'quantity' => 1,
                    'name'     => substr($course->title, 0, 50),
                ],
            ],
            'callbacks' => [
                'finish' => config('app.frontend_url', 'http://localhost:3000') . '/student/dashboard?payment=success',
            ],
        ];
        try {
            $transaction = \Midtrans\Snap::createTransaction($params);
            $snapToken   = $transaction->token ?? null;
            $redirectUrl = $transaction->redirect_url ?? "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$snapToken}";

            // Simpan token dan order_id di enrollment
            $enrollment->update([
                'payment_token'        => $snapToken,
                'order_id'             => $orderId,
                'final_payment_amount' => $amount,
                'payment_status'       => 'pending',
            ]);

            return [
                'snap_token'   => $snapToken,
                'redirect_url' => $redirectUrl,
                'order_id'     => $orderId,
                'amount'       => $amount,
            ];
        } catch (Exception $e) {
            Log::error('Midtrans Snap Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Sinkronkan status transaksi langsung dari API Midtrans
     */
    public function syncTransactionStatus(Enrollment $enrollment): array
    {
        $this->initMidtrans();

        if (!$enrollment->order_id) {
            return ['status' => 'no_order_id', 'message' => 'Belum ada transaksi'];
        }

        try {
            $midtransStatus = \Midtrans\Transaction::status($enrollment->order_id);
            $trxStatus      = $midtransStatus->transaction_status ?? null;
            $fraudStatus    = $midtransStatus->fraud_status ?? null;

            if ($trxStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $enrollment->update([
                        'status'         => 'active',
                        'payment_status' => 'paid',
                        'paid_at'        => now(),
                    ]);
                }
            } elseif ($trxStatus === 'settlement') {
                $enrollment->update([
                    'status'         => 'active',
                    'payment_status' => 'paid',
                    'paid_at'        => now(),
                ]);
            } elseif (in_array($trxStatus, ['cancel', 'deny', 'expire'])) {
                $enrollment->update([
                    'payment_status' => 'failed',
                ]);
            }

            return [
                'status'             => 'synced',
                'is_active'          => in_array($enrollment->fresh()->status, ['active', 'completed']),
                'enrollment_status'  => $enrollment->fresh()->status,
                'transaction_status' => $trxStatus,
            ];
        } catch (Exception $e) {
            Log::warning("Gagal sync status order {$enrollment->order_id}: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Handle Webhook Notifikasi dari Midtrans
     */
    public function handleNotification(array $payload): array
    {
        $this->initMidtrans();

        $orderId           = $payload['order_id'] ?? '';
        $statusCode        = $payload['status_code'] ?? '';
        $grossAmount       = $payload['gross_amount'] ?? '';
        $signatureKey      = $payload['signature_key'] ?? '';
        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus       = $payload['fraud_status'] ?? '';

        // Validasi Signature Key
        $mySignature = hash('sha512', $orderId . $statusCode . $grossAmount . config('midtrans.server_key'));
        if ($signatureKey !== $mySignature) {
            Log::warning('Midtrans Invalid Signature for order: ' . $orderId);
            return ['status' => 'invalid_signature'];
        }

        // Ekstrak enrollment ID dari order_id: DIGIBLUE-{enrollment_id}-{timestamp}
        preg_match('/DIGIBLUE-(\d+)-/', $orderId, $matches);
        $enrollmentId = $matches[1] ?? null;

        if (!$enrollmentId) {
            return ['status' => 'enrollment_not_found'];
        }

        $enrollment = Enrollment::find($enrollmentId);
        if (!$enrollment) {
            return ['status' => 'enrollment_not_found'];
        }

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'accept') {
                $enrollment->update([
                    'status'         => 'active',
                    'payment_status' => 'paid',
                    'paid_at'        => now(),
                ]);
            }
        } elseif ($transactionStatus === 'settlement') {
            // Lunas (QRIS, VA Bank, GoPay, dsb)
            $enrollment->update([
                'status'         => 'active',
                'payment_status' => 'paid',
                'paid_at'        => now(),
            ]);
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $enrollment->update([
                'payment_status' => 'failed',
                'status'         => 'payment_pending',
            ]);
        } elseif ($transactionStatus === 'pending') {
            $enrollment->update([
                'payment_status' => 'pending',
                'status'         => 'payment_pending',
            ]);
        }

        return [
            'status'         => 'success',
            'enrollment_id'  => $enrollment->id,
            'payment_status' => $enrollment->payment_status,
        ];
    }
}
