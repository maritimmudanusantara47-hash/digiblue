<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'enrollment_type',
        'status',
        'attended_field_trip',
        'final_payment_amount',
        'payment_token',
        'order_id',
        'payment_status',
        'paid_at',
    ];

    protected $casts = [
        'attended_field_trip'  => 'boolean',
        'final_payment_amount' => 'decimal:2',
        'paid_at'              => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function scholarshipApplication(): HasMany
    {
        return $this->hasMany(ScholarshipApplication::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(StudentSubmission::class, 'user_id', 'user_id');
    }

    public function certificate(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }
}
