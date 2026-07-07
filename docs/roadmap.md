# Roadmap

This roadmap defines the approved direction and sequencing. It is not a commitment to exact release dates.

## Completed

### Foundation

- Laravel API foundation
- Next.js frontend foundation
- Monorepo structure
- API versioning under `/api/v1`

### Multi-Tenancy

- Shared database, shared tables
- Header-based tenant resolution through `X-Tenant-ID`
- Tenant validation middleware
- Active tenant enforcement
- Tenant scope hardening
- Fail-closed tenant context

### IAM Foundation

- Global users
- Tenant memberships
- Tenant-scoped roles
- Global permissions
- Membership role assignment
- Role permission assignment
- Default role and permission seeding
- Authorization service foundation

### Authentication Foundation

- Sanctum SPA authentication direction
- Membership-aware login
- Current user endpoint concept
- Tenant invitation foundation
- Password reset integration
- Platform Super Admin separation
- Active membership middleware
- Audit hooks

### Student Learning Foundation

- Manual course enrollment records
- Lesson progress records
- Derived course completion records
- Student-owned progress updates
- Instructor progress visibility for assigned courses
- Tenant-scoped learning isolation

### Course Access Foundation

- Course access rules
- Lesson access rules
- Centralized access evaluation service
- Self-enrollment and invite-only access flags
- Single prerequisite lesson foundation
- Scheduled and drip access foundations
- Tenant-scoped access rule isolation

### Quiz Foundation

- Lesson-scoped quizzes
- Quiz questions and options
- Student quiz attempts
- Automatic grading
- Best-score quiz results
- Attempt limit enforcement
- Lesson access integration for quiz attempts

### Assignments Foundation

- Lesson-scoped assignments
- Student submissions
- Submission file references
- Instructor grading and feedback
- Assignment results
- Lesson access integration for submissions
- Course completion synchronization on grading

### Certificates Foundation

- Certificate templates
- Course certificate rules
- Eligibility evaluation from completion, quiz, and assignment outcomes
- Idempotent issued certificates
- Certificate revocation
- Public-safe certificate verification
- Student and instructor certificate visibility

### Analytics And Reporting Foundation

- Tenant-scoped analytics aggregate tables
- Course, learner, quiz, assignment, and video analytics records
- Immutable analytics snapshots
- Analytics job tracking records
- Aggregation services from existing LMS activity tables
- Role-scoped analytics API access

### Notifications And Communication Foundation

- Tenant-scoped notification templates, preferences, notifications, deliveries, and events
- In-app notification state with read and archived lifecycle
- User-owned notification preferences for in-app and future email delivery records
- Tenant owner/admin template management
- Idempotent notification event recording from existing learning, assessment, certificate, invitation, and password reset modules
- No forums, chat, messaging, live classes, frontend UI, external providers, SMS, WhatsApp, push notifications, marketing campaigns, or AI notification features

### Discussion And Community Foundation

- Tenant-scoped discussion threads, posts, participants, and reports
- Threaded replies with parent-post hierarchy
- Course, lesson, and general thread types with access evaluation integration
- Thread lifecycle: active, locked, pinned, archived
- Post lifecycle: active, hidden, deleted with soft-delete
- Moderation: hide/restore posts, report/resolve/dismiss reports
- Participation tracking and unread state
- Reporter identity protection in report responses
- Role-scoped authorization: owners/admins, instructors, students
- No chat, realtime messaging, live rooms, social feed, reactions, gamification, notification changes, AI moderation, or frontend UI

### Audit Logs And Activity Tracking Foundation

- Tenant-scoped audit logs with before/after change tracking and actor capture
- Lightweight append-only activity logs for learner and instructor events
- Platform audit logs for platform admin actions
- Sensitive value redaction (passwords, tokens, secrets, webhook secrets)
- Immutable audit records and append-only activity records
- Role-scoped query access: owners/admins all, instructors assigned courses, students own activity
- Instructor course-entity query scoping
- Platform super admin platform audit log access
- Audit logs are never authorization sources
- No analytics changes, notifications changes, billing, discussions changes, realtime tracking, AI monitoring, SIEM integrations, or frontend UI

## Next Phase: Platform Bootstrap

Goal: create and provision new academy tenants.

Scope:

- academy creation flow
- tenant provisioning service
- owner creation
- owner membership creation
- default roles and permissions
- default settings
- default domain reservation
- setup wizard state

No LMS content features should be included in this phase.

## Phase: Setup Wizard

Goal: guide tenant owner through first-run setup.

Sections:

- academy profile
- timezone and language
- branding
- logo and theme
- notification defaults
- learning defaults
- video defaults
- storage defaults

## Phase: Tenant Settings

Goal: implement modular tenant settings.

Planned structure:

```text
tenant_settings
  tenant_id
  group
  values jsonb
```

Groups:

- `profile`
- `branding`
- `locale`
- `email`
- `notifications`
- `video`
- `storage`
- `enrollment`
- `setup`

## Phase: Core LMS

Goal: implement learning content and enrollment.

Planned modules:

- courses
- lessons
- modules/sections
- enrollments
- student dashboard
- instructor dashboard

## Phase: Assessment

Goal: add quizzes and learner evaluation.

Planned modules:

- quizzes
- questions
- attempts
- grading
- completion rules

## Phase: Media And Bunny Integration

Goal: production-ready file and video handling.

Planned work:

- Bunny Storage integration
- Bunny Stream integration
- tenant media library
- video upload flow
- video processing status
- signed/authorized playback
- storage and video usage tracking

## Phase: Certificates

Goal: issue certificates based on completion rules.

Planned work:

- certificate templates
- certificate issuance
- certificate storage
- public verification links

## Phase: Custom Domains

Goal: support tenant branded domains.

Planned work:

- platform subdomains
- custom domain submission
- DNS verification
- SSL status tracking
- primary domain selection

## Phase: Billing And Plans

Goal: monetize tenant access and usage.

Planned concepts:

- plans
- plan features
- subscriptions
- invoices
- usage records
- plan limits
- entitlement checks

Potential plan dimensions:

- users
- courses
- storage
- video streaming
- certificates
- custom domains
- reports
- integrations
- SSO

## Phase: Reports And Analytics

Goal: operational and learning analytics.

Future planned work:

- tenant usage snapshots
- learner progress reports
- course completion reports
- instructor performance reports
- billing usage reports
- dashboard widgets
- exports and scheduled reports
- BI integrations
- cohort and retention analytics

## Phase: Enterprise Readiness

Goal: support larger customers.

Planned work:

- Google login
- Microsoft login
- SAML/OIDC SSO
- SCIM provisioning
- audit log exports
- advanced roles
- custom branding packages

## Development Workflow

- Create a design before implementation for major platform areas.
- Wait for approval before coding large architectural changes.
- Keep migrations minimal and intentional.
- Add tests with backend behavior changes.
- Run `php artisan test` for backend changes.
- Run frontend lint/build for frontend changes.
- Keep unrelated refactors out of feature work.

## Git Branching Workflow

- Never work directly on `main`.
- Use `feature/<area-name>` for new work.
- Use `fix/<issue-name>` for bug fixes.
- Use `hotfix/<issue-name>` for urgent production fixes.
- Use `release/<version>` for release stabilization.
- Keep pull requests scoped to one product or architecture area.
- Merge only after review and verification.
