<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Kirim notifikasi ke satu pengguna (User model atau user_id integer).
     */
    public function send(
        User|int $user,
        string $title,
        string $message,
        string $type = 'system',
        ?string $actionUrl = null,
        ?string $icon = null
    ): UserNotification {
        $userId = $user instanceof User ? $user->id : $user;

        return UserNotification::create([
            'user_id'    => $userId,
            'title'      => $title,
            'message'    => $message,
            'type'       => $type,
            'action_url' => $actionUrl,
            'icon'       => $icon ?? $this->resolveDefaultIcon($type),
            'is_read'    => false,
        ]);
    }

    /**
     * Kirim notifikasi massal ke sekelompok pengguna.
     */
    public function notifyUsers(
        iterable $users,
        string $title,
        string $message,
        string $type = 'system',
        ?string $actionUrl = null,
        ?string $icon = null
    ): int {
        $resolvedIcon = $icon ?? $this->resolveDefaultIcon($type);
        $count = 0;
        $now = now();
        $records = [];

        foreach ($users as $user) {
            $userId = $user instanceof User ? $user->id : $user;
            if (!$userId) continue;

            $records[] = [
                'user_id'    => $userId,
                'title'      => $title,
                'message'    => $message,
                'type'       => $type,
                'action_url' => $actionUrl,
                'icon'       => $resolvedIcon,
                'is_read'    => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $count++;
        }

        if (!empty($records)) {
            // Batch insert chunked for high performance
            foreach (array_chunk($records, 100) as $chunk) {
                UserNotification::insert($chunk);
            }
        }

        return $count;
    }

    /**
     * Kirim notifikasi ke semua Super Admin / Admin.
     */
    public function notifyAdmins(
        string $title,
        string $message,
        string $type = 'system',
        ?string $actionUrl = null,
        ?string $icon = null
    ): int {
        $admins = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->get();
        return $this->notifyUsers($admins, $title, $message, $type, $actionUrl, $icon);
    }

    /**
     * Kirim notifikasi ke semua Asesor.
     */
    public function notifyAssessors(
        string $title,
        string $message,
        string $type = 'system',
        ?string $actionUrl = null,
        ?string $icon = null
    ): int {
        $assessors = User::whereHas('roles', fn($q) => $q->where('name', 'assessor'))->get();
        return $this->notifyUsers($assessors, $title, $message, $type, $actionUrl, $icon);
    }

    /**
     * Kirim notifikasi ke role tertentu (misal 'admin', 'assessor', 'student').
     */
    public function notifyRole(
        string $role,
        string $title,
        string $message,
        string $type = 'system',
        ?string $actionUrl = null,
        ?string $icon = null
    ): int {
        $users = User::whereHas('roles', fn($q) => $q->where('name', $role))->get();
        return $this->notifyUsers($users, $title, $message, $type, $actionUrl, $icon);
    }

    /**
     * Resolusi icon default berdasarkan tipe notifikasi.
     */
    private function resolveDefaultIcon(string $type): string
    {
        return match ($type) {
            'submission_graded'    => 'pencil-1',
            'new_submission'       => 'pen-to-square',
            'certificate_issued'   => 'certificate-badge-1',
            'enrollment_activated' => 'book-1',
            'new_enrollment'       => 'clipboard',
            'payment_received'     => 'credit-card-multiple',
            default                => 'alarm-1',
        };
    }
}
