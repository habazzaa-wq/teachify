# API Contract — ExamAttemptAnswer with Image Pages + Manual Grading

> Phase B1 (Design only). This document describes the future wire shapes that
> Phase B2 (upload authorization) and Phase E (teacher grading UI) must target.
> It is **not** an implementation — no endpoints exist yet for these fields.

---

## 1. Scope

This contract extends the existing `ExamAttemptAnswer` resource with:

- **`answer_mode`** — `text` (default) vs `image_pages`.
- **`grading_status`** — a lifecycle state machine for how the answer is scored.
- **`manual_score`** / **`feedback`** / **`graded_by`** / **`graded_at`** — the
  teacher's manual grade and its audit trail.
- **`pages`** — a nested ordered array of photographed answer pages (image mode).

Nothing in this change alters the **MCQ / true-false / numeric** questions: those
keep producing `is_correct` + `earned_points` via auto-grading and remain
unaffected (see §5 and §6).

---

## 2. Grading status state machine

`grading_status` on `ExamAttemptAnswer`:

| Status | Meaning |
| ------ | ------- |
| `auto_graded` | Scored automatically (all existing MCQ-style answers; also the default for any answer that isn't in the manual pipeline). |
| `pending_manual_review` | A human-authored answer (essay/short_answer) awaiting teacher grading. `is_correct` is **NULL** here. |
| `partially_graded` | Teacher has graded and awarded points, but a further review/edit is expected. |
| `graded` | Teacher final; `manual_score` authoritative. |

**Mapping vs existing fields (not new values on a cache, but new columns):**

- `auto_graded` applies to everything that currently computes
  `is_correct` + `earned_points`. It **does not replace** `is_correct`; it records
  the *source* of the score.
- `pending_manual_review` / `partially_graded` / `graded` apply **only** to
  `essay` / `short_answer` answers that enter the manual pipeline (Phase B2 decides
  exactly when an essay is routed to manual review instead of auto-grading).

**Score source invariant (critical):**

> An essay answer **never** receives `is_correct = false` / `earned_points = 0`
> at save time. When an essay enters manual review, `is_correct` stays `NULL` and
> `earned_points` is left untouched by auto-grading. Zero is only represented by
> an explicit `manual_score = 0` once a teacher actually grades it. This is
> enforced in `ExamSessionService::saveAnswer()` (Phase B2), **not** silently by
> the migration defaults (`auto_graded`).

---

## 3. `ExamAttemptAnswer` API resource

### Before (current shape, unchanged for MCQ)

```jsonc
{
  "id": "42",
  "examAttemptId": "7",
  "examQuestionId": "99",
  "questionId": "501",
  "answer": ["a", "b"],          // list of option ids, or string, or null
  "isCorrect": true,             // or null
  "earnedPoints": 5,             // integer
  "answeredAt": "2026-09-08T10:00:00Z"
}
```

### After (with pages + grading fields)

```jsonc
{
  "id": "42",
  "examAttemptId": "7",
  "examQuestionId": "99",
  "questionId": "501",

  // Existing fields (MCQ semantics preserved):
  "answer": ["a", "b"],          // list of option ids / string / null
  "isCorrect": true,             // NULL while pending manual review on essays
  "earnedPoints": 5,             // auto-graded points; 0 for manual-review when ungraded
  "answeredAt": "2026-09-08T10:00:00Z",

  // NEW — capture mode
  "answerMode": "text",          // "text" | "image_pages"

  // NEW — grading lifecycle
  "gradingStatus": "auto_graded",// "auto_graded" | "pending_manual_review" | "partially_graded" | "graded"

  // NEW — manual grade (teacher only)
  "manualScore": 4.0,            // number | null
  "feedback": "Well argued.",    // string | null

  // NEW — grader identity + audit (teacher only; hidden from students)
  "gradedBy": {
    "id": "18",
    "name": "Sara M."
  },
  "gradedAt": "2026-09-12T14:33:00Z",

  // NEW — image pages (present only when answerMode === "image_pages")
  "pages": [
    {
      "id": "301",
      "mediaAsset": {
        "id": "91",
        "cdnUrl": "https://.../page1.png",
        "width": 3024,
        "height": 4032,
        "mimeType": "image/png"
      },
      "pageOrder": 1,
      "capturedAt": "2026-09-08T09:59:40Z"
    },
    {
      "id": "302",
      "mediaAsset": {
        "id": "92",
        "cdnUrl": "https://.../page2.png",
        "width": null,
        "height": null,
        "mimeType": "image/jpeg"
      },
      "pageOrder": 2,
      "capturedAt": "2026-09-08T09:59:55Z"
    }
  ]
}
```

---

## 4. Nested `pages[]` array shape

Each element:

| Field | Type | Always? | Notes |
| ----- | ---- | ------- | ----- |
| `id` | string | yes | `exam_attempt_answer_pages.id` |
| `mediaAsset.id` | string | yes | FK → `media_assets` |
| `mediaAsset.cdnUrl` | string\|null | yes | resident URL (via existing media serving/proxy) |
| `mediaAsset.width` | number\|null | no | nullable — unknown dimensions tolerated |
| `mediaAsset.height` | number\|null | no | nullable |
| `mediaAsset.mimeType` | string\|null | yes | |
| `pageOrder` | number | yes | 1-based; ascending per answer |
| `capturedAt` | string\|null | no | client-reported capture time (not server upload time) |

Ordering is guaranteed by the `pageOrder` field; the array is emitted ascending.

---

## 5. Field visibility matrix (student vs teacher)

### Student-facing (student session / results review)

- `id`, `examAttemptId`, `examQuestionId`, `questionId`
- `answer`, `answerMode`
- `isCorrect`, `earnedPoints` (only meaningful for auto-graded; `NULL` for pending essays; students do **not** see manualScore as a separate concept)
- `answeredAt`
- `pages[].mediaAsset.cdnUrl` + dimensions + `pageOrder` + `capturedAt` (the student must see their own uploaded pages to review them)
- `gradingStatus` (surfaced lightly, e.g. "awaiting teacher review")

**Hidden from students:**

- `manualScore` — replaced by the plain `earnedPoints` figure for display; do not expose the raw manual figure separately.
- `feedback` — a teacher-authored note **may** be surfaced to the student **if** the product decides so (open question); the default recommendation is to hide it until Phase E confirms.
- `gradedBy` identity (name/id) — **must not** leak to students.
- `gradedAt` — optional; hide by default.

### Teacher-facing (grading UI, Phase E)

Everything from the student shape **plus**:

- `manualScore`
- `feedback`
- `gradedBy` (TenantUser id + name)
- `gradedAt`

Teacher authorization is enforced at the controller/policy layer (Phase B2/E)
using the existing `ExamAttemptPolicy` patterns; the resource conditionally
includes the manual fields based on the request actor's role.

---

## 6. Guarantees that protect existing MCQ auto-grading

- All new columns are **empty/null for existing and any MCQ-style answers** —
  `answerMode` defaults to `text`, `gradingStatus` defaults to `auto_graded`.
- The auto-grade computation lives in `ExamGradingService::grade()` (and the
  per-one-answer path in `ExamSessionService::saveAnswer()`), reading only
  `answer`, `is_correct`, `earned_points`. They do not spread the new columns, so
  adding them cannot change MCQ results.
- Eloquent's `ExamAttemptAnswer` casts map the new string columns; there is no
  enum class constraining them, matching the repo's existing string-column
  convention (no native DB `enum`s anywhere in `media_assets` / `exam_attempts`).

---

## 7. Tenant scoping

All new models/tables reuse the existing `BelongsToTenant` trait + `TenantScope`,
identical to sibling tables (`media_asset_variants`, `assignment_submission_files`).
Every row carries `tenant_id`; composite FKs `(id, tenant_id)` ensure a page can
only reference a `MediaAsset`/`ExamAttemptAnswer` in the **same** tenant.

---

## 8. Notes for Phase B2 (upload auth) and Phase E

- B2 upload flow must set `answerMode = 'image_pages'`, create the
  `exam_attempt_answer` (or mark an existing one), and insert `pages` rows with
  increasing `page_order`; the unique `(tenant_id, answer_id, page_order)` index
  makes reorders explicit updates.
- E grading writes `manualScore`, `feedback`, `graded_by_tenant_user_id`,
  `graded_at`, and flips `grading_status → graded`, then triggers the
  recalculation documented separately (see `docs/PHASE_B1_RECALCULATION.md`).

---

## 9. Deferred

- Upload endpoints (Phase B2)
- Teacher grading endpoints + UI (Phase E)
- Student photo-capture UI
- MediaProxyController privacy enforcement (Phase C)