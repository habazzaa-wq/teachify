# Product Blueprint

This document defines the product direction for the LMS SaaS platform.

## Product Vision

Build a multi-tenant LMS SaaS platform where academies can create, manage, sell, and deliver learning experiences under isolated tenant workspaces.

The platform must support long-term growth into:

- course delivery
- lessons and quizzes
- video learning
- certificates
- payments and subscriptions
- analytics and reports
- custom domains
- integrations
- enterprise SSO

## Users

### Platform Super Admin

Global operator of the SaaS platform.

Responsibilities:

- create tenants
- activate/suspend tenants
- manage platform admins
- view tenant usage
- view billing overview
- inspect audit logs
- inspect provisioning state
- support tenant issues with explicit audit logging

### Tenant Owner

Primary owner of an academy tenant.

Responsibilities:

- complete academy setup
- manage tenant admins
- manage instructors and students
- configure branding and settings
- manage subscription and billing in the future

### Admin

Tenant-scoped operator.

Responsibilities:

- invite users
- assign roles
- manage courses and enrollment
- view operational reports when available

### Instructor

Tenant-scoped teaching role.

Responsibilities:

- create and manage course content
- manage assigned learners
- review learning progress

### Student

Tenant-scoped learner role.

Responsibilities:

- access enrolled courses
- view progress
- complete lessons/quizzes
- receive certificates when available

## Product Modules

Completed foundations:

- project foundation
- multi-tenancy
- IAM foundation
- authentication foundation

Future LMS modules:

- academy bootstrap
- setup wizard
- course management
- lesson management
- quiz management
- student enrollment
- media library
- video streaming
- certificates
- reports
- payments
- subscriptions
- custom domains
- notifications
- integrations
- SSO

## Tenant Lifecycle

Academy creation flow:

```text
Platform Super Admin
  -> create academy
  -> create tenant
  -> create owner global user
  -> create owner membership
  -> create default roles
  -> attach default permissions
  -> assign tenant_owner
  -> create default settings
  -> reserve default domain
  -> mark tenant active
  -> owner completes setup wizard
```

## Initial Setup Wizard

The first tenant owner login should open an onboarding wizard when setup is incomplete.

Sections:

- academy information
- timezone
- language
- branding
- logo
- theme
- notification settings
- learning defaults
- video defaults
- storage defaults

Setup completion should be tracked independently from tenant active status.

## Tenant Settings

Settings groups:

- academy profile
- branding
- locale
- email
- notifications
- video
- storage
- enrollment
- setup progress

The approved direction is a modular JSONB settings table grouped by settings domain.

## Media Strategy

Documents, images, certificates, and exported files will use Bunny Storage.

Videos will use Bunny Stream.

The LMS application remains responsible for tenant authorization. Bunny paths and metadata are supporting structure, not the primary access-control layer.

## Domain Strategy

Supported domain phases:

1. Platform subdomains:
   - `academy.example.com`
2. Custom domains:
   - `academy-own-domain.com`

Custom domains require DNS verification, SSL lifecycle management, and audited activation.

## Billing Strategy

Billing is future work and should be entitlement-based.

Future plan dimensions:

- number of users
- number of courses
- storage quota
- video streaming quota
- custom domains
- certificates
- advanced reports
- integrations
- SSO

Billing must not replace authorization. A tenant may have permission to perform an action, but billing entitlements may still limit whether the feature or capacity is available.

## Product Principles

- Tenant isolation is non-negotiable.
- Global identity must support multi-tenant membership.
- Tenant experience should be branded and isolated.
- Platform operations must be auditable.
- External integrations must be retryable.
- Billing and authorization must remain separate.
