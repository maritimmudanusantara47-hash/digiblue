<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduler otomatis membatalkan / expire transaksi pending yang > 24 jam
Schedule::command('enrollments:expire-pending')->hourly();
