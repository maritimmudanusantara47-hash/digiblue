<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\ScholarshipController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\AdminCertificateController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminCourseController;

// ─── Public Routes ───────────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    // Auth (mendukung format /auth/login dan /login)
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login',    [AuthController::class, 'login']);
    });
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    // Public: Katalog & Verifikasi Sertifikat
    Route::get('courses',              [CourseController::class, 'index']);
    Route::get('courses/{slug}',       [CourseController::class, 'show']);
    Route::get('verify/{serialUrlKey}',[CertificateController::class, 'verify']); // Halaman verifikasi publik QR Code

    // ─── Protected Routes (All Authenticated Users) ───────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me',      [AuthController::class, 'me']);
        });
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);

        // Enrollment & Kursus Peserta
        Route::get('enrollments',           [EnrollmentController::class, 'index']);
        Route::post('enrollments',          [EnrollmentController::class, 'store']);          // Daftar kursus
        Route::get('enrollments/{id}',      [EnrollmentController::class, 'show']);
        Route::get('enrollments/{id}/contents', [ContentController::class, 'index']);         // Daftar konten kursus

        // Beasiswa
        Route::post('scholarships/apply',   [ScholarshipController::class, 'apply']);         // Upload berkas & surat motivasi
        Route::post('scholarships/{id}/appeal', [ScholarshipController::class, 'appeal']);    // Ajukan negosiasi biaya

        // Submission (Kuis, Esai, Video)
        Route::post('submissions',          [SubmissionController::class, 'store']);
        Route::get('submissions/my',        [SubmissionController::class, 'mySubmissions']); // Submission milik sendiri
        Route::get('submissions/{id}',      [SubmissionController::class, 'show']);

        // Sertifikat Peserta
        Route::get('certificates',          [CertificateController::class, 'index']);
        Route::get('certificates/{id}',     [CertificateController::class, 'show']);
        Route::get('certificates/{id}/download', [CertificateController::class, 'download']); // Download PDF

        // ─── Assessor & Admin Routes ─────────────────────────────────────────
        Route::middleware('role:assessor|admin')->group(function () {
            Route::get('submissions',               [SubmissionController::class, 'index']);              // List semua submission
            Route::patch('submissions/{id}/grade',  [SubmissionController::class, 'grade']);              // Beri nilai
            Route::patch('enrollments/{id}/field-trip', [EnrollmentController::class, 'toggleFieldTrip']); // Centang kehadiran Field Trip
        });

        // ─── Admin Only Routes ────────────────────────────────────────────────
        Route::middleware('role:admin')->prefix('admin')->group(function () {

            // User Management
            Route::get('users',         [AdminUserController::class, 'index']);
            Route::get('users/{id}',    [AdminUserController::class, 'show']);
            Route::patch('users/{id}',  [AdminUserController::class, 'update']);

            // Enrollment Management (Admin)
            Route::get('enrollments',                       [EnrollmentController::class, 'adminIndex']);   // List semua enrollment
            Route::post('enrollments',                      [EnrollmentController::class, 'adminStore']);   // Manual enroll user
            Route::patch('enrollments/{id}/status',         [EnrollmentController::class, 'updateStatus']); // Ubah status
            Route::patch('enrollments/{id}/field-trip',     [EnrollmentController::class, 'toggleFieldTrip']); // Toggle field trip
            Route::delete('enrollments/{id}',               [EnrollmentController::class, 'destroy']);      // Hapus enrollment

            // Course Management (CRUD Dinamis)
            Route::apiResource('courses',  AdminCourseController::class);
            Route::apiResource('courses.sections',  AdminCourseController::class); // Sections per kursus
            Route::post('contents/{id}/upload',     [AdminCourseController::class, 'uploadFile']); // Upload PDF modul

            // Scholarship Management
            Route::get('scholarships',              [ScholarshipController::class, 'adminIndex']);
            Route::patch('scholarships/{id}/decide',[ScholarshipController::class, 'decide']);    // Fully/Partial A/B/Reject
            Route::patch('scholarships/{id}/appeal/{appealId}/resolve', [ScholarshipController::class, 'resolveAppeal']); // Setujui negosiasi

            // Certificate Management
            Route::get('certificates',              [AdminCertificateController::class, 'index']);
            Route::post('certificates',             [AdminCertificateController::class, 'issue']);      // Terbitkan sertifikat
            Route::patch('certificates/{id}',       [AdminCertificateController::class, 'update']);     // Override nomor seri
            Route::post('certificates/{id}/sync',   [AdminCertificateController::class, 'syncToTBE']); // Push ke The Blue Economist
            Route::post('certificates/resync-failed', [AdminCertificateController::class, 'resyncFailed']); // Re-sync semua yg gagal
            Route::get('certificates/export',       [AdminCertificateController::class, 'export']);     // Export Excel
            Route::get('certificates/{id}/download',[AdminCertificateController::class, 'download']);   // Download PDF
        });
    });
});
