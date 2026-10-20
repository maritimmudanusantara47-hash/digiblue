<?php

use App\Models\Course;
use App\Models\CourseContent;
use App\Models\CourseSection;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $foundation = Course::where('slug', 'like', '%foundation%')->first();
        if (!$foundation) {
            return;
        }

        $section = CourseSection::where('course_id', $foundation->id)->first();
        if (!$section) {
            return;
        }

        // Cek apakah konten oral exam sudah ada
        $exists = CourseContent::where('section_id', $section->id)
            ->where('content_type', 'oral_video_task')
            ->first();

        $instructionText = "### Oral Exam: Case Study (English or Indonesia)\n\n" .
            "#### Oral Examination Instructions:\n" .
            "1. **Record your answers** by creating a video explanation.\n" .
            "2. **Deliver your explanation** in either Indonesian or English.\n" .
            "3. **Ensure the video duration** is between 3–5 minutes.\n" .
            "4. **Upload your video** to Google Drive or YouTube (can be set to *Unlisted* or *Public*).\n" .
            "5. **Set link permissions** to *\"Anyone with the link can view\"* (if using Google Drive) so assessors can review and watch your submission.\n" .
            "6. **Copy and paste** your video URL link in the submission form below.\n\n" .
            "---\n\n" .
            "### Case Study Details\n" .
            "**Case Title:** Plastic Waste Pollution in Indonesian Coastal Waters and Its Impact on Marine Ecosystems (2026)\n\n" .
            "#### Case Description:\n" .
            "Indonesia is known as one of the world’s largest maritime countries with rich marine biodiversity and extensive coastal resources. However, marine pollution, especially plastic waste, has become a serious environmental challenge in many coastal areas across Indonesia.\n\n" .
            "In early 2026, large amounts of plastic waste were found floating and accumulating along several coastal regions, including Jakarta Bay, Bali, and parts of Sulawesi. Environmental organizations reported that the waste came from household garbage, tourism activities, fishing operations, and poor waste management systems.\n\n" .
            "Marine scientists warned that plastic pollution could threaten marine ecosystems and biodiversity. Sea animals such as turtles, fish, dolphins, and seabirds may accidentally consume plastic waste or become trapped in it. In addition, microplastics have also been detected in fish and seafood consumed by humans.\n\n" .
            "The problem has raised concerns among environmental activists, researchers, and local communities because Indonesia’s coastal economy highly depends on fisheries, tourism, and marine resources. Many experts believe that stronger cooperation between government, industries, and society is needed to reduce marine pollution and protect ocean sustainability.\n\n" .
            "#### Questions to Address:\n" .
            "**A. Critical Understanding**\n" .
            "1. Explain why plastic waste in the ocean is considered a serious environmental issue for Indonesia.\n" .
            "2. Describe how plastic pollution can affect marine animals and coastal ecosystems.\n\n" .
            "**B. Analytical Thinking**\n" .
            "3. Analyze how human activities contribute to the increase of plastic waste in marine environments.\n" .
            "4. Explain the possible relationship between poor waste management systems and the condition of Indonesia’s coastal waters.\n\n" .
            "**C. Evaluation and Reasoning**\n" .
            "5. In your opinion, who should be most responsible for reducing marine plastic pollution: government, industries, or society? Explain your reasoning.\n" .
            "6. Evaluate the impact of marine plastic pollution on Indonesia’s economy, especially in fisheries and tourism sectors.\n" .
            "7. Do you think public awareness about marine environmental protection in Indonesia is already sufficient? Why or why not?\n\n" .
            "**D. Problem Solving and Decision Making**\n" .
            "8. If you were an environmental policymaker, what steps would you take to reduce plastic pollution in coastal areas?\n" .
            "9. Propose three practical solutions that local communities can implement to help protect marine ecosystems from plastic waste.\n" .
            "10. Imagine you are part of a youth environmental organization. Create a short action plan to educate society about reducing plastic waste and protecting the ocean.";

        if (!$exists) {
            // Re-order existing field_study & critical_thinking
            CourseContent::where('section_id', $section->id)
                ->where('order_index', '>=', 6)
                ->increment('order_index');

            CourseContent::create([
                'section_id'       => $section->id,
                'content_type'     => 'oral_video_task',
                'title'            => 'Oral Exam: Case Study (English or Indonesia)',
                'instruction_text' => $instructionText,
                'max_score'        => 100,
                'is_prerequisite'  => false,
                'order_index'      => 6,
            ]);
        } else {
            $exists->update([
                'title'            => 'Oral Exam: Case Study (English or Indonesia)',
                'instruction_text' => $instructionText,
                'order_index'      => 6,
            ]);
        }
    }

    public function down(): void
    {
        $foundation = Course::where('slug', 'like', '%foundation%')->first();
        if ($foundation) {
            CourseContent::whereHas('section', fn($q) => $q->where('course_id', $foundation->id))
                ->where('content_type', 'oral_video_task')
                ->delete();
        }
    }
};
