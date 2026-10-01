<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseContent extends Model
{
    protected $fillable = [
        'section_id',
        'content_type',
        'title',
        'file_path',
        'embed_url',
        'instruction_text',
        'max_score',
        'is_prerequisite',
        'order_index',
    ];

    protected $casts = [
        'is_prerequisite' => 'boolean',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function quizQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class, 'content_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(StudentSubmission::class, 'content_id');
    }
}
