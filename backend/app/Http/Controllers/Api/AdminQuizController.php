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

    /**
     * Import soal MCQ dari PDF, TXT, JSON, atau naskah teks.
     */
    public function import(Request $request, int $id): JsonResponse
    {
        $content = CourseContent::findOrFail($id);

        if ($content->content_type !== 'mcq_quiz') {
            return response()->json(['message' => 'Konten ini bukan tipe MCQ Quiz.'], 422);
        }

        $rawText = $request->input('raw_text');
        $replaceExisting = $request->boolean('replace_existing', false);
        $parsedQuestions = [];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());

            if ($extension === 'json') {
                $jsonContent = file_get_contents($file->getRealPath());
                $decoded = json_decode($jsonContent, true);
                if (is_array($decoded)) {
                    $parsedQuestions = $this->normalizeJsonQuestions($decoded);
                }
            } elseif ($extension === 'pdf') {
                $extractedText = $this->extractTextFromPdf($file->getRealPath());
                $parsedQuestions = $this->parseQuestionsFromText($extractedText);
            } else {
                // txt or other plain text
                $plainText = file_get_contents($file->getRealPath());
                $parsedQuestions = $this->parseQuestionsFromText($plainText);
            }
        } elseif (!empty($rawText)) {
            $parsedQuestions = $this->parseQuestionsFromText($rawText);
        } elseif ($request->filled('questions') && is_array($request->input('questions'))) {
            $parsedQuestions = $this->normalizeJsonQuestions($request->input('questions'));
        }

        if (empty($parsedQuestions)) {
            return response()->json([
                'message' => 'Tidak ada soal yang berhasil dikenali. Pastikan format teks/PDF memiliki nomor soal (1., 2.), opsi (A, B, C, D), dan kunci jawaban (Kunci: A).',
            ], 422);
        }

        \DB::transaction(function () use ($content, $parsedQuestions, $replaceExisting) {
            if ($replaceExisting) {
                foreach ($content->quizQuestions as $existingQ) {
                    $existingQ->options()->delete();
                    $existingQ->delete();
                }
            }

            $count = count($parsedQuestions);
            $baseWeight = $count > 0 ? (int) floor(100 / $count) : 10;
            $remainder  = $count > 0 ? (100 - ($baseWeight * $count)) : 0;

            foreach ($parsedQuestions as $idx => $qData) {
                // Beri bobot agar total berjumlah 100 poin
                $weight = $baseWeight + ($idx < $remainder ? 1 : 0);

                $question = QuizQuestion::create([
                    'content_id'    => $content->id,
                    'question_text' => $qData['question'],
                    'weight_score'  => $weight,
                    'order_index'   => $idx + 1,
                ]);

                foreach ($qData['options'] as $oIdx => $opt) {
                    QuizOption::create([
                        'question_id' => $question->id,
                        'option_text' => $opt['option_text'],
                        'is_correct'  => (bool) $opt['is_correct'],
                        'order_index' => $oIdx + 1,
                    ]);
                }
            }
        });

        $totalQuestions = $content->quizQuestions()->count();

        return response()->json([
            'message' => "Berhasil mengimpor " . count($parsedQuestions) . " butir soal. Total soal sekarang: {$totalQuestions}.",
            'imported_count' => count($parsedQuestions),
            'data' => $content->fresh('quizQuestions.options')->quizQuestions,
        ]);
    }

    private function normalizeJsonQuestions(array $items): array
    {
        $normalized = [];
        foreach ($items as $item) {
            $questionText = $item['question'] ?? $item['question_text'] ?? null;
            $rawOptions = $item['options'] ?? [];
            if (!$questionText || empty($rawOptions)) continue;

            $options = [];
            $hasCorrect = false;
            foreach ($rawOptions as $opt) {
                if (is_array($opt)) {
                    $optText = $opt['option_text'] ?? $opt['text'] ?? $opt[0] ?? '';
                    $isCorrect = (bool) ($opt['is_correct'] ?? $opt[1] ?? false);
                } else {
                    $optText = (string) $opt;
                    $isCorrect = false;
                }
                if ($isCorrect) $hasCorrect = true;
                $options[] = ['option_text' => $optText, 'is_correct' => $isCorrect];
            }

            if (!$hasCorrect && !empty($options)) {
                $options[0]['is_correct'] = true;
            }

            $normalized[] = [
                'question' => $questionText,
                'options'  => $options,
            ];
        }
        return $normalized;
    }

    private function extractTextFromPdf(string $filePath): string
    {
        $content = file_get_contents($filePath);
        if ($content === false) {
            return '';
        }

        $text = '';
        if (preg_match_all('#stream[\r\n]+(.*?)[\r\n]+endstream#s', $content, $matches)) {
            foreach ($matches[1] as $stream) {
                $uncompressed = @gzuncompress($stream);
                if ($uncompressed === false) {
                    $uncompressed = @gzinflate($stream);
                }
                if ($uncompressed !== false) {
                    if (preg_match_all('#\((.*?)\)\s*(?:Tj|TJ|\')#s', $uncompressed, $textMatches)) {
                        $text .= implode(' ', $textMatches[1]) . "\n";
                    } elseif (preg_match_all('#\[(.*?)\]\s*TJ#s', $uncompressed, $tjMatches)) {
                        foreach ($tjMatches[1] as $tj) {
                            if (preg_match_all('#\((.*?)\)#s', $tj, $inner)) {
                                $text .= implode('', $inner[1]) . " ";
                            }
                        }
                        $text .= "\n";
                    }
                }
            }
        }

        if (empty(trim($text))) {
            $clean = preg_replace('/[^\x20-\x7E\r\n\t]/', ' ', $content);
            if (preg_match_all('/[a-zA-Z0-9\s.,?!:;\'"()\/\-]{10,}/', $clean, $cleanMatches)) {
                $text = implode("\n", $cleanMatches[0]);
            }
        }

        return $text;
    }

    private function parseQuestionsFromText(string $text): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $text);
        $questions = [];
        $currentQuestion = null;
        $currentOptions = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;

            // Header/Number: e.g. "1. Soal...", "Soal 1:", "1) ..."
            if (preg_match('/^(?:Soal\s*)?[\[\(]?(\d+)[\]\)\.\:\-]\s*(.+)$/i', $line, $qMatch)) {
                if ($currentQuestion && count($currentOptions) >= 2) {
                    $this->finalizeQuestion($questions, $currentQuestion, $currentOptions);
                }
                $currentQuestion = $qMatch[2];
                $currentOptions = [];
                continue;
            }

            // Key answer: e.g. "Kunci: A", "Jawaban: B", "Key: C"
            if (preg_match('/^(?:Kunci|Jawaban|Kunci Jawaban|Answer|Key)[\s\:\=]+([A-Da-d])/i', $line, $keyMatch)) {
                $correctLetter = strtoupper($keyMatch[1]);
                $optIndex = ord($correctLetter) - ord('A');
                foreach ($currentOptions as $k => &$opt) {
                    $opt['is_correct'] = ($k === $optIndex);
                }
                continue;
            }

            // Options: "A.", "A)", "*A.", "[A]"
            if (preg_match('/^(\*?)[\[\(]?([A-Da-d])[\]\)\.\:\-]\s*(.+)$/', $line, $optMatch)) {
                $isStarred = !empty($optMatch[1]);
                $optionText = trim($optMatch[3]);
                $currentOptions[] = [
                    'option_text' => $optionText,
                    'is_correct'  => $isStarred,
                ];
                continue;
            }

            // Append to question text
            if ($currentQuestion && empty($currentOptions)) {
                $currentQuestion .= ' ' . $line;
            }
        }

        if ($currentQuestion && count($currentOptions) >= 2) {
            $this->finalizeQuestion($questions, $currentQuestion, $currentOptions);
        }

        return $questions;
    }

    private function finalizeQuestion(array &$questions, string $qText, array $options): void
    {
        // Pastikan ada setidaknya 1 correct
        $hasCorrect = collect($options)->where('is_correct', true)->isNotEmpty();
        if (!$hasCorrect && count($options) > 0) {
            $options[0]['is_correct'] = true;
        }

        $questions[] = [
            'question' => $qText,
            'options'  => $options,
        ];
    }
}
