# Architecture

This document is the technical source of truth for the LMS SaaS platform architecture.

## Stack

- Backend: Laravel 11
- API authentication: Laravel Sanctum
- Frontend: Next.js App Router with TypeScript
- Database: PostgreSQL
- Storage: Bunny Storage
- Video streaming: Bunny Stream
- Tenancy: shared database, shared tables
- API versioning: `/api/v1`

## Monorepo Layout

```text
apps/api   Laravel API
apps/web   Next.js application
docs       Product and architecture documentation
packages   Future shared packages
```

## Multi-Tenancy

The platform uses shared-database, shared-table multi-tenancy.

Tenant resolution is header-based:

```text
X-Tenant-ID: {tenant_id}
```

Backend flow:

```text
Request
  -> Read X-Tenant-ID
  -> Validate tenant exists
  -> Validate tenant status is active
  -> Bind tenant to request/container
  -> Authenticate user if route requires auth
  -> Validate active tenant membership if route requires tenant auth
  -> Authorize tenant-scoped permission
```

Rules:

- Tenant context is mandatory for tenant API requests.
- Invalid or inactive tenants are rejected.
- Missing tenant context must fail closed.
- Tenant-owned models use `tenant_id`.
- Eloquent tenant scope protects tenant-owned models.
- Raw database queries must explicitly filter by `tenant_id`.

## Identity And Access Management

Identity is global. Membership is tenant-scoped.

```text
users              global identities
tenant_users       tenant memberships
roles              tenant-scoped roles
permissions        global permission catalog
role_tenant_user   membership role assignments
permission_role    role permission assignments
```

Important rules:

- `users.tenant_id` must not exist.
- User email is globally unique.
- A user can belong to multiple tenants through `tenant_users`.
- Roles belong to tenants.
- Permissions are global.
- Role assignment is through tenant membership, not directly through users.

Default tenant roles:

- `tenant_owner`
- `admin`
- `instructor`
- `student`

## Platform Super Admin

Platform Super Admin is global and separate from tenant authorization.

```text
platform_admins
  user_id -> users.id
```

Rules:

- Platform Super Admin is not a tenant role.
- Platform authorization must not be mixed into tenant roles.
- Platform admin actions must be audited.
- Platform support access to a tenant should be explicit, reason-based, and logged.

## Authentication

Authentication uses Laravel Sanctum.

Primary browser strategy:

- Sanctum SPA cookie/session authentication
- CSRF cookie
- HTTP-only session cookie
- `withCredentials: true` on frontend requests
- `X-Tenant-ID` still required for tenant context

Login flow:

```text
Tenant header
  -> tenant is active
  -> find global user by normalized email
  -> verify password
  -> require active tenant_users membership
  -> create Sanctum session
  -> update membership last_accessed_at
```

Authentication is not sufficient for tenant access. Active membership is mandatory.

Current user response returns:

- global user
- current tenant
- current membership
- tenant roles
- tenant permissions

Password reset:

- Global by user email.
- Must not disclose tenant membership.
- Resets global credentials for all memberships.
- Active sessions and tokens are invalidated after reset.

## Invitation System

Invitations are tenant-scoped and email-normalized.

```text
tenant_invitations
tenant_invitation_role
```

Rules:

- Store normalized email.
- Prevent duplicate pending invitations for the same tenant and email.
- Store hashed invitation tokens only.
- Tokens are single-use.
- Invitations expire.
- Invitation statuses: `pending`, `accepted`, `revoked`, `expired`.
- Role assignment during invitation must use roles from the current tenant.
- Acceptance supports existing global users and new global users.

## Tenant Lifecycle

Tenant creation is a platform operation.

```text
Create tenant as provisioning
  -> create or find owner global user
  -> create owner membership
  -> create default roles
  -> attach permissions
  -> assign tenant_owner
  -> create default settings
  -> reserve default domain
  -> queue infrastructure provisioning
  -> mark tenant active
```

Tenant statuses:

- `provisioning`
- `active`
- `suspended`
- `inactive`
- `failed`

The tenant should only become active after required local database provisioning succeeds.

## Tenant Settings

Recommended settings architecture:

```text
tenant_settings
  tenant_id
  group
  values jsonb
```

Settings groups:

