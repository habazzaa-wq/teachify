# Phase B1 — Attempt Recalculation Design

> **Revision note (2026-09-08 correction pass):** this document is authored in
> the Phase B1 *correction pass*, where two gaps in the original B1 design were
> re-examined — the migration's handling of **existing rows** and the **locking**
> discipline for score recalculation. The pass is **docs-only**: no migration
> and no application code are modified by it. Where the text below refers to
> Phase B2 or Phase E work, that is the *target* of the requirement, not
> something implemented in this pass.
>
> All factual claims carry `file:line` citations. The live-DB verification
> result is reported in §5.4.

---

## 1. Scope

This design describes how an `ExamAttempt`'s stored totals (`score`,
`max_score`, `percentage`, `passed`) stay correct once a teacher manually
grades individual essay/short_answer answers.

Two distinct code paths exist today:

| Path | Server code | Recomputes attempt totals? |
| ---- | ----------- | -------------------------- |
| Auto-grading on submit | `ExamGradingService::grade()` (`app/Services/ExamBank/ExamGradingService.php:29`) | **Yes** |
| Per-answer save during the session | `ExamSessionService::saveAnswer()` (`app/Services/ExamBank/ExamSessionService.php:368`) | **No** — writes only the answer row |

There is **no** teacher manual-grading save route yet (that is Phase E per
`docs/PHASE_B1_API_CONTRACT.md` §8), so there is no manual-grading →
recalculation code path to lock in this pass. §4 therefore specifies the
locking **requirement** Phase E must satisfy, and cites the proven pattern
that already exists in the auto-grading path.

---

## 2. Current persisted shape

