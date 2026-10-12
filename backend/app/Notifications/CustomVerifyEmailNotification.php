<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class CustomVerifyEmailNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verifikasi Alamat Email — DigiBlueCamp')
            ->greeting("Halo, {$notifiable->name}!")
            ->line('Terima kasih telah mendaftar di DigiBlueCamp — Blue Economy Learning & Certification Platform.')
            ->line('Untuk mengaktifkan akun Anda dan mulai mengakses modul kursus serta materi pembelajaran, silakan klik tombol verifikasi di bawah ini:')
            ->action('Verifikasi Alamat Email', $verificationUrl)
            ->line('Tautan verifikasi ini akan kedaluwarsa dalam 24 jam.')
            ->line('Jika Anda tidak merasa mendaftar di DigiBlueCamp, silakan abaikan email ini.')
            ->salutation("Salam hangat,\nTim DigiBlueCamp");
    }

    protected function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addHours(24),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}
