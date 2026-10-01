<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'certification_level_id',
        'title',
        'slug',
        'description',
        'price',
        'thumbnail_url',
        'is_active',
        'order_index',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price'     => 'decimal:2',
    ];

    public function certificationLevel(): BelongsTo
    {
        return $this->belongsTo(CertificationLevel::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('order_index');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }
}
