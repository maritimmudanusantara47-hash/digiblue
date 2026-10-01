<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentSubmission;
use App\Models\CourseContent;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    /** Assessor/Admin: List semua submission yang perlu dinilai */
    public function index(Request $request): JsonResponse
    {
        $query = StudentSubmission::with(['user', 'content.section.course', 'gradedBy'])
            ->orderByDesc('created_at');

        // Filter by graded/pending status
        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'graded') {
                $query->whereNotNull('score');
            } elseif ($status === 'pending') {
                $query->whereNull('score');
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('content_type')) {
            $query->whereHas('content', fn($c) => $c->where('content_type', $request->content_type));
        }

        $perPage     = min((int) $request->get('per_page', 20), 100);
        $submissions = $query->paginate($perPage);

        return response()->json(['data' => $submissions]);
    }

    /** Student: List submission milik user sendiri */
    public function mySubmissions(Request $request): JsonResponse
    {
        $submissions = StudentSubmission::with(['content'])
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json(['data' => $submissions]);
    }

    /** Peserta: Submit jawaban kuis, esai, atau video */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content_id'    => 'required|exists:course_contents,id',
            'enrollment_id' => 'nullable|exists:enrollments,id',
            'essay_text'    => 'nullable|string',
            'video_url'     => 'nullable|url',
            // Frontend bisa pakai 'quiz_answers' atau 'mcq_answers'
            'quiz_answers'  => 'nullable|array',
            'mcq_answers'   => 'nullable|array',
        ]);

        $content = CourseContent::findOrFail($validated['content_id']);
        $user    = $request->user();

        // Cek sudah pernah submit
        $existing = StudentSubmission::where('user_id', $user->id)
            ->where('content_id', $content->id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Kamu sudah pernah mengumpulkan tugas ini.',
                'data'    => $existing,
            ], 409);
        }

        $score  = null;
        $status = 'submitted';

        // Normalisasi quiz_answers / mcq_answers → format { question_id: option_id }
        $quizAnswers = $validated['quiz_answers'] ?? $validated['mcq_answers'] ?? null;

        // quiz_answers dari frontend: [{question_id: X, option_id: Y}, ...]
        if (is_array($quizAnswers) && isset($quizAnswers[0]) && is_array($quizAnswers[0])) {
            $normalized = [];
            foreach ($quizAnswers as $a) {
                if (isset($a['question_id'], $a['option_id'])) {
                    $normalized[$a['question_id']] = $a['option_id'];
                }
            }
            $quizAnswers = $normalized;
        }

        // Jika MCQ: hitung skor otomatis
        if ($content->content_type === 'mcq_quiz' && !empty($quizAnswers)) {
            $score  = $this->autoGradeMcq($quizAnswers);
            $status = 'graded';
        }

        $submission = StudentSubmission::create([
            'user_id'     => $user->id,
            'content_id'  => $content->id,
            'essay_text'  => $validated['essay_text'] ?? null,
            'video_url'   => $validated['video_url'] ?? null,
            'score'       => $score,
            'status'      => $status,
        ]);

        $responseData = $submission->toArray();
        if ($content->content_type === 'mcq_quiz') {
            $responseData['correct_count'] = null; // bisa dihitung jika perlu
        }

        return response()->json([
            'message' => $content->content_type === 'mcq_quiz'
                ? "Kuis selesai! Skor kamu: {$score}"
                : 'Tugas berhasil dikumpulkan. Tunggu penilaian dari asesor.',
            'data'    => $responseData,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $submission = StudentSubmission::with(['user', 'content', 'gradedBy'])->findOrFail($id);
        return response()->json(['data' => $submission]);
    }

    /** Assessor/Admin: Beri nilai pada esai / video */
    public function grade(Request $request, int $id): JsonResponse
    {
        $submission = StudentSubmission::findOrFail($id);

        $validated = $request->validate([
            'score'             => "required|numeric|min:0|max:{$submission->content->max_score}",
            'assessor_feedback' => 'nullable|string|max:2000',
        ]);

        $submission->update([
            'score'             => $validated['score'],
            'assessor_feedback' => $validated['assessor_feedback'] ?? null,
            'graded_by'         => $request->user()->id,
            'graded_at'         => now(),
            'status'            => 'graded',
        ]);

        return response()->json([
            'message' => 'Penilaian berhasil disimpan.',
            'data'    => $submission->fresh(['user', 'gradedBy']),
        ]);
    }

    /** Hitung skor MCQ otomatis berdasarkan bobot tiap soal */
    private function autoGradeMcq(array $answers): float
    {
        if (empty($answers)) return 0;

        $questionIds = array_keys($answers);
        $questions   = QuizQuestion::with('options')->whereIn('id', $questionIds)->get();

        $totalWeight  = $questions->sum('weight_score');
        $earnedWeight = 0;

        foreach ($questions as $question) {
            $selectedOptionId = $answers[$question->id] ?? null;
            if (! $selectedOptionId) continue;

            $correctOption = $question->options->firstWhere('is_correct', true);
            if ($correctOption && (int)$selectedOptionId === $correctOption->id) {
                $earnedWeight += $question->weight_score;
            }
        }

        if ($totalWeight === 0) return 0;

        // Konversi ke skala 100
        return round(($earnedWeight / $totalWeight) * 100, 2);
    }
}