- `profile`
- `branding`
- `locale`
- `email`
- `video`
- `storage`
- `enrollment`
- `notifications`
- `setup`

This hybrid model keeps settings modular while allowing values to evolve without excessive early schema churn.

## Student Learning Foundation

Enrollment is independent from billing and payment systems. A student receives course access through a tenant-scoped `course_enrollments` record; future billing can grant or revoke enrollments without becoming the authorization model.

Learning ERD:

```text
tenants
  -> courses
  -> tenant_users

courses
  -> course_enrollments
  -> course_sections
  -> course_lessons

course_enrollments
  tenant_id
  course_id
  tenant_user_id
  status
  enrolled_at
  started_at
  completed_at
  cancelled_at
  metadata jsonb
  -> lesson_progress
  -> course_completions

lesson_progress
  tenant_id
  course_id
  course_section_id
  course_lesson_id
  course_enrollment_id
  status
  progress_percent
  started_at
  completed_at
  last_activity_at
  metadata jsonb

course_completions
  tenant_id
  course_id
  course_enrollment_id
  completion_percent
  completed_at
  metadata jsonb
```

Rules:

- Every learning table is tenant-scoped with `tenant_id`.
- One active enrollment is allowed per student per course.
- One lesson progress record is allowed per enrollment and lesson.
- One course completion record is allowed per enrollment and course.
- Completion is derived from lesson progress, not manually asserted by students.
- Students can view and update only their own enrollment progress.
- Instructors can view enrollments and progress only for courses they teach.
- Admins and tenant owners can manage enrollments and view completion records.
- Staff users are not automatically enrolled.

Future extension points:

- Billing or entitlement systems may create, suspend, or cancel enrollment records later.
- Completion calculation can adopt course-specific completion settings without changing table ownership.
- Certificates may consume `course_completions` in a future phase.
- Quizzes, assignments, discussions, notifications, analytics, and video playback remain separate future modules.

## Course Access Foundation

Access control is evaluated by the LMS application through `AccessEvaluationService`. It is separate from authentication, enrollment, billing, and streaming. Enrollment is one input to access decisions, not the only decision.

Access ERD:

```text
courses
  -> course_access_rules
  -> course_lessons

course_access_rules
  tenant_id
  course_id
  access_mode
  requires_approval
  allow_self_enrollment
  invite_only
  metadata jsonb

course_lessons
  -> lesson_access_rules

lesson_access_rules
  tenant_id
  course_id
  course_lesson_id
  access_mode
  available_from
  available_until
  prerequisite_lesson_id
  metadata jsonb
```

Course access modes:

- `private`: visible only to authorized tenant staff.
- `enrolled_only`: visible to active enrolled students and authorized staff.
- `public`: visible to tenant members; lesson access is still evaluated separately.

Lesson access modes:

- `inherit_course`: use the course access behavior.
- `public_preview`: accessible without enrollment unless the course itself is private.
- `enrolled_only`: active enrollment required.
- `scheduled`: course access plus availability window.
- `drip`: active enrollment required; metadata stores future drip configuration.

Rules:

- Every access rule table is tenant-scoped with `tenant_id`.
- Rule records must match the owning course and lesson hierarchy.
- Students cannot modify access rules.
- Instructors can manage access settings only for courses they teach and only when authorized.
- Admins and tenant owners can manage access rules.
- Media access must flow through `canAccessMedia()`, which delegates to lesson access until media-specific constraints are added.
- Media providers never decide access.

Future extension points:

- Billing or subscriptions may request access changes later, but must not replace the LMS access evaluator.
- Advanced drip scheduling can use `lesson_access_rules.metadata`.
- Complex prerequisite paths can extend from the single `prerequisite_lesson_id` foundation.
- Bunny Stream playback, certificates, quizzes, assignments, notifications, analytics, and gamification remain separate future modules.

## Quiz Foundation

Quizzes are backend assessment foundations attached directly to lessons. A quiz belongs to exactly one lesson, and a lesson may have at most one quiz. Quiz access for students must first pass lesson access evaluation through `AccessEvaluationService`.

Quiz ERD:

