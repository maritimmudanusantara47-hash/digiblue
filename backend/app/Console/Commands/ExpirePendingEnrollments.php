<?php

namespace App\Console\Commands;

use App\Models\Enrollment;
use Illuminate\Console\Command;

class ExpirePendingEnrollments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'enrollments:expire-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Otomatis menandai expired enrollment berstatus payment_pending yang telah melewati 24 jam';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $cutoff = now()->subHours(24);

        $expiredQuery = Enrollment::where('status', 'payment_pending')
            ->where('created_at', '<', $cutoff);

        $count = $expiredQuery->count();

        if ($count === 0) {
            $this->info('Tidak ada enrollment payment_pending yang kedaluwarsa (> 24 jam).');
            return Command::SUCCESS;
        }

        $affected = $expiredQuery->update([
            'status'         => 'expired',
            'payment_status' => 'expired',
        ]);

        $this->info("Berhasil menandai {$affected} enrollment kedaluwarsa (> 24 jam) sebagai 'expired'.");

        return Command::SUCCESS;
    }
}
