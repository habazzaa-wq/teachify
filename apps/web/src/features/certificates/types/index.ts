export type CertificateTemplateStatus = "draft" | "active" | "archived";

export interface CertificateTemplateDesign {
  backgroundColor: string;
  accentColor: string;
  secondaryColor: string;
  titleText: string;
  subtitleText: string;
  bodyText: string;
  footerText: string;
  logoUrl: string | null;
  sealUrl: string | null;
  signatureName: string;
  signatureTitle: string;
  signatureImageUrl: string | null;
  instructorSignatureUrl: string | null;
  showQr: boolean;
  borderStyle: "classic" | "modern" | "minimal";
  fontFamily: "cairo" | "tajawal" | "noto";
  [key: string]: unknown;
}

export interface CertificateTemplate {
  id: number | string;
  tenant_id: number;
  name: string;
  slug: string;
  status: CertificateTemplateStatus;
  template_data: Partial<CertificateTemplateDesign> & Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CertificateRequirementType = "exam_bank" | "exam_link" | "project";

export interface CertificateRequirement {
  id: number;
  type: CertificateRequirementType;
  title: string | null;
  description: string | null;
  exam_id: number | null;
  exam_title?: string | null;
  exam_link: string | null;
  required_score: number | null;
  sort_order: number;
}

export interface CourseCertificateRule {
  id: number;
  course_id: number;
  certificate_template_id: number | null;
  enabled: boolean;
  require_course_completion: boolean;
  require_quiz_pass: boolean;
  require_assignment_pass: boolean;
  minimum_completion_percentage: number;
  show_instructor_signature: boolean;
  manager_signature_name: string | null;
  manager_signature_title: string | null;
  manager_signature_url: string | null;
  instructor_signature_url: string | null;
  template?: CertificateTemplate | null;
  requirements?: CertificateRequirement[];
}

export type CertificateApplicationStatus = "pending" | "approved" | "rejected" | "issued" | "cancelled";

export interface CertificateVerification {
  id: number;
  verification_code: string;
  verified_at?: string | null;
}

export interface CertificateSnapshot {
  course_title?: string | null;
  instructor_name?: string | null;
  student_name?: string | null;
  certificate_number?: string | null;
  reference_number?: string | null;
  verification_code?: string | null;
  issued_at?: string | null;
  design?: Partial<CertificateTemplateDesign> & Record<string, unknown>;
  manager_signature_name?: string | null;
  manager_signature_title?: string | null;
  manager_signature_url?: string | null;
  instructor_signature_url?: string | null;
  show_instructor_signature?: boolean;
  requirements?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface IssuedCertificate {
  id: number;
  tenant_id: number;
  course_id: number;
  course_completion_id: number;
  tenant_user_id: number;
  certificate_template_id: number | null;
  certificate_number: string;
  reference_number?: string | null;
  course_enrollment_id?: number | null;
  issued_at: string;
  status: "issued" | "revoked";
  show_instructor_signature?: boolean;
  snapshot_data?: CertificateSnapshot | null;
  metadata?: Record<string, unknown> | null;
  course?: { id: number; title: string; slug?: string } | null;
  student?: { id: number; user?: { id: number; name: string; email: string } | null } | null;
  template?: CertificateTemplate | null;
  verification?: CertificateVerification | null;
  completion?: { id: number; completion_percent: number; completed_at?: string | null } | null;
}

export interface CertificateApplication {
  id: number;
  tenant_id: number;
  course_id: number;
  course_enrollment_id: number;
  tenant_user_id: number;
  course_certificate_rule_id: number | null;
  certificate_template_id: number | null;
  issued_certificate_id: number | null;
  reviewed_by_tenant_user_id: number | null;
  status: CertificateApplicationStatus;
  progress_percent_at_apply: number;
  applied_at: string | null;
  reviewed_at: string | null;
  sent_at: string | null;
  student_note: string | null;
  admin_note: string | null;
  metadata?: Record<string, unknown> | null;
  submissions?: Record<string, string> | null;
  requirement_reviews?: Record<string, { status: string; note?: string | null }> | null;
  course?: { id: number; title: string; slug?: string } | null;
  student?: { id: number; user?: { id: number; name: string; email: string } | null } | null;
  template?: CertificateTemplate | null;
  issued_certificate?: IssuedCertificate | null;
  issuedCertificate?: IssuedCertificate | null;
  reviewer?: { id: number; user?: { id: number; name: string } | null } | null;
  enrollment?: { id: number; completion?: { completion_percent: number } | null } | null;
}

export interface CertificateRequirementStatus extends CertificateRequirement {
  title: string;
  met: boolean;
  detail: string | null;
  submission: string | null;
  manual_status: string | null;
  review_note?: string | null;
  score?: number | null;
}

export interface CertificateEligibility {
  enabled: boolean;
  has_issued_certificate: boolean;
  progress_percent: number;
  minimum_completion_percentage: number;
  completion_met: boolean;
  all_requirements_met: boolean;
  requirements: CertificateRequirementStatus[];
  reason: string | null;
  can_apply: boolean;
  submissions?: Record<string, string>;
  rule: CourseCertificateRule | {
    id: number;
    enabled: boolean;
    minimum_completion_percentage: number;
    template?: { id: number; name: string; status: string } | null;
  } | null;
  latest_application:
    | CertificateApplicationStatus
    | {
        id: number;
        status: CertificateApplicationStatus;
        progress_percent_at_apply: number;
        applied_at: string | null;
        reviewed_at: string | null;
        sent_at: string | null;
        admin_note: string | null;
        issued_certificate_id: number | null;
      }
    | null;
  issued_certificate: IssuedCertificate | null;
}

export const DEFAULT_CERTIFICATE_DESIGN: CertificateTemplateDesign = {
  backgroundColor: "#FFFDF8",
  accentColor: "#B8860B",
  secondaryColor: "#1F2937",
  titleText: "شهادة إتمام",
  subtitleText: "تشهد هذه المنصة بأن",
  bodyText: "قد أتم بنجاح متطلبات الدورة التدريبية",
  footerText: "نتمنى له دوام التوفيق والنجاح",
  logoUrl: null,
  sealUrl: null,
  signatureName: "",
  signatureTitle: "مدير المنصة",
  signatureImageUrl: null,
  instructorSignatureUrl: null,
  showQr: true,
  borderStyle: "classic",
  fontFamily: "cairo",
};
