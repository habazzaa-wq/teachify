# Exam System — k6 Load Tests (P1 concurrency + P3 readiness)

These scripts validate the **exam-system concurrency** work (P1) and are part of
the P3 load-test readiness deliverable. They target a **real MySQL-backed** Teachify
API under load. They are **not** part of CI and are **not** run automatically.

> **REAL MYSQL LOAD TEST: NOT RUN in this phase.** This repo's CI/test env runs
> the PHPUnit suite on SQLite. No MySQL instance, no running API, and no `k6`
> binary were available when P3 was implemented, so the scenarios below were
> validated by inspection only (field-name bug fixed, docs corrected). The
> numbers in "Expected outputs" are *suggested pass/fail thresholds*, not
> measured results. To claim P1 effective, run these against MySQL (see below).

## Why these exist

The unit/feature suite runs on SQLite (`:memory:`), which serializes writes at the
connection level and **cannot** reproduce lock-convoy or write-amplification behavior.
The whole point of P1 was to remove shared-exam-row locking and inline grading on the
hot path, so MySQL-level verification is required to claim the fix is effective.

## Prerequisites

- `k6` installed (https://k6.io/docs/getting-started/installation/)
- A running Teachify API against **MySQL** (`DB_CONNECTION=mysql`)
- A seeded tenant with a published course → section → `exam`-type lesson whose
  attached exam is published and has questions
- A student bearer token for that tenant
- A queue worker for deferred grading (`queue:work --queue=grading`) if you want to
  observe grading behaviour under S3/S4 — `QUEUE_CONNECTION=sync` runs it inline

## Environment variables

k6 does **not** auto-load a `.env` file. Pass every variable with `-e` flags
(repeat `-e NAME=value` per variable), or export them in the shell before `k6 run`.

| Var            | Description                                   | Default                |
| -------------- | --------------------------------------------- | ---------------------- |
| `BASE_URL`     | API base URL                                  | `http://localhost:8000` |
| `X_TENANT_ID`  | `X-Tenant-ID` header value                    | `1`                    |
| `AUTH_TOKEN`   | Bearer token (student role in tenant)         | _(required)_           |
| `LESSON_ID`    | exam-backed lesson id                         | `1`                    |
| `COURSE_ID`    | course id (optional)                          | `1`                    |
| `TARGET_VUS`   | peak virtual users                            | `50`                   |
| `DURATION`     | sustained load duration                       | `1m`                   |

## Scenarios

| Script             | Scenario                                  | Endpoint(s) exercised                                  |
| ------------------ | ----------------------------------------- | ------------------------------------------------------ |
| `s1_start.js`      | S1 — Concurrent exam starts              | `POST .../exam-sessions/start`                         |
| `s2_autosave.js`   | S2 — Autosave / answer pressure          | `PUT .../progress`, `PUT .../answers/{qid}`            |
| `s3_submit.js`     | S3 — Concurrent submissions              | `POST .../submit`                                      |
| `s4_result_read.js`| S4 — Result reads                        | `GET .../exam-sessions/{id}`                           |
| `s5_mixed.js`      | S5 — Mixed realistic workload            | start → progress → answer → submit → read             |

## Running

```bash
# All scenarios share the same env. Export them once, or pass -e per run.
export BASE_URL=http://localhost:8000
export X_TENANT_ID=1
export AUTH_TOKEN=<student-token>
export LESSON_ID=12
export TARGET_VUS=50
export DURATION=2m

k6 run load-tests/s1_start.js
k6 run load-tests/s2_autosave.js
k6 run load-tests/s3_submit.js
k6 run load-tests/s4_result_read.js
k6 run load-tests/s5_mixed.js
```

To scale a scenario: `k6 run -e TARGET_VUS=200 -e DURATION=5m load-tests/s1_start.js`.

## Expected outputs / suggested pass-fail thresholds

Thresholds are encoded in each script's `options.thresholds` and are starting
points — tune them to your SLA and hardware:

- **No 500/409 storms** and flat `http_req_duration` p95 as VUs ramp ⇒ contention removed.
- `s1` p95 < 1500 ms, failure rate < 2%
- `s2` p95 < 1000 ms, failure rate < 2%
- `s3` p95 < 2000 ms, failure rate < 2%
- `s4` p95 < 1000 ms, failure rate < 2% (reads return `grading`/`submitted` quickly)
- `s5` p95 < 2500 ms, failure rate < 3%

Before P1 (baseline) you would expect p95 spikes / deadlock errors under S1/S3 at
high VUs. If you see those now, P1 is not effective and the scripts have done
their job — investigate before claiming readiness.

> NOTE: with `QUEUE_CONNECTION=sync` locally the grading job runs inline on
> submit/read; on the real worker (`redis`/`database` queue + `queue:work
> --queue=grading`) it is deferred.
