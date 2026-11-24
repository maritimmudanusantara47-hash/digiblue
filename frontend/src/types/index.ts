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
  email_verified_at?: string | null;
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

export interface CourseSection {
  id: number;
  course_id?: number;
  title: string;
  order_index: number;
  contents: CourseContent[];
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
  sections_count?: number;
  sections?: CourseSection[];
}

// ─── Enrollment ──────────────────────────────────────────────────────────────
export type EnrollmentType = 'self_paid';

export type EnrollmentStatus =
  | 'payment_pending'
  | 'active'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface CourseBatch {
  id: number;
  course_id: number;
  batch_name: string;
  batch_code?: string | null;
  registration_start_date?: string | null;
  registration_end_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  in_class_learning_date?: string | null;
  exam_mcq_date?: string | null;
  exam_essay_start_date?: string | null;
  exam_essay_end_date?: string | null;
  exam_presentation_date?: string | null;
  field_trip_date?: string | null;
  certificate_issue_date?: string | null;
  is_active: boolean;
  enrollments_count?: number;
  course?: { id: number; title: string };
}

export interface Enrollment {
  id: number;
  user_id?: number;
  user: User;
  course_id?: number;
  course: Course;
  batch_id?: number | null;
  batch?: CourseBatch | null;
  enrollment_type: EnrollmentType;
  status: EnrollmentStatus;
  order_id?: string | null;
  final_payment_amount?: number | string | null;
  payment_status?: string | null;
  payment_token?: string | null;
  attended_field_trip: boolean;
  created_at: string;
}



// ─── Course Content ──────────────────────────────────────────────────────────
export type ContentType =
  | 'pdf_module'
  | 'video_embed'
  | 'mcq_quiz'
  | 'essay_task'
  | 'oral_video_task'
  | 'critical_thinking'
  | 'field_study';

export type AttachmentCategory = 'case_study_brief' | 'template' | 'example_guide' | 'additional';

export interface ContentAttachment {
  id: string;
  category: AttachmentCategory;
  title: string;
  file_name: string;
  file_path: string;
  url: string;
  file_size?: number;
  file_size_formatted?: string;
  extension?: string;
  created_at?: string;
}

export interface CourseContent {
  id: number;
  section_id: number;
  content_type: ContentType;
  title: string;
  file_path: string | null;
  attachments?: ContentAttachment[] | null;
  embed_url: string | null;
  instruction_text: string | null;
  content_body?: string | null;
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
  enrollment_id?: number;
  enrollment: Enrollment;
  user: User;
  serial_number: string;   // e.g. 'CBEC/ID/IX/20260166'
  serial_url_key: string;  // e.g. 'CBECIDIX20260166HBB'
  cbetc_reg_no?: string;
  grade: string;
  date_of_issue: string;
  place_of_issue: string;
  pdf_path: string;
  sync_status: SyncStatus;
  synced_at: string | null;
  created_at: string;
}

export interface UserNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  icon?: string | null;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
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