- `exam_attempt_answers` (create: `database/migrations/2026_07_10_100500_create_exam_attempts_table.php`'s sibling, `2026_08_02_000002_create_exam_attempt_answers_table.php`)
  holds one row per answered question: `answer` (json), `is_correct` (bool,
  nullable), `earned_points` (uint, default `0`), `answered_at`.
- `grading_status` (and `answer_mode` / `manual_score` / `feedback` /
  `graded_by_tenant_user_id` / `graded_at`) are added by
  `database/migrations/2026_09_08_000001_add_manual_grading_fields_to_exam_attempt_answers_table.php`.
- Question type is stored on `questions.type` (string; `2026_07_10_100100_create_questions_table.php:21`),
  values `single_choice`, `multiple_choice`, `true_false`, `numeric`, `essay`,
  `short_answer` (`app/Services/ExamBank/ExamSessionService.php:39`).
- Attempt totals live on `exam_attempts`: `score` / `max_score`
  (decimal 8,2), `percentage`, `passed`, `status`
  (`2026_07_10_100500_create_exam_attempts_table.php`, extended by
  `2026_08_02_000001_add_exam_session_fields_to_exam_attempts_table.php`).

---

## 3. Today's recalculation formula (as implemented)

This section documents the **current** formula exactly as implemented — it is
the baseline a Phase E recalculation must extend, and it is **not** modified
in this pass.

`ExamGradingService::grade()` (`app/Services/ExamBank/ExamGradingService.php:29-88`):

1. **Lock:** a single `DB::transaction` wraps everything (`grade()`, line 31);
   inside it the attempt row is re-read with `lockForUpdate()`
   (line 32) — the row is locked **before** the current state is read and the
   new totals are written. This is the pattern §4 requires Phase E to replicate.
2. **Per-question points** (lines 53-56):
   `points = max(0, examQuestion->points ?? question->points ?? 0)`.
3. **Answer scoring** (lines 63-71): `isCorrect = grader->grade(question, answer)`;
   `earnedPoints += isCorrect ? points : 0`; the store checks
   `is_correct !== isCorrect || earned_points !== points` before the
   `forceFill` + `save()`.
4. **Totals** (lines 74-85):
   - `percentage = totalPoints > 0 ? round(earnedPoints / totalPoints * 100, 2) : 0`
   - `score = earnedPoints`
   - `max_score = totalPoints`
   - `passed = percentage >= (int) exam->passing_score`
   - `status = 'submitted'`, plus `submitted_at` and `duration_seconds`.

Single-question scoring: `ExamAnswerGrader::grade()` (`app/Services/ExamBank/ExamAnswerGrader.php:14`)
returns `false` for `essay` and `short_answer` (line 20) — i.e. signed-in-era
essays are auto-scored as incorrect/`0`, which is exactly the historical
behavior §5 discusses.

### Known edge the formula must reconcile (not re-formulated here)

The current loop ignores `manual_score` / `grading_status` entirely. Phase E
must define how a `graded` essay's `manual_score` feeds into `score` /
`percentage`; **this pass does not change the formula** — it only fixes the
locking contract (§4) and states the open product decisions (§5.3, §6).

---

## 4. Locking on recalculation (Phase E requirement — NOT yet implemented)

### 4.1 Why locking

When a teacher's grading save triggers an attempt recalculation, the
`ExamAttempt` row must be locked for the duration of the whole
read-modify-write. Two graders saving different answers of the **same attempt**
concurrently must serialize on the attempt row; otherwise the second writer
recomputes totals from a stale value read before the first writer committed —
a classic lost update.

### 4.2 The proven pattern (where it already exists)

The auto-grading path already implements exactly this discipline:

- `ExamGradingService::grade()` wraps the entire read-modify-write in one
  `DB::transaction` (`app/Services/ExamBank/ExamGradingService.php:31`).
- The attempt is re-read with `lockForUpdate()` **inside** that transaction,
  before any state is read or written
  (`app/Services/ExamBank/ExamGradingService.php:32`).

The lock therefore wraps **both** the read of current attempt state **and** the
write of the recomputed `score`/`percentage`/`passed` — not just a final
`forceFill`/save. A `SELECT` without the lock, or a lock that only guards the
final save, would leave the race window open.

> **Important:** this citation is the *pattern*, not a claim that Issue 2 is
> already satisfied. `grade()` protects auto-grading of the *student submit
> path* — a different code path, where no competing manual-grade write exists.
> For the future per-answer teacher save it is a **design requirement**, not
> current behavior.

### 4.3 Requirement for Phase E (state since there is no code yet)

> Phase E must implement the **same lock-wraps-read-and-write discipline**
> around the future per-answer grading save + attempt recalculation: a single
> `DB::transaction` that (1) `lockForUpdate()`s the `ExamAttempt` row, (2)
> reads the current answers/totals, (3) writes the `manual_score` +
> `grading_status` on the answer, (4) recomputes and writes the attempt totals,
> and only then commits. This is a design requirement, **not yet implemented**.

### 4.4 Transaction-boundary fact (verified)

`ExamSessionService::saveAnswer()` (`app/Services/ExamBank/ExamSessionService.php:388-411`)
is a **single** transaction that only performs the per-answer upsert: it locks
the attempt (`lockAttempt`, line 389) and `updateOrCreate`s the answer row
(lines 394-406). It **never** recomputes attempt totals. So today there is
**no** shared "answer-save + attempt-recalculation" transaction to cite —
the two halves of Issue 2's premise do not coexist in the codebase, because the
manual-grading save does not exist yet. Phase E can therefore satisfy §4.3 with
one new transaction and does not need to inherit or merge saveAnswer's.

### 4.5 Edge case: two graders on the same attempt

> **Two graders save different answers on the same attempt concurrently.**
> Once Phase E implements §4.3, the two saves serialize on the `ExamAttempt`
> row lock: the first transaction holds the row lock for its full
> read-modify-write and commits; the second transaction's `lockForUpdate()`
> blocks until the first commits, then re-reads the **fresh** attempt state
> (including the first grader's committed score) before recomputing. The second
> grader's save therefore builds on the first's result instead of overwriting
> it — the lost-update race is eliminated. Without the lock, whichever
> transaction commits last would silently clobber the other's contribution to
> `score`/`percentage`.

---

## 5. Existing rows and the `grading_status` default

### 5.1 The default already covers non-essay rows

The migration adds `grading_status` with an **`auto_graded`** default
(`database/migrations/2026_09_08_000001_add_manual_grading_fields_to_exam_attempt_answers_table.php:35`):

```php
$table->string('grading_status', 32)->default('auto_graded')->after('answer_mode');
```

Consequence, verified by reading the migration: **every existing and every
future non-essay row receives `auto_graded` from the column default. No
backfill migration is needed** to keep existing MCQ / true-false / numeric
answers out of the manual pipeline. The original Issue 1 premise (that the
default was `pending_manual_review` and would mislabel existing MCQ rows) does
not match reality: the default is `auto_graded`.

### 5.2 `auto_graded` remains the default until Phase B2 opt-in

`pending_manual_review` / `partially_graded` / `graded` are **only** set when an
essay or short_answer answer actually enters the manual pipeline. The intended
trigger is the **Phase B2 save path** (`ExamSessionService::saveAnswer()`),
which must explicitly set `grading_status = 'pending_manual_review'` when
saving an essay/short_answer answer — exactly as the migration docblock
already states (`2026_09_08_000001...:23-27`):

> "The 'essay must never default to incorrect/zero' invariant is enforced by
> the Phase B2 save path (ExamSessionService::saveAnswer), not by this
> migration … This migration only adds the storage for that contract with
> defaults that preserve current behavior."

This confirms `auto_graded` as the default **until** B2 opts essays in; that
trigger is **not implemented in this pass** (docs-only).

### 5.3 OPEN PRODUCT DECISION — historical essay rows (backfill)

> **PRODUCT DECISION NEEDED**
>
> Every essay/short_answer answer saved **before** this feature existed was
> auto-scored `0` / `is_correct = false` under the old logic
> (`ExamAnswerGrader.php:20`). Under the §5.1 default, such rows are
> `auto_graded` with `earned_points = 0` — so **teachers cannot retroactively
> manually-grade historical essay answers** unless a future backfill migration
> specifically sets `grading_status = 'pending_manual_review'` for *existing
> essay/short_answer rows* (identified by **question type**, not by
> `grading_status`).
>
> **Question for the product owner:**
> *Should historical essay/short_answer answers be backfilled to
> `pending_manual_review` to allow retroactive grading, or left as
> `auto_graded` (zero score stands for anything answered before this feature
> existed)?*
>
> Trade-offs, with both options stated plainly:
>
> | Option | Effect | Risk |
> | ------ | ------ | ---- |
> | **(a) `auto_graded` (Recommended)** | Preserves today's semantics exactly — old essays read as scored `0`, no fabricated teacher grades; a teacher can still re-grade via the Phase E UI if reachable. | Retroactive grading needs an explicit per-attempt action; old zeros are not visible as "pending." |
> | **(b) `pending_manual_review`** | Old essays appear as "awaiting review," enabling a grading queue over historical attempts. | Silently changes the displayed result of old submissions (0 → "awaiting review") for every tenant that ever used essays. |
>
> **Recommended: `auto_graded`** — lower risk, zero behavior change — but this
> is a **recommendation for the human product owner to confirm**, not a
> decision this pass is authorized to finalize or implement. If (b) is chosen,
> plan one backfill migration:
>
> ```sql
> UPDATE exam_attempt_answers a
> JOIN questions q ON q.id = a.question_id
> SET a.grading_status = 'pending_manual_review'
> WHERE q.type IN ('essay', 'short_answer');
> ```

### 5.4 Verification query + live result

The check that no non-essay row is left as `pending_manual_review`:

```sql
SELECT COUNT(*) AS non_essay_pending_manual_review
FROM exam_attempt_answers a
JOIN questions q ON q.id = a.question_id
WHERE q.type NOT IN ('essay', 'short_answer')
  AND a.grading_status = 'pending_manual_review';
```

Reported result against the local `lms_saas` database
(`apps/api/.env`, MySQL):

| Check | Result |
| ----- | ------ |
| `grading_status` column present | **No** (`Schema::hasColumn` = `false`) |
| `exam_attempt_answers` row count | **0** |
| `2026_09_08_000001_add_manual_grading_fields…` | **Pending** (never applied — `migrate:status`) |
| `2026_09_08_000002_create_exam_attempt_answer_pages…` | **Pending** (never applied — `migrate:status`) |

The local environment therefore has no existing rows to mislabel — the "zero
MCQ rows left pending" guarantee holds trivially (0 rows). Once the migration
is applied to an environment containing pre-existing answers, re-run the query
above and require `non_essay_pending_manual_review = 0`.

### 5.5 Rollback note (for the migration's docblock when it is next touched)

`down()` drops all added columns including `grading_status`
(`2026_09_08_000001...:47-60`). On rollback, the backfill distinction (and any
Phase B2-assigned `pending_manual_review` values) is **lost by definition** —
the data no longer exists. This is acceptable: `down()` already deletes the
whole column, so no per-row state can survive a rollback. Stated explicitly so
this pass leaves no ambiguity.

---

## 6. Practice pool & manual grading — OPEN PRODUCT DECISION

> **☑ PRODUCT DECISION NEEDED — do not treat the current behavior as final.**
>
> `startPractice()` builds its "wrong answers" pool from
> `answers()->where('is_correct', false)` (`ExamSessionService.php:178-184`).
> Under that filter, a **manually-graded-correct essay** behaves exactly like a
> correctly-answered MCQ: it drops out of the practice pool. This pass leaves
> the implementation **as-is** and does not choose between the two policies
> below — the product owner must pick:
>
> **(a)** Manually-graded-correct essays are removed from the practice pool,
> same as MCQ — the current behavior.
>
> **OR**
>
> **(b)** Essay questions are always excluded from `startPractice` filtering
> regardless of grading outcome, because handwritten grading is fundamentally
> different from a right/wrong MCQ answer (an essay graded as "correct" is not
> a memorized fact the student has "mastered"; it may still deserve practice).
>
> Note for whoever closes this: option (b) is a change to
> `ExamSessionService::startPractice()`'s filter, which is **out of scope for
> this docs-only pass**. Also note the SQL nuance — `where('is_correct', false)`
> already excludes both `NULL` (pending essays) and `true`; only a definitively
> graded-*wrong* essay enters the pool today.

---

## 7. Pass verdict

- **Docs:** closed — this document now states the current formula (§3), the
  locking requirement for Phase E with the proven pattern (§4), the
  default-directed facts about existing rows (§5.1-5.2), the two open product
  decisions (§5.3, §6), and the verification baseline (§5.4).
- **Code/migrations:** intentionally **untouched** in this pass, per scope.
  Remaining **open** items for later phases: the historical-essay backfill
  decision (§5.3 — recommended `auto_graded`), Phase B2's
  `pending_manual_review` trigger (§5.2), Phase E's per-answer grading save
  with the §4.3 lock, and the §6 practice-pool product call.

---

### Appendix A — exact citations used above

| Claim | File:line |
| ----- | --------- |
| `grading_status` default `auto_graded` | `database/migrations/2026_09_08_000001_add_manual_grading_fields_to_exam_attempt_answers_table.php:35` |
| B2-owns-`pending_manual_review` invariant (migration docblock) | `...add_manual_grading_fields....php:23-27` |
| `down()` drops columns | `...add_manual_grading_fields....php:47-60` |
| Recalculation formula + transaction lock | `app/Services/ExamBank/ExamGradingService.php:29-32`, `53-56`, `63-71`, `74-85` |
| essay/short_answer auto-score false | `app/Services/ExamBank/ExamAnswerGrader.php:14`, `20` |
| Per-answer save transaction (no recompute) | `app/Services/ExamBank/ExamSessionService.php:388-411` |
| Question types | `app/Services/ExamBank/ExamSessionService.php:39` |
| Practice pool filter | `app/Services/ExamBank/ExamSessionService.php:178-184` |
| Question type column | `database/migrations/2026_07_10_100100_create_questions_table.php:21` |