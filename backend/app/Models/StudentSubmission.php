<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'content_id',
        'essay_text',
        'video_url',
        'score',
        'assessor_feedback',
        'graded_by',
        'graded_at',
        'status',
    ];

    protected $casts = [
        'score'     => 'float',
        'graded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(CourseContent::class, 'content_id');
    }

    public function gradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}
