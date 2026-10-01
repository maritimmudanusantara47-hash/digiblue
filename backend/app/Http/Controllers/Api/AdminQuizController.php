<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseContent;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminQuizController extends Controller
{
    /** List semua soal untuk sebuah content MCQ */
    public function index(int $id): JsonResponse
    {
        $content = CourseContent::with('quizQuestions.options')->findOrFail($id);

        return response()->json(['data' => $content->quizQuestions]);
    }

    /** Tambah soal baru dengan opsi-opsinya */
    public function store(Request $request, int $id): JsonResponse
    {
        $content = CourseContent::findOrFail($id);

        $validated = $request->validate([
            'question_text' => 'required|string|max:2000',
            'weight_score'  => 'nullable|integer|min:1|max:100',
            'options'       => 'required|array|min:2|max:6',
            'options.*.option_text' => 'required|string|max:500',
            'options.*.is_correct'  => 'required|boolean',
        ]);

        // Pastikan tepat 1 jawaban benar
        $correctCount = collect($validated['options'])->where('is_correct', true)->count();
        if ($correctCount !== 1) {
            return response()->json(['message' => 'Harus ada tepat 1 jawaban yang benar.'], 422);
        }

        $question = QuizQuestion::create([
            'content_id'    => $content->id,
            'question_text' => $validated['question_text'],
            'weight_score'  => $validated['weight_score'] ?? 25,
        ]);

        foreach ($validated['options'] as $opt) {
            QuizOption::create([
                'question_id' => $question->id,
                'option_text' => $opt['option_text'],
                'is_correct'  => (bool) $opt['is_correct'],
            ]);
        }

        return response()->json([
            'message' => 'Soal berhasil ditambahkan.',
            'data'    => $question->load('options'),
        ], 201);
    }

    /** Update soal + opsi-opsinya */
    public function update(Request $request, int $id): JsonResponse
    {
        $question = QuizQuestion::with('options')->findOrFail($id);

        $validated = $request->validate([
            'question_text' => 'sometimes|string|max:2000',
            'weight_score'  => 'nullable|integer|min:1|max:100',
            'options'       => 'sometimes|array|min:2|max:6',
            'options.*.id'          => 'nullable|exists:quiz_options,id',
            'options.*.option_text' => 'required_with:options|string|max:500',
            'options.*.is_correct'  => 'required_with:options|boolean',
        ]);

        $question->update([
            'question_text' => $validated['question_text'] ?? $question->question_text,
            'weight_score'  => $validated['weight_score'] ?? $question->weight_score,
        ]);

        if (isset($validated['options'])) {
            // Pastikan tepat 1 jawaban benar
            $correctCount = collect($validated['options'])->where('is_correct', true)->count();
            if ($correctCount !== 1) {
                return response()->json(['message' => 'Harus ada tepat 1 jawaban yang benar.'], 422);
            }

            // Delete semua opsi lama & buat ulang
            $question->options()->delete();
            foreach ($validated['options'] as $opt) {
                QuizOption::create([
                    'question_id' => $question->id,
                    'option_text' => $opt['option_text'],
                    'is_correct'  => (bool) $opt['is_correct'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Soal berhasil diperbarui.',
            'data'    => $question->fresh('options'),
        ]);
    }

    /** Hapus soal */
    public function destroy(int $id): JsonResponse
    {
        $question = QuizQuestion::findOrFail($id);
        $question->options()->delete();
        $question->delete();

        return response()->json(['message' => 'Soal berhasil dihapus.']);
    }
}
