<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Services\MidtransService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected MidtransService $midtransService
    ) {}

    /**
     * Mahasiswa meminta Snap Token untuk bayar kursus
     */
    public function createSnapToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
        ]);

        $enrollment = Enrollment::with(['course', 'user'])->findOrFail($validated['enrollment_id']);

        // Verifikasi pemilik enrollment (hanya boleh bayar enrollment milik sendiri, kecuali admin)
        if ($enrollment->user_id !== $request->user()->id && !$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Tidak memiliki hak akses ke enrollment ini.'], 403);
        }

        if ($enrollment->status === 'active' || $enrollment->status === 'completed') {
            return response()->json(['message' => 'Enrollment ini sudah aktif / lunas.'], 409);
        }

        // Cek dulu apakah transaksi sebelumnya di Midtrans sebetulnya sudah lunas
        if ($enrollment->order_id) {
            $sync = $this->midtransService->syncTransactionStatus($enrollment);
            if (!empty($sync['is_active'])) {
                return response()->json([
                    'message' => 'Pembayaran sudah terverifikasi lunas!',
                    'data'    => [
                        'is_paid'           => true,
                        'enrollment_status' => 'active',
                    ],
                ]);
            }
        }

        try {
            $paymentData = $this->midtransService->createSnapToken($enrollment);

            return response()->json([
                'message' => 'Snap Token berhasil dibuat.',
                'data'    => $paymentData,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Gagal menghubungkan ke Midtrans: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mahasiswa / sistem memverifikasi status pembayaran langsung ke Midtrans API
     */
    public function verifyStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
        ]);

        $enrollment = Enrollment::findOrFail($validated['enrollment_id']);

        if ($enrollment->user_id !== $request->user()->id && !$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Tidak memiliki hak akses.'], 403);
        }

        $result = $this->midtransService->syncTransactionStatus($enrollment);

        return response()->json([
            'message' => 'Status pembayaran berhasil disinkronkan.',
            'data'    => $result,
        ]);
    }

    /**
     * Webhook notifikasi pembayaran otomatis dari Midtrans (Public endpoint)
     */
    public function handleNotification(Request $request): JsonResponse
    {
        $result = $this->midtransService->handleNotification($request->all());

        return response()->json($result);
    }
}