```text
course_lessons
  -> quizzes

quizzes
  tenant_id
  course_id
  course_section_id
  course_lesson_id
  title
  description
  passing_score
  max_attempts
  time_limit_minutes
  shuffle_questions
  shuffle_answers
  show_correct_answers
  status
  -> quiz_questions
  -> quiz_attempts
  -> quiz_results

quiz_questions
  tenant_id
  quiz_id
  type
  question_text
  points
  sort_order
  -> quiz_question_options

quiz_question_options
  tenant_id
  quiz_question_id
  option_text
  is_correct
  sort_order

quiz_attempts
  tenant_id
  quiz_id
  tenant_user_id
  started_at
  submitted_at
  status
  score
  -> quiz_attempt_answers

quiz_attempt_answers
  tenant_id
  quiz_attempt_id
  quiz_question_id
  selected_option_ids jsonb
  is_correct
  earned_points

quiz_results
  tenant_id
  quiz_id
  tenant_user_id
  best_score
  passed
  completed_at
```

Rules:

- Every quiz table is tenant-scoped with `tenant_id`.
- Quiz records must match the course, section, and lesson hierarchy.
- Question banks are not part of this foundation; questions belong directly to one quiz.
- Supported question types are `single_choice`, `multiple_choice`, and `true_false`.
- Quiz lifecycle statuses are `draft`, `published`, and `archived`.
- Students can attempt only published quizzes on lessons they can access.
- Students can view only their own quiz result.
- Attempt limits are enforced per quiz and tenant user.
- Automatic grading stores attempt answers and updates the best quiz result.
- Passing a quiz triggers course completion synchronization for the student's active enrollment.

Future extension points:

- Question banks can be introduced later without changing the direct quiz question foundation.
- Gradebooks, analytics, certificates, assignments, notifications, gamification, AI features, and frontend quiz pages remain future modules.
- More grading strategies can extend `QuizGradingService`.

## Assignments Foundation

Assignments are backend learning activity foundations attached directly to lessons. A lesson may have at most one assignment. Assignment access for students must pass lesson access evaluation through `AccessEvaluationService`, and assignment grading synchronizes course completion eligibility through `CompletionService`.

Assignment ERD:

```text
course_lessons
  -> assignments

assignments
  tenant_id
  course_id
  course_section_id
  course_lesson_id
  title
  description
  instructions
  max_score
  due_at
  allow_late_submission
  status
  -> assignment_submissions
  -> assignment_results

assignment_submissions
  tenant_id
  assignment_id
  tenant_user_id
  submitted_at
  status
  notes
  -> assignment_submission_files

assignment_submission_files
  tenant_id
  assignment_submission_id
  media_asset_id
  title
  sort_order

assignment_results
  tenant_id
  assignment_id
  tenant_user_id
  score
  passed
  feedback
  graded_by_tenant_user_id
  graded_at
```

Rules:

- Every assignment table is tenant-scoped with `tenant_id`.
- Assignment records must match the course, section, and lesson hierarchy.
- Students can submit only published assignments on lessons they can access.
- Students can access only their own submissions and results.
- Submission files reference existing tenant-owned media assets.
- Instructors can manage and grade assignments only for courses they teach.
- Assignment grading updates `assignment_results` and synchronizes course completion eligibility.

Future extension points:

- Gradebook aggregation, plagiarism detection, notifications, analytics, AI grading, discussions, frontend pages, and Bunny integrations remain future modules.
- More detailed rubric grading can extend `AssignmentGradingService`.
- Submission file storage workflows can integrate with future media/provider layers without changing assignment ownership.

## Certificates Foundation

Certificates are learner-specific historical records. Course certificate rules define eligibility, while issued certificates preserve immutable issuance history. The foundation does not generate PDFs, send email, render templates, create QR codes, or add blockchain verification.

Certificate ERD:

```text
courses
  -> course_certificate_rules
  -> certificate_templates

course_completions
  -> issued_certificates

certificate_templates
  tenant_id
  name
  slug
  status
  template_data jsonb

course_certificate_rules
  tenant_id
  course_id
  certificate_template_id
  enabled
  require_course_completion
  require_quiz_pass
  require_assignment_pass
  minimum_completion_percentage

issued_certificates
  tenant_id
  course_id
  course_completion_id
  tenant_user_id
  certificate_template_id
  certificate_number
  issued_at
  status
  metadata jsonb
  -> certificate_verifications

certificate_verifications
  tenant_id
  issued_certificate_id
  verification_code
  verified_at
```

