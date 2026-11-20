<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $guarded = [];

    protected $appends = ['cbetc_reg_no'];

    public function getCbetcRegNoAttribute(): string
    {
        try {
            return app(\App\Services\CertificateService::class)->getCbetcRegNoForCertificate($this);
        } catch (\Throwable $e) {
            return '';
        }
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}
