// ─── User & Auth ────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'assessor' | 'student';

export interface Role {
  id: number;
  name: UserRole;
  guard_name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  country?: string;
  institution?: string;
  roles: Role[];  // Dari Spatie Permission
  created_at: string;
}

export interface AuthResponse {
  data: {
    token: string;
    user: User;
  };
}

// ─── Certification & Course ──────────────────────────────────────────────────
export interface CertificationLevel {
  id: number;
  code: string; // 'FND' | 'SPEC'
  name: string; // 'Foundation Level' | 'Specialization Level'
  is_field_trip_required: boolean;
}

export interface Course {
  id: number;
  certification_level: CertificationLevel;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
}

// ─── Enrollment ──────────────────────────────────────────────────────────────
export type EnrollmentType =
  | 'self_paid'
  | 'scholarship_fully'
  | 'scholarship_partial_a'
  | 'scholarship_partial_b';

export type EnrollmentStatus =
  | 'pending_review'
  | 'payment_pending'
  | 'active'
  | 'completed'
  | 'rejected';

export interface Enrollment {
  id: number;
  user: User;
  course: Course;
  enrollment_type: EnrollmentType;
  status: EnrollmentStatus;
  attended_field_trip: boolean;
  created_at: string;
}

// ─── Scholarship ─────────────────────────────────────────────────────────────
export type ScholarshipDecision =
  | 'pending'
  | 'approved_fully'
  | 'approved_partial_a'
  | 'approved_partial_b'
  | 'rejected';

export interface ScholarshipApplication {
  id: number;
  enrollment: Enrollment;
  motivation_letter: string;
  document_url: string;
  decision_status: ScholarshipDecision;
  reviewer_notes: string | null;
  reviewed_by: User | null;
  created_at: string;
}

export interface ScholarshipAppeal {
  id: number;
  scholarship_application_id: number;
  reason: string;
  proposed_amount: number | null;
  supporting_document_url: string | null;
  final_agreed_amount: number | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_response_notes: string | null;
  created_at: string;
}

// ─── Course Content ──────────────────────────────────────────────────────────
export type ContentType =
  | 'pdf_module'
  | 'video_embed'
  | 'mcq_quiz'
  | 'essay_task'
  | 'oral_video_task'
  | 'critical_thinking';

export interface CourseContent {
  id: number;
  section_id: number;
  content_type: ContentType;
  title: string;
  file_path: string | null;
  embed_url: string | null;
  instruction_text: string | null;
  max_score: number;
  is_prerequisite: boolean;
  order_index: number;
}

export interface QuizQuestion {
  id: number;
  content_id: number;
  question_text: string;
  weight_score: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct?: boolean; // Only visible to admin/assessor
}

// ─── Submission & Assessment ──────────────────────────────────────────────────
export interface StudentSubmission {
  id: number;
  user_id: number;
  content_id: number;
  essay_text: string | null;
  video_url: string | null;
  score: number | null;
  assessor_feedback: string | null;
  graded_by: User | null;
  graded_at: string | null;
  created_at: string;
}

// ─── Certificate ─────────────────────────────────────────────────────────────
export type SyncStatus = 'synced' | 'failed' | 'pending';

export interface Certificate {
  id: number;
  enrollment: Enrollment;
  user: User;
  serial_number: string;   // e.g. 'CBEC/ID/IX/20260166'
  serial_url_key: string;  // e.g. 'CBECIDIX20260166HBB'
  grade: string;
  date_of_issue: string;
  place_of_issue: string;
  pdf_path: string;
  sync_status: SyncStatus;
  synced_at: string | null;
  created_at: string;
}

// ─── Generic API Response Wrapper ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}