Rules:

- Every certificate table is tenant-scoped with `tenant_id`.
- Issued certificates are unique per learner and course.
- Certificate numbers are globally unique and immutable.
- Issuance is idempotent and runs from `CompletionService`.
- Eligibility can require course completion, quiz pass, assignment pass, and minimum completion percentage.
- Revoked certificates remain stored as historical records.
- Public verification returns only validity, issued date, course title, learner display name, and certificate status.
- Students can view only their own certificates.
- Instructors can view certificates only for assigned courses.
- Tenant owners and admins can manage templates, rules, and revocation.

Future extension points:

- PDF generation, template editor UI, email delivery, QR codes, blockchain verification, analytics, billing, notifications, and frontend pages remain future modules.
- Template rendering can consume `certificate_templates.template_data`.
- Storage-backed certificate files can be added later without changing issuance history.

## Analytics And Reporting Foundation

Analytics records are tenant-scoped reporting aggregates generated from existing LMS activity tables. They are read models only and must never become authorization sources.

Analytics ERD:

```text
tenants
  -> analytics_snapshots
  -> course_analytics
  -> learner_analytics
  -> quiz_analytics
  -> assignment_analytics
  -> video_analytics
  -> analytics_jobs

courses
  -> course_analytics

tenant_users
  -> learner_analytics
```

Rules:

- Every analytics table is tenant-scoped with `tenant_id`.
- Aggregates are generated from enrollments, lesson progress, completions, quiz results, assignment results, and video playback sessions.
- Tenant owners and admins can view tenant-wide analytics.
- Instructors can view analytics only for assigned courses.
- Students can view only their own learner analytics.
- Analytics access must still pass through tenant membership, roles, and LMS access checks.
- Analytics must not include dashboards, charts, notifications, billing, recommendations, AI insights, or gamification in this foundation.

Future extension points:

- Dashboard widgets, exports, scheduled reports, BI integrations, cohort analytics, retention analytics, revenue analytics, instructor analytics, discussion analytics, and AI insights can consume these aggregates later.

## Notifications And Communication Foundation

Notifications are tenant-scoped communication records for in-app notification state and future delivery extensions. This foundation does not include discussion forums, chat, messaging, live classes, marketing campaigns, SMS, WhatsApp, push providers, AI notifications, frontend UI, or external email provider delivery.

Notification ERD:

```text
tenants
  -> notification_templates
  -> notification_preferences
  -> notifications
  -> notification_deliveries
  -> notification_events

tenant_users
  -> notifications
  -> notification_preferences

notifications
  tenant_id
  tenant_user_id
  type
  title
  body
  status
  priority
  data jsonb
  read_at
  -> notification_deliveries

notification_templates
  tenant_id
  slug
  name
  channel
  subject
  body
  variables jsonb
  is_system
  is_active

notification_preferences
  tenant_id
  tenant_user_id
  notification_type
  in_app_enabled
  email_enabled

notification_deliveries
  tenant_id
  notification_id
  channel
  status
  attempts
  last_attempt_at
  delivered_at
  last_error

notification_events
  tenant_id
  event_type
  event_key
  payload jsonb
  processed_at
  created_at
```

Rules:

- Every notification table is tenant-scoped with `tenant_id`.
- Notification statuses are `unread`, `read`, and `archived`.
- Notification priorities are `low`, `normal`, `high`, and `critical`.
- Delivery channels are limited to `in_app` and `email` records; no external provider is implemented in this foundation.
- Delivery statuses are `pending`, `processing`, `delivered`, and `failed`.
- Users can view, mark read, archive, and configure preferences only for their own tenant membership.
- Tenant owners and admins can manage tenant-scoped notification templates.
- Instructors and students can view only their own notifications.
- Cross-tenant notification and template access must return 404.
- Notification events are integration records only and must never become authorization sources.
- Notification payloads must strip sensitive fields such as passwords, tokens, and email addresses.

Integrated event emissions:

- `course.enrolled`
- `course.completed`
- `quiz.passed`
- `quiz.failed`
- `assignment.submitted`
- `assignment.graded`
- `certificate.issued`
- `invitation.created`
- `invitation.accepted`
- `password.reset.completed`

Future extension points:

