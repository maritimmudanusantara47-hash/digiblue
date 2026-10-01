<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizQuestion extends Model
{
    protected $fillable = ['content_id', 'question_text', 'weight_score'];

    public function content(): BelongsTo
    {
        return $this->belongsTo(CourseContent::class, 'content_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuizOption::class, 'question_id');
    }
}
