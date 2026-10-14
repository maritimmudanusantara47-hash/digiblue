<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\AdminCertificateController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminCourseController;
use App\Http\Controllers\Api\AdminQuizController;
use App\Http\Controllers\Api\AdminBatchController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\EmailVerificationController;

// ─── Public Routes ───────────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    // Auth (dilindungi Rate Limiting untuk mencegah brute force)
    Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login',    [AuthController::class, 'login']);
    });

    // Verifikasi Email (signed URL dari email notifikasi)
    Route::get('auth/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->name('verification.verify');

    // Public: Katalog & Verifikasi Sertifikat
    Route::get('courses',              [CourseController::class, 'index']);
    Route::get('courses/{slug}',       [CourseController::class, 'show']);
    Route::get('courses/{courseId}/batches', [AdminBatchController::class, 'index']);
    Route::get('certification-levels', function () {
        return response()->json(['data' => \App\Models\CertificationLevel::where('is_active', true)->orderBy('order_index')->get()]);
    });
    Route::get('verify/{serialUrlKey}/download', [CertificateController::class, 'downloadPublic']);
    Route::get('verify/{serialUrlKey?}', [CertificateController::class, 'verify'])->where('serialUrlKey', '.*'); // Halaman verifikasi publik QR Code / Serial
    Route::post('payments/notification',[PaymentController::class, 'handleNotification']); // Webhook Midtrans

    // ─── Protected Routes (All Authenticated Users) ───────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::post('logout',       [AuthController::class, 'logout']);
            Route::get('me',            [AuthController::class, 'me']);
            Route::put('profile',       [AuthController::class, 'updateProfile']);
            Route::put('password',      [AuthController::class, 'updatePassword']);
            Route::post('email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:6,1');
        });

        // Enrollment & Kursus Peserta
        Route::get('enrollments',           [EnrollmentController::class, 'index']);
        Route::post('enrollments',          [EnrollmentController::class, 'store']);          // Daftar kursus
        Route::delete('enrollments/{id}/cancel', [EnrollmentController::class, 'cancel']);   // Batalkan pesanan
        Route::get('enrollments/{id}',      [EnrollmentController::class, 'show']);
        Route::get('enrollments/{id}/contents', [ContentController::class, 'index']);         // Daftar konten kursus

        // Student: Konfirmasi kehadiran Field Study
        Route::patch('enrollments/{id}/confirm-field-study', [EnrollmentController::class, 'studentConfirmFieldStudy']);

        // Submission (Kuis, Esai, Video, Self-Assessment Modul)
        Route::post('submissions',          [SubmissionController::class, 'store']);
        Route::get('submissions/my',        [SubmissionController::class, 'mySubmissions']); // Submission milik sendiri
        Route::get('submissions/{id}',      [SubmissionController::class, 'show']);
        Route::delete('submissions/{id}',   [SubmissionController::class, 'destroy']);

        // Sertifikat Peserta
        Route::get('certificates',          [CertificateController::class, 'index']);
        Route::get('certificates/{id}',     [CertificateController::class, 'show']);
        Route::get('certificates/{id}/download', [CertificateController::class, 'download']); // Download PDF

        // Pembayaran Midtrans Snap
        Route::post('payments/create-snap-token', [PaymentController::class, 'createSnapToken']);
        Route::post('payments/checkout-cart',     [PaymentController::class, 'checkoutCart']);
        Route::post('payments/verify-status',     [PaymentController::class, 'verifyStatus']);

        // ─── Assessor & Admin Routes ─────────────────────────────────────────
        Route::middleware('role:assessor|admin')->group(function () {
            Route::get('submissions',               [SubmissionController::class, 'index']);              // List semua submission
            Route::patch('submissions/{id}/grade',  [SubmissionController::class, 'grade']);              // Beri nilai
            Route::patch('enrollments/{id}/field-trip', [EnrollmentController::class, 'toggleFieldTrip']); // Centang kehadiran Field Trip
        });

        // ─── Admin Only Routes ────────────────────────────────────────────────
        Route::middleware('role:admin')->prefix('admin')->group(function () {

            // Dashboard Metrics
            Route::get('dashboard-stats', function () {
                return response()->json([
                    'data' => [
                        'total_users'               => \App\Models\User::count(),
                        'active_enrollments'        => \App\Models\Enrollment::where('status', 'active')->count(),
                        'certificates_issued'       => \App\Models\Certificate::count(),
                        'certificates_pending_sync' => \App\Models\Certificate::where('sync_status', 'failed')->count(),
                    ]
                ]);
            });

            // User Management
            Route::get('users',              [AdminUserController::class, 'index']);
            Route::get('users/{id}',         [AdminUserController::class, 'show']);
            Route::patch('users/{id}',       [AdminUserController::class, 'update']);
            Route::post('users/{id}/verify', [EmailVerificationController::class, 'adminVerify']);

            // Enrollment Management (Admin)
            Route::get('enrollments',                       [EnrollmentController::class, 'adminIndex']);   // List semua enrollment
            Route::post('enrollments',                      [EnrollmentController::class, 'adminStore']);   // Manual enroll user
            Route::patch('enrollments/{id}/status',         [EnrollmentController::class, 'updateStatus']); // Ubah status
            Route::delete('enrollments/{id}',               [EnrollmentController::class, 'destroy']);      // Hapus enrollment

            // Batch Angkatan Management (Admin)
            Route::get('batches',                           [AdminBatchController::class, 'index']);
            Route::post('courses/{courseId}/batches',       [AdminBatchController::class, 'store']);
            Route::patch('batches/{id}',                    [AdminBatchController::class, 'update']);
            Route::delete('batches/{id}',                   [AdminBatchController::class, 'destroy']);

            // Course Management (CRUD Dinamis)
            Route::apiResource('courses',  AdminCourseController::class);
            Route::post('contents/{id}/upload',                             [AdminCourseController::class, 'uploadFile']);        // Upload PDF modul
            Route::post('contents/{id}/attachments',                        [AdminCourseController::class, 'uploadAttachment']);  // Upload attachment studi kasus
            Route::delete('contents/{id}/attachments/{attachmentId}',       [AdminCourseController::class, 'deleteAttachment']);  // Hapus attachment studi kasus
            Route::post('contents/upload-image',                            [AdminCourseController::class, 'uploadImage']);       // Upload Gambar Materi (Lokal)
            Route::post('sections/{sectionId}/contents',                    [AdminCourseController::class, 'storeContent']);      // Tambah konten ke seksi
            Route::patch('contents/{id}',                                   [AdminCourseController::class, 'updateContent']);     // Edit konten
            Route::delete('contents/{id}',                                  [AdminCourseController::class, 'destroyContent']);    // Hapus konten

            // Quiz Question CRUD (untuk MCQ)
            Route::get('contents/{id}/questions',         [AdminQuizController::class, 'index']);   // List soal
            Route::post('contents/{id}/questions',        [AdminQuizController::class, 'store']);   // Tambah soal
            Route::post('contents/{id}/questions/import', [AdminQuizController::class, 'import']);  // Import soal dari PDF/Text/JSON
            Route::patch('questions/{id}',                [AdminQuizController::class, 'update']);  // Edit soal
            Route::delete('questions/{id}',               [AdminQuizController::class, 'destroy']); // Hapus soal


            // Certificate Management
            Route::get('certificates',                   [AdminCertificateController::class, 'index']);
            Route::get('certificates/next-serial',       [AdminCertificateController::class, 'getNextSerial']); // Ambil estimasi serial berikutnya
            Route::post('certificates',                  [AdminCertificateController::class, 'issue']);        // Terbitkan sertifikat
            Route::patch('certificates/{id}',            [AdminCertificateController::class, 'update']);       // Override nomor seri
            Route::post('certificates/{id}/sync',        [AdminCertificateController::class, 'syncToTBE']);    // Push ke The Blue Economist
            Route::post('certificates/resync-failed',    [AdminCertificateController::class, 'resyncFailed']); // Re-sync semua yg gagal
            Route::get('certificates/export',            [AdminCertificateController::class, 'export']);       // Export Excel
            Route::get('certificates/{id}/download',     [AdminCertificateController::class, 'download']);     // Download PDF
            // Template Layout Designer
            Route::get('certificates/template/layout',   [AdminCertificateController::class, 'getLayout']);    // Ambil konfigurasi posisi field
            Route::put('certificates/template/layout',   [AdminCertificateController::class, 'saveLayout']);   // Simpan konfigurasi posisi field
            Route::get('certificates/template/image',    [AdminCertificateController::class, 'getTemplateImage']); // Template image sebagai base64
        });
    });
});
