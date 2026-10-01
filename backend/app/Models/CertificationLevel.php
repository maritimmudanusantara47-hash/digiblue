<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CertificationLevel extends Model
{
    protected $fillable = [
        'code',
        'name',
        'is_field_trip_required',
    ];

    protected $casts = [
        'is_field_trip_required' => 'boolean',
    ];

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }
}
