<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property int $course_id
 * @property string $enrollment_type
 * @property string $status
 * @property bool $attended_field_trip
 * @property float|null $final_payment_amount
 * @property string|null $payment_token
 * @property string|null $order_id
 * @property string|null $payment_status
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * @property-read \App\Models\Course $course
 */
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


    public function submissions(): HasMany
    {
        return $this->hasMany(StudentSubmission::class, 'user_id', 'user_id');
    }

    public function certificate(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }
}
