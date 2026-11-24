<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseBatch extends Model
{
    protected $fillable = [
        'course_id',
        'batch_name',
        'batch_code',
        'registration_start_date',
        'registration_end_date',
        'start_date',
        'end_date',
        'in_class_learning_date',
        'exam_mcq_date',
        'exam_essay_start_date',
        'exam_essay_end_date',
        'exam_presentation_date',
        'field_trip_date',
        'certificate_issue_date',
        'is_active',
    ];

    protected $casts = [
        'registration_start_date' => 'date',
        'registration_end_date'   => 'date',
        'start_date'              => 'date',
        'end_date'                => 'date',
        'in_class_learning_date'  => 'date',
        'exam_mcq_date'           => 'date',
        'exam_essay_start_date'   => 'date',
        'exam_essay_end_date'     => 'date',
        'exam_presentation_date'  => 'date',
        'field_trip_date'         => 'date',
        'certificate_issue_date'  => 'date',
        'is_active'               => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'batch_id');
    }
}
