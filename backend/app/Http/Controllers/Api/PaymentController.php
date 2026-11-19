<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Services\MidtransService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

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

        if ($enrollment->status === 'completed' || ($enrollment->status === 'active' && $enrollment->paid_at)) {
            return response()->json(['message' => 'Enrollment ini sudah aktif / lunas.'], 409);
        }

        if ($enrollment->status === 'active' && !$enrollment->paid_at) {
            $enrollment->update(['status' => 'payment_pending']);
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
     * Mahasiswa melakukan checkout keranjang belanja (mendukung 1 atau banyak kursus sekaligus)
     * Lazy Enrollment: record enrollment payment_pending HANYA dibuat di sini saat checkout diinisiasi.
     */
    public function checkoutCart(Request $request): JsonResponse
    {
        $rules = [
            'items'             => 'required|array|min:1',
            'items.*.course_id' => 'required|exists:courses,id',
            'items.*.batch_id'  => 'nullable',
        ];
        if (Schema::hasTable('course_batches')) {
            $rules['items.*.batch_id'] = 'nullable|exists:course_batches,id';
        }
        $validated = $request->validate($rules);

        $user = $request->user();

        if (!$user->hasRole('admin') && !$user->hasVerifiedEmail()) {
            return response()->json([
                'message'          => 'Silakan verifikasi email Anda terlebih dahulu untuk mendaftar atau mengakses kursus.',
                'email_unverified' => true,
            ], 403);
        }

        $items = $validated['items'];
        $courseIds = array_column($items, 'course_id');

        // Cek duplikasi item kursus dalam 1 request keranjang
        if (count($courseIds) !== count(array_unique($courseIds))) {
            return response()->json([
                'message' => 'Terdapat kursus duplikat dalam keranjang belanja.',
            ], 422);
        }

        // Ambil semua data kursus
        $courses = Course::whereIn('id', $courseIds)->get()->keyBy('id');

        // Validasi apakah user sudah aktif di salah satu kursus
        $existingEnrollments = Enrollment::where('user_id', $user->id)
            ->whereIn('course_id', $courseIds)
            ->get()
            ->keyBy('course_id');

        foreach ($items as $item) {
            $cid = $item['course_id'];
            if (isset($existingEnrollments[$cid])) {
                $existing = $existingEnrollments[$cid];
                if ($existing->status === 'completed' || ($existing->status === 'active' && $existing->paid_at)) {
                    $cTitle = $courses[$cid]->title ?? 'Kursus';
                    return response()->json([
                        'message' => "Anda sudah memiliki akses aktif ke kursus '{$cTitle}'. Silakan hapus kursus tersebut dari keranjang.",
                    ], 422);
                }
            }
        }

        // Hitung total harga & siapkan item_details untuk Midtrans
        $totalAmount = 0;
        $itemDetails = [];
        $isAllFree   = true;

        foreach ($items as $item) {
            $course = $courses[$item['course_id']];
            $price  = (int) ($course->price ?? $course->price_idr ?? 0);
            if ($price > 0) {
                $isAllFree = false;
            }
            $totalAmount += $price;

            $itemDetails[] = [
                'id'       => (string) $course->id,
                'price'    => $price,
                'quantity' => 1,
                'name'     => mb_substr($course->title, 0, 50),
            ];
        }

        // Buat atau perbarui record enrollment
        $enrollments = [];
        $hasBatchCol = Schema::hasColumn('enrollments', 'batch_id');

        // Jika seluruh item gratis (totalAmount == 0)
        if ($isAllFree || $totalAmount === 0) {
            foreach ($items as $item) {
                $cid     = $item['course_id'];
                $batchId = $item['batch_id'] ?? null;
                $price   = (int) ($courses[$cid]->price ?? $courses[$cid]->price_idr ?? 0);

                $updateData = [
                    'enrollment_type'      => 'self_paid',
                    'status'               => 'active',
                    'payment_status'       => 'paid',
                    'paid_at'              => now(),
                    'final_payment_amount' => $price,
                ];
                if ($hasBatchCol) {
                    $updateData['batch_id'] = $batchId;
                }

                $enrollment = Enrollment::updateOrCreate(
                    [
                        'user_id'   => $user->id,
                        'course_id' => $cid,
                    ],
                    $updateData
                );
                $enrollments[] = $enrollment;
            }

            try {
                $courseTitles = collect($items)->map(fn($it) => $courses[$it['course_id']]->title ?? 'Kursus')->join(', ');
                $notifService = app(\App\Services\NotificationService::class);
                $notifService->notifyAdmins(
                    "Pendaftaran Kursus Baru (Gratis)",
                    "Peserta {$user->name} baru saja mendaftar kursus gratis: {$courseTitles}.",
                    'new_enrollment',
                    '/admin/enrollments',
                    'clipboard'
                );
                $notifService->send(
                    $user->id,
                    "Pendaftaran Kursus Berhasil!",
                    "Akses Anda untuk kursus {$courseTitles} kini telah aktif. Selamat belajar!",
                    'enrollment_activated',
                    '/student/dashboard',
                    'book-1'
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Notification trigger free checkout error: " . $e->getMessage());
            }

            return response()->json([
                'message' => 'Pendaftaran berhasil. Semua kursus gratis telah aktif!',
                'data'    => [
                    'is_free'     => true,
                    'enrollments' => $enrollments,
                ],
            ]);
        }

        // Jika ada item berbayar, siapkan order_id
        $orderId = 'DIGIBLUE-CART-' . $user->id . '-' . time() . '-' . rand(100, 999);

        foreach ($items as $item) {
            $cid     = $item['course_id'];
            $batchId = $item['batch_id'] ?? null;
            $price   = (int) ($courses[$cid]->price ?? $courses[$cid]->price_idr ?? 0);

            $updateData = [
                'enrollment_type'      => 'self_paid',
                'status'               => 'payment_pending',
                'payment_status'       => 'pending',
                'final_payment_amount' => $price,
                'order_id'             => $orderId,
            ];
            if ($hasBatchCol) {
                $updateData['batch_id'] = $batchId;
            }

            $enrollment = Enrollment::updateOrCreate(
                [
                    'user_id'   => $user->id,
                    'course_id' => $cid,
                ],
                $updateData
            );
            $enrollments[] = $enrollment;
        }

        // Notifikasi ke Super Admin mengenai checkout kursus baru
        try {
            $courseTitles = collect($items)->map(fn($it) => $courses[$it['course_id']]->title ?? 'Kursus')->join(', ');
            app(\App\Services\NotificationService::class)->notifyAdmins(
                "Pendaftaran Kursus Baru",
                "Peserta {$user->name} mendaftar kursus: {$courseTitles}. Menunggu penyelesaian pembayaran.",
                'new_enrollment',
                '/admin/enrollments',
                'clipboard'
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Notification trigger cart checkout error: " . $e->getMessage());
        }

        try {
            $paymentData = $this->midtransService->createCartSnapToken(
                user: $user,
                orderId: $orderId,
                totalAmount: $totalAmount,
                itemDetails: $itemDetails,
                enrollments: $enrollments
            );

            return response()->json([
                'message' => 'Snap Token keranjang berhasil dibuat.',
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
            'enrollment_id' => 'nullable|exists:enrollments,id',
            'order_id'      => 'nullable|string',
        ]);

        if (empty($validated['enrollment_id']) && empty($validated['order_id'])) {
            return response()->json(['message' => 'Parameter enrollment_id atau order_id wajib diisi.'], 422);
        }

        if (!empty($validated['order_id'])) {
            $result = $this->midtransService->syncTransactionStatusByOrderId($validated['order_id']);
            return response()->json([
                'message' => 'Status pembayaran berhasil disinkronkan.',
                'data'    => $result,
            ]);
        }

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
