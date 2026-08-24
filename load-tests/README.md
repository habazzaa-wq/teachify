# P1 Exam Concurrency — k6 Load Tests

These scripts validate the **P1 (Exam Concurrency & Database Contention)** changes
against a real MySQL backend under load. They are intentionally **not** part of CI.

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

## Environment variables

| Var            | Description                                   | Default              |
| -------------- | --------------------------------------------- | -------------------- |
| `BASE_URL`     | API base URL                                  | `http://localhost:8000` |
| `X_TENANT_ID`  | `X-Tenant-ID` header value                    | `1`                  |
| `AUTH_TOKEN`   | Bearer token (student role in tenant)         | _(required)_         |
| `LESSON_ID`    | exam-backed lesson id                         | `1`                  |
| `COURSE_ID`    | course id (optional)                          | `1`                  |
| `TARGET_VUS`   | peak virtual users                            | `50`                 |
| `DURATION`     | sustained load duration                       | `1m`                 |

## Running

```bash
k6 run -e BASE_URL=http://localhost:8000 -e X_TENANT_ID=1 \
       -e AUTH_TOKEN=<token> -e LESSON_ID=12 load-tests/s1_start.js

k6 run load-tests/s2_autosave.js   # uses env above via -e or .env
k6 run load-tests/s3_submit.js
k6 run load-tests/s4_result_read.js
k6 run load-tests/s5_mixed.js
```

## What to look for

- **No 500/409 storms** and flat `http_req_duration` p95 as VUs ramp → contention removed.
- Before P1 (baseline), expect p95 spikes / deadlock errors under S1/S3 at high VUs.
- `s4` should return `grading`/`submitted` quickly — grading is **not** done inline.

> NOTE: with `QUEUE_CONNECTION=sync` locally the grading job runs inline on submit/read;
> on the real worker (`redis`/`database` queue + `queue:work --queue=grading`) it is deferred.
