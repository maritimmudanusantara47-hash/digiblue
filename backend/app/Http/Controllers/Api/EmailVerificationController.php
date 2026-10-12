<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class EmailVerificationController extends Controller
{
    /**
     * Verifikasi email via signed URL link dari email.
     * Route: GET /v1/auth/email/verify/{id}/{hash}
     */
    public function verify(Request $request, int $id, string $hash): RedirectResponse|JsonResponse
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        $user = User::findOrFail($id);

        // Validasi kecocokan hash email
        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Tautan verifikasi tidak valid.'], 403);
            }
            return redirect("{$frontendUrl}/student/dashboard?verify_error=invalid_hash");
        }

        // Tandai verifikasi jika belum terverifikasi
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Email berhasil diverifikasi.',
                'data'    => $user->fresh()->load('roles'),
            ]);
        }

        return redirect("{$frontendUrl}/student/dashboard?verified=1");
    }

    /**
     * Kirim ulang link verifikasi email.
     * Route: POST /v1/auth/email/resend
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message'  => 'Email Anda sudah terverifikasi sebelumnya.',
                'verified' => true,
            ]);
        }

        $user->sendEmailVerificationNotification();

        // Dalam lingkungan lokal (unhosted), sediakan dev_url untuk kemudahan pengujian
        $devUrl = null;
        if (app()->environment('local')) {
            $devUrl = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addHours(24),
                [
                    'id'   => $user->getKey(),
                    'hash' => sha1($user->getEmailForVerification()),
                ]
            );
        }

        return response()->json([
            'message' => 'Email verifikasi berhasil dikirim. Silakan periksa inbox/spam email Anda.',
            'dev_url' => $devUrl,
        ]);
    }

    /**
     * Verifikasi manual oleh Admin.
     * Route: POST /v1/admin/users/{id}/verify
     */
    public function adminVerify(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return response()->json([
            'message' => "Pengguna {$user->name} berhasil diverifikasi secara manual.",
            'data'    => $user->fresh()->load('roles'),
        ]);
    }
}
