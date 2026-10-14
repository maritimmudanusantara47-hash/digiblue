<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\User;
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

        \Midtrans\Config::$serverKey    = config('midtrans.server_key') ?: env('MIDTRANS_SERVER_KEY');
        \Midtrans\Config::$clientKey    = config('midtrans.client_key') ?: env('MIDTRANS_CLIENT_KEY');
        \Midtrans\Config::$isProduction = (bool) (config('midtrans.is_production') ?? env('MIDTRANS_IS_PRODUCTION', false));
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
     * Generate Snap Token untuk transaksi keranjang multi-kursus
     *
     * @param User $user
     * @param string $orderId
     * @param int $totalAmount
     * @param array $itemDetails
     * @param Enrollment[] $enrollments
     * @return array
     */
    public function createCartSnapToken(User $user, string $orderId, int $totalAmount, array $itemDetails, array $enrollments): array
    {
        $this->initMidtrans();

        $grossAmount = max(1, $totalAmount);

        $params = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone_number ?? '081234567890',
            ],
            'item_details' => $itemDetails,
            'callbacks' => [
                'finish' => config('app.frontend_url', 'http://localhost:3000') . '/student/dashboard?payment=success',
            ],
        ];

        try {
            $transaction = \Midtrans\Snap::createTransaction($params);
            $snapToken   = $transaction->token ?? null;
            $redirectUrl = $transaction->redirect_url ?? "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$snapToken}";

            // Update snap token ke setiap enrollment dalam keranjang
            foreach ($enrollments as $enrollment) {
                $enrollment->update([
                    'payment_token'  => $snapToken,
                    'order_id'       => $orderId,
                    'payment_status' => 'pending',
                ]);
            }

            return [
                'snap_token'   => $snapToken,
                'redirect_url' => $redirectUrl,
                'order_id'     => $orderId,
                'amount'       => $grossAmount,
            ];
        } catch (Exception $e) {
            Log::error('Midtrans Cart Snap Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Sinkronkan status transaksi langsung dari API Midtrans berdasarkan Enrollment tunggal
     */
    public function syncTransactionStatus(Enrollment $enrollment): array
    {
        $this->initMidtrans();

        if (!$enrollment->order_id) {
            return ['status' => 'no_order_id', 'message' => __('api.belum_ada_transaksi')];
        }

        return $this->syncTransactionStatusByOrderId($enrollment->order_id);
    }

    /**
     * Sinkronkan status transaksi berdasarkan order_id (cocok untuk checkout cart multi-kursus maupun single)
     */
    public function syncTransactionStatusByOrderId(string $orderId): array
    {
        $this->initMidtrans();

        $enrollments = Enrollment::where('order_id', $orderId)->get();

        if ($enrollments->isEmpty()) {
            return ['status' => 'not_found', 'message' => 'Pesanan tidak ditemukan.'];
        }

        try {
            $rawStatus      = \Midtrans\Transaction::status($orderId);
            $midtransStatus = (array) $rawStatus;
            $trxStatus      = $midtransStatus['transaction_status'] ?? null;
            $fraudStatus    = $midtransStatus['fraud_status'] ?? null;

            $isPaid = false;

            if ($trxStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $isPaid = true;
                    foreach ($enrollments as $enrollment) {
                        $enrollment->update([
                            'status'         => 'active',
                            'payment_status' => 'paid',
                            'paid_at'        => $enrollment->paid_at ?? now(),
                        ]);
                    }
                }
            } elseif ($trxStatus === 'settlement') {
                $isPaid = true;
                foreach ($enrollments as $enrollment) {
                    $enrollment->update([
                        'status'         => 'active',
                        'payment_status' => 'paid',
                        'paid_at'        => $enrollment->paid_at ?? now(),
                    ]);
                }
            } elseif (in_array($trxStatus, ['cancel', 'deny', 'expire'])) {
                foreach ($enrollments as $enrollment) {
                    if ($enrollment->payment_status !== 'paid') {
                        $enrollment->update([
                            'payment_status' => 'failed',
                        ]);
                    }
                }
            }

            $firstEnrollment = $enrollments->first();

            return [
                'status'             => 'synced',
                'is_paid'            => $isPaid,
                'is_active'          => in_array($firstEnrollment?->status, ['active', 'completed']),
                'enrollment_status'  => $firstEnrollment?->status,
                'transaction_status' => $trxStatus,
                'order_id'           => $orderId,
                'count'              => $enrollments->count(),
            ];
        } catch (Exception $e) {
            Log::warning("Gagal sync status order {$orderId}: " . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Handle Webhook Notifikasi dari Midtrans (Mendukung transaksi single & cart multi-item)
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
        $serverKey   = config('midtrans.server_key') ?: env('MIDTRANS_SERVER_KEY');
        $mySignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
        if ($signatureKey !== $mySignature) {
            Log::warning('Midtrans Invalid Signature for order: ' . $orderId);
            return ['status' => 'invalid_signature'];
        }

        // Cari record enrollment berdasarkan order_id
        $enrollments = Enrollment::where('order_id', $orderId)->get();

        // Fallback transaksi lama dengan pola DIGIBLUE-{enrollment_id}-{timestamp}
        if ($enrollments->isEmpty()) {
            preg_match('/DIGIBLUE-(\d+)-/', $orderId, $matches);
            $legacyId = $matches[1] ?? null;
            if ($legacyId) {
                $legacy = Enrollment::find($legacyId);
                if ($legacy) {
                    $enrollments = collect([$legacy]);
                }
            }
        }

        if ($enrollments->isEmpty()) {
            return ['status' => 'enrollment_not_found'];
        }

        // Verifikasi kesesuaian nominal
        $expectedAmount = (float) $enrollments->sum('final_payment_amount');
        if ($expectedAmount > 0 && (float) $grossAmount < $expectedAmount) {
            Log::warning("Midtrans Gross Amount Mismatch for order {$orderId}: expected {$expectedAmount}, received {$grossAmount}");
            return ['status' => 'amount_mismatch'];
        }

        foreach ($enrollments as $enrollment) {
            // Idempotensi: jika enrollment sudah tercatat lunas/aktif, jangan turunkan statusnya
            $isAlreadyPaid = $enrollment->payment_status === 'paid' || in_array($enrollment->status, ['active', 'completed']);

            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $enrollment->update([
                        'status'         => 'active',
                        'payment_status' => 'paid',
                        'paid_at'        => $enrollment->paid_at ?? now(),
                    ]);
                }
            } elseif ($transactionStatus === 'settlement') {
                // Lunas (QRIS, VA Bank, GoPay, dsb)
                $enrollment->update([
                    'status'         => 'active',
                    'payment_status' => 'paid',
                    'paid_at'        => $enrollment->paid_at ?? now(),
                ]);
            } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                if (!$isAlreadyPaid) {
                    $enrollment->update([
                        'payment_status' => 'failed',
                        'status'         => 'payment_pending',
                    ]);
                }
            } elseif ($transactionStatus === 'pending') {
                if (!$isAlreadyPaid) {
                    $enrollment->update([
                        'payment_status' => 'pending',
                        'status'         => 'payment_pending',
                    ]);
                }
            }
        }

        return [
            'status'   => 'success',
            'order_id' => $orderId,
            'count'    => $enrollments->count(),
        ];
    }
}
