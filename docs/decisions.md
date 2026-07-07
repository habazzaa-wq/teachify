# Decisions

This document records approved architectural decisions. These decisions are locked unless explicitly revised in a future decision record.

## Locked Technical Stack

| Area | Decision |
| --- | --- |
| Backend | Laravel 11 |
| Frontend | Next.js App Router with TypeScript |
| Authentication | Laravel Sanctum |
| Database | PostgreSQL |
| Storage | Bunny Storage |
| Video | Bunny Stream |
| Tenancy | Shared database, shared tables |
| Tenant resolution | `X-Tenant-ID` header |

## Multi-Tenancy Decisions

- Use shared database and shared tables.
- Resolve tenant from `X-Tenant-ID`.
- Validate tenant existence and active status before binding tenant context.
- Reject invalid, inactive, or missing tenant context.
- Bind current tenant only after validation.
- Tenant-owned records use `tenant_id`.
- Eloquent global scopes guard tenant-owned model queries.
- Raw database queries remain a known risk and must explicitly filter by `tenant_id`.

## Identity Decisions

- `users` are global identities.
- `users.tenant_id` is forbidden.
- User email is globally unique.
- `tenant_users` represents tenant membership.
- Users can belong to multiple tenants.
- Membership status controls tenant access.
- `tenant_users.last_accessed_at` tracks activity.

## Authorization Decisions

- Roles are tenant-scoped.
- Permissions are global.
- Memberships receive roles through `role_tenant_user`.
- Roles receive permissions through `permission_role`.
- Default tenant roles are:
  - `tenant_owner`
  - `admin`
  - `instructor`
  - `student`
- Authorization must be checked against current tenant membership.

## Platform Super Admin Decisions

- Platform Super Admin is global.
- Platform Super Admin is not a tenant role.
- Platform authorization is separate from tenant authorization.
- Platform admin records belong outside tenant role tables.
- Platform support actions must be audited.

## Authentication Decisions

- Use Sanctum SPA cookie/session authentication for the web app.
- Tenant header remains required after authentication.
- Login authenticates global user by normalized email and password.
- Login must validate tenant is active.
- Login must validate membership is active.
- Inactive, missing, invited, or suspended memberships are rejected.
- Password reset is global by email.
- Password reset must not disclose tenant membership.
- Sessions and tokens are invalidated after password reset.

## Invitation Decisions

- Invitations are tenant-scoped.
- Invitation email is normalized before storage.
- Duplicate pending invitations are prevented per tenant and normalized email.
- Tokens are hashed at rest.
- Invitations are single-use.
- Supported invitation statuses:
  - `pending`
  - `accepted`
  - `revoked`
  - `expired`
- Invitations can activate existing users or create new global users.

## Tenant Lifecycle Decisions

- Tenant creation is a platform-level operation.
- Tenants should be created as `provisioning`.
- Local provisioning must create:
  - tenant
  - owner user
  - owner membership
  - default roles
  - default permissions assignment
  - default settings
  - default domain reservation
- Tenant should be marked `active` only after required local provisioning succeeds.
- External infrastructure provisioning should be asynchronous and retryable.

## Tenant Settings Decision

Use a modular JSONB settings structure:

```text
tenant_settings
  tenant_id
  group
  values jsonb
```

Reason:

- More maintainable than one large JSON blob.
- Less rigid than many early settings tables.
- Works well with PostgreSQL JSONB.
- Allows validation per settings group.

## Bunny Decisions

- Bunny Storage and Bunny Stream provisioning is future work.
- Provisioning should be asynchronous.
- Use tenant-based storage prefixes.
- Start Bunny Stream with shared library plus tenant collections/metadata.
- App/database authorization remains the source of truth.

## Domain Decisions

- Support platform subdomains first.
- Support custom domains later.
- Domains map to tenants but do not replace tenant validation.
- Header-based tenant resolution remains the internal API standard.

## Billing And Plans Decisions

- Billing is future work.
- Billing must not be mixed with role authorization.
- Plans define feature and capacity entitlements.
- Tenant subscriptions determine access to paid capabilities.
- Usage tracking should be asynchronous and aggregate-friendly.

## Development Workflow Decisions

- Work in feature branches.
- Do not work directly on `main`.
- Keep changes scoped to the requested layer.
- Do not change locked architecture without an explicit design approval.
- Backend changes require relevant tests.
- Frontend changes require lint/build verification when applicable.

## Git Branching Decision

- Current auth work branch: `feature/authentication`.
- Future work should use `feature/<area-name>`.
- Stabilization branches may use `release/<version>`.
- Hotfix branches may use `hotfix/<issue-name>`.
- Merge to `main` only after review and verification.
