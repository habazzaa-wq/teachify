# Phase C — Open Questions (product decisions, unresolved)

> Tracks the open product questions Phase C deliberately left for humans to
> close before a wider rollout. Nothing in this document is decided; each item
> states the current behavior, why it matters, and who owns the call.
>
> References are `file:line` citations into `apps/api`.

---

## 1. `exams.grade` permission split — NOW ALSO RELEVANT TO PHASE E

**Status: UNRESOLVED.**

**What it is:** the Phase C teacher leg authorizes *every* exam-management and
exam-read action through the existing `ExamPolicy::update` gate
(`app/Policies/ExamAttemptPolicy.php:68` → `app/Policies/ExamPolicy.php:37-49`).
There is no dedicated `exams.grade` permission, so today the ability to *view*
answer pages and the ability to *manage/edit* an exam are the same predicate.

**Phase E dependency (added 2026-09-08):** the Phase E grading-save endpoint
(`ExamManualGradingController::grade`,
`app/Http/Controllers/Api/v1/ExamBank/ExamManualGradingController.php`) and the
pending-review queue (`pendingQueue`, same file) BOTH reuse that exact
`ExamPolicy::update` gate — the Phase C teacher leg, verbatim, with no new
permission added. If/when `exams.grade` is split out (e.g. a grading-only role
that can award points but not edit the exam), the split must be applied to
**three** call sites at once, or grading authorization and exam-management
authorization will silently diverge:

1. the Phase C teacher leg inside `ExamAttemptPolicy::viewPages`
   (`app/Policies/ExamAttemptPolicy.php:68`),
2. `ExamManualGradingController::grade` (same gate),
3. `ExamManualGradingController::pendingQueue` (same gate).

**Why it matters:** grading writes (points + feedback) are currently gated by
`exams.update`, which also grants full exam editing. Teams that want a
"grader" who cannot edit exams need a split permission; teams that are fine
with graders being exam editors can close this as "won't fix."

**Owner:** product owner / permission model owner. Do NOT resolve in a phase
that only needs the cyclic dependency noted.

---

## 2. Pagination of the Phase C pages list

**Status: UNRESOLVED.**

**What it is:** `ExamAnswerPageReadController::index` returns the full ordered
page list for one answer with no pagination
(`app/Http/Controllers/Api/v1/ExamBank/ExamAnswerPageReadController.php:110-122`).
An answer realistically has 1-5 photographed pages, so this was accepted as-is
for Phase C. It was NOT changed in Phase E either — the Phase E queue list
(`ExamManualGradingService::pendingReviewAnswers`, id-ordered, no pagination)
deliberately did not introduce a pagination policy for the same reason.

**Why it matters:** nothing today produces a large-enough page set to warrant a
cursor, but a queue endpoint that grows with the number of ungraded answers
across an exam WILL grow. If/when the exam has hundreds of pending answers, a
limit/cursor decision becomes necessary.

**Owner:** product owner + API owner. Out of scope for the backend-only
grading pass.

---

## 3. Signed-URL serving migration for answer pages

**Status: UNRESOLVED.**

**What it is:** the Phase C stream path proxies the bytes server-side
(`ExamAnswerPageReadController::show` /
`streamAsset`, lines 80-234): the API fetches from Bunny Storage with the
tenant's credential and pipes bytes to the client with `Cache-Control:
private, no-store`. The alternative — handing the client a short-lived signed
Bunny URL directly — was deliberately NOT implemented.

**Why it matters:** server-side proxying costs bandwidth through the API and
holds the connection open for the duration of the download; signed URLs would
offload that to the CDN but change the exposure model (client talks to Bunny
directly) and the invalidation story. Phase C chose the conservative
proxying path; the trade-off is untested at scale.

**Owner:** product owner / infra owner. Out of scope for the backend-only
grading pass.

---

## 4. Open questions NOT listed above (Phase E additions)

See the Phase E report (§8) for newly surfaced questions — in particular the
interaction between manual grading of in-progress attempts and the
auto-grading job at submit, and the two B1 product decisions (historical-essay
backfill `auto_graded` vs `pending_manual_review`; essay membership in the
practice pool) documented in `docs/PHASE_B1_RECALCULATION.md` §5.3 and §6.