- Email providers, push notifications, mobile notifications, SMS, WhatsApp, webhooks, marketing campaigns, and notification automation rules can consume the delivery and event foundations later.

## Discussion And Community Foundation

Discussions are tenant-scoped threaded conversation foundations attached to courses, lessons, or used as general tenant discussions. Discussion access for course and lesson threads must pass through `AccessEvaluationService`. This foundation does not include chat, realtime messaging, live rooms, video meetings, social feed, reactions, gamification, notification changes, AI moderation, or frontend UI.

Discussion ERD:

```text
tenants
  -> discussion_threads
  -> discussion_participants
  -> discussion_reports

courses
  -> discussion_threads

course_lessons
  -> discussion_threads

tenant_users
  -> discussion_threads
  -> discussion_posts
  -> discussion_reports

discussion_threads
  tenant_id
  course_id nullable
  course_section_id nullable
  course_lesson_id nullable
  created_by_tenant_user_id
  title
  type
  status
  is_pinned
  is_locked
  last_activity_at
  -> discussion_posts
  -> discussion_participants

discussion_posts
  tenant_id
  discussion_thread_id
  tenant_user_id
  parent_post_id nullable
  body
  status
  edited_at nullable
  deleted_at nullable
  -> discussion_reports

discussion_participants
  tenant_id
  discussion_thread_id
  tenant_user_id
  last_read_post_id nullable
  last_read_at nullable

discussion_reports
  tenant_id
  discussion_post_id
  reported_by_tenant_user_id
  reason
  note nullable
  status
  reviewed_by_tenant_user_id nullable
  reviewed_at nullable
```

Thread types: `course`, `lesson`, `general`.

Thread statuses: `active`, `closed`, `archived`.

Post statuses: `active`, `hidden`, `deleted`.

Report statuses: `pending`, `resolved`, `dismissed`.

Discussion supports threaded replies through `parent_post_id`.

Rules:

- Every discussion table is tenant-scoped with `tenant_id`.
- Discussion access must always go through `AccessEvaluationService` for course and lesson threads.
- Course thread requires course visibility access.
- Lesson thread requires lesson access.
- General thread requires tenant membership.
- Locked threads block new posts except moderators.
- Archived threads are read-only.
- Hidden or deleted posts are visible only to moderators.
- Students may edit and delete only their own posts.
- Moderation actions are audited through `AuditLogger`.
- Reports must not expose reporter identity to students.
- Cross-tenant discussion access returns 404.

Authorization:

- Tenant owners and admins have full moderation.
- Instructors moderate discussions for assigned courses only.
- Students participate only where lesson or course access exists.

Discussion services:

- `DiscussionThreadService`: create, update, archive, lock/unlock, pin/unpin threads.
- `DiscussionPostService`: create, edit, soft-delete posts and reply handling.
- `DiscussionModerationService`: reports, hide/restore posts, resolve/dismiss reports.
- `DiscussionParticipantService`: participation tracking and unread state.
- `DiscussionAccessService`: centralized access rules delegating to `AccessEvaluationService`.

Future extension points:

- Reactions, mentions, attachments, emojis, realtime updates, chat, AI moderation, discussion analytics, badges/gamification can consume the discussion foundations later.

## Audit Logs And Activity Tracking Foundation

Audit and activity logs are immutable, append-only tenant-scoped records of security-sensitive and learner/instructor events. Platform audit logs are separate records for platform admin actions. This foundation does not include analytics changes, notifications changes, billing, discussions changes, realtime tracking, AI monitoring, SIEM integrations, or frontend UI.

Audit ERD:

```text
tenants
  -> audit_logs
  -> activity_logs

platform_admins
  -> platform_audit_logs

tenant_users
  -> audit_logs
  -> activity_logs

users
  -> audit_logs

audit_logs
  tenant_id nullable
  tenant_user_id nullable
  user_id nullable
  event_type
  entity_type
  entity_id
  action
  old_values jsonb nullable
  new_values jsonb nullable
  metadata jsonb nullable
  ip_address nullable
  user_agent nullable

activity_logs
  tenant_id
  tenant_user_id
  activity_type
  entity_type
  entity_id
  metadata jsonb nullable

platform_audit_logs
  platform_admin_id
  event_type
  entity_type
  entity_id
  action
  metadata jsonb nullable
  ip_address nullable
  user_agent nullable
```

