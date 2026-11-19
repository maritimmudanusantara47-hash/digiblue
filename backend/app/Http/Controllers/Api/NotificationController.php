<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Dapatkan daftar notifikasi milik user yang sedang login beserta jumlah belum dibaca.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = UserNotification::where('user_id', $userId)
            ->recent();

        if ($request->boolean('unread_only')) {
            $query->unread();
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        $notifications = $query->paginate($perPage);

        $unreadCount = UserNotification::where('user_id', $userId)
            ->unread()
            ->count();

        return response()->json([
            'data'         => $notifications->items(),
            'meta'         => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'per_page'     => $notifications->perPage(),
                'total'        => $notifications->total(),
            ],
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Tandai satu notifikasi sebagai sudah dibaca.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = UserNotification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->markAsRead();

        $unreadCount = UserNotification::where('user_id', $request->user()->id)
            ->unread()
            ->count();

        return response()->json([
            'message'      => 'Notifikasi telah ditandai sebagai dibaca.',
            'unread_count' => $unreadCount,
            'data'         => $notification,
        ]);
    }

    /**
     * Tandai seluruh notifikasi user sebagai sudah dibaca.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        UserNotification::where('user_id', $request->user()->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message'      => 'Semua notifikasi telah ditandai sebagai dibaca.',
            'unread_count' => 0,
        ]);
    }

    /**
     * Hapus satu notifikasi.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $notification = UserNotification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->delete();

        $unreadCount = UserNotification::where('user_id', $request->user()->id)
            ->unread()
            ->count();

        return response()->json([
            'message'      => 'Notifikasi berhasil dihapus.',
            'unread_count' => $unreadCount,
        ]);
    }
}
