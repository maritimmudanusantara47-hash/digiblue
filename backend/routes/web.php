<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Storage fallback route for uploaded files (PDF modules, avatars, etc.)
Route::get('/storage/{path}', function (string $path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404, 'File not found');
    }

    return Storage::disk('public')->response($path);
})->where('path', '.*');