Audit log event examples:

- `course.created`, `course.updated`, `course.deleted`
- `quiz.created`, `quiz.updated`
- `assignment.graded`
- `certificate.issued`, `certificate.revoked`
- `discussion.moderated`
- `role.assigned`, `permission.updated`

Activity log event examples:

- `lesson.viewed`, `video.played`
- `quiz.started`, `quiz.completed`
- `assignment.submitted`
- `certificate.viewed`
- `discussion.posted`

Platform audit log event examples:

- `tenant.created`, `tenant.suspended`, `tenant.activated`, `tenant.owner.transferred`
- `platform_admin.created`
- `support.session.started`

Rules:

- Every tenant audit and activity record includes `tenant_id`.
- Audit logs are immutable; they never update, only insert.
- Activity logs are append-only.
- Sensitive values must be redacted before persistence: passwords, tokens, token hashes, secrets, and webhook secrets.
- Audit logs are never authorization sources; they are reporting records only.
- Cross-tenant audit and activity access must return only the requesting tenant's records.
- Platform audit logs are global and restricted to platform super admins.

Authorization:

- Tenant owners and admins view all tenant audit logs.
- Instructors view audit and activity only for entities belonging to assigned courses.
- Students view their own activity logs only.
- Platform super admins view platform audit logs.

Audit services:

- `AuditLogService`: recording audit events with before/after changes, actor tracking, sensitive value redaction, and platform-level events.
- `ActivityLogService`: lightweight learner and instructor activity recording.
- `AuditQueryService`: filtering, pagination, actor lookups, entity lookups, and instructor course scoping.

Integration requirements:

- Audit logging must integrate with existing modules by emitting logs only, without rewriting them:
  - IAM: role assignment, invitation accepted, membership suspended.
  - Courses: create, update, publish, archive.
  - Media: upload, delete.
  - Quizzes: create, update, attempt submitted.
  - Assignments: create, grade.
  - Certificates: issue, revoke.
  - Discussions: moderation actions.
  - Notifications: template changes.

Future extension points:

- Export audit reports, retention policies, compliance mode, legal hold, SIEM integrations, anomaly detection, and security monitoring can consume the audit and activity foundations later.

## Bunny Strategy

Bunny provisioning should be asynchronous and retryable.

Bunny Storage path convention:

```text
tenants/{tenant_id}/assets/
tenants/{tenant_id}/courses/
tenants/{tenant_id}/lessons/
tenants/{tenant_id}/certificates/
tenants/{tenant_id}/imports/
tenants/{tenant_id}/exports/
```

Bunny Stream strategy:

- Start with shared Bunny Stream library.
- Separate tenants using collections and metadata.
- Store `tenant_id`, `course_id`, and `lesson_id` in video metadata.
- Do not rely on Bunny paths alone for authorization.

Recommended future table:

```text
tenant_integrations
  tenant_id
  provider
  service
  status
  external_id
  config jsonb
  last_error
```

## Domain Strategy

The platform supports:

- Platform subdomains: `academy.example.com`
- Future custom domains: `academy-own-domain.com`

Recommended table:

```text
tenant_domains
  tenant_id
  domain
  type
  status
  is_primary
  verification_token
  verified_at
  ssl_status
  dns_checked_at
```

Domain resolution should map to tenant context, but internal API security remains header-based through `X-Tenant-ID`.

## Future Billing And Plans

Billing is future work and must stay separate from tenant authorization.

Recommended concepts:

```text
plans
plan_features
subscriptions
subscription_items
invoices
usage_records
```

Billing should control entitlements such as:

- user limits
- course limits
- storage quota
- video quota
- custom domain access
- advanced reports
- integrations

Authorization answers what a user may do. Billing answers whether the tenant has access to a feature or capacity.

## Security Principles

- Fail closed when tenant context is missing.
- Validate tenant before membership and authorization.
- Validate active membership on every authenticated tenant request.
- Keep platform admin global.
- Keep tenant roles tenant-scoped.
- Normalize emails.
- Rate-limit auth-sensitive routes.
- Audit security-sensitive actions.
- Avoid silent tenant fallbacks.
- Avoid raw queries unless tenant filters are explicit.
