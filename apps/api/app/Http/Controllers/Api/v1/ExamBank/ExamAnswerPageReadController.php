<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use App\Models\MediaAsset;
use App\Services\ExamBank\ExamAnswerPageReadService;
use App\Services\Media\Providers\BunnyStorageProvider;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Private read-back of exam answer pages (Phase C).
 *
 * Deliberately NOT MediaProxyController: that route is public and, being
 * public-by-default, is exactly the reuse the Phase A audit flagged. This
 * controller is a NEW, exam-answer-specific read path that:
 *  - gates every request through ExamAttemptPolicy::viewPages (owner student
 *    OR teacher authorized for the exam), and
 *  - streams the bytes from Bunny Storage using the SAME per-tenant credential
 *    resolution the upload intent used (BunnyStorageProvider::configForTenant),
 *    mirroring MediaProxyController::serve()'s mechanics without inheriting its
 *    public visibility.
 *
 * The list endpoint returns page ids, ordering and an authenticated stream
 * route — never storage keys, internal paths or, for students, grading fields.
 */
class ExamAnswerPageReadController extends Controller
{
    public function __construct(
        private readonly ExamAnswerPageReadService $pages,
        private readonly BunnyStorageProvider $storage,
    ) {}

    /**
     * Ordered page metadata for one answer of an attempt.
     *
     * Response shape (§3): page_id, page_order, capturedAt/width/height/mimeType
     * and the stream route. Student callers never see manualScore / feedback /
     * gradedBy / gradedAt (B1 contract §5); teacher callers do.
     */
    public function index(Request $request, ExamAttempt $attempt, ExamQuestion $examQuestion): JsonResponse
    {
        abort_unless(Gate::allows('viewPages', $attempt), 404);

        $user = $request->user();

        // Most restrictive default: an attempt owner always receives the
        // student-shaped payload, even if that user could also hold an
        // exam-management role in the tenant. The teacher-shaped payload is
        // only returned on the teacher access leg.
        $teacherView = $attempt->user_id !== $user->id;

        ['answer' => $answer, 'pages' => $pages] = $this->pages->pages($attempt, $examQuestion);

        if ($teacherView) {
            $answer->loadMissing('grader.user');
        }

        return response()->json([
            'data' => $this->payload($attempt, $examQuestion, $answer, $pages, $teacherView),
        ]);
    }

    /**
     * Stream one page's bytes after re-running the exact authorization and
     * binding checks. The route parameters carry no secret; every request is
     * independently authorized (no reliance on having listed pages first).
     */
    public function show(Request $request, ExamAttempt $attempt, ExamQuestion $examQuestion, ExamAttemptAnswerPage $page): Response
    {
        abort_unless(Gate::allows('viewPages', $attempt), 404);

        $page = $this->pages->page($attempt, $examQuestion, $page);

        if ($page->mediaAsset === null) {
            return response('File not found.', 404);
        }

        return $this->streamAsset($attempt->tenant_id, $page->mediaAsset);
    }

    /**
     * @param  Collection<int, ExamAttemptAnswerPage>  $pages
     * @return array<string, mixed>
     */
    private function payload(
        ExamAttempt $attempt,
        ExamQuestion $examQuestion,
        ExamAttemptAnswer $answer,
        Collection $pages,
        bool $teacherView,
    ): array {
        $data = [
            'attemptId' => (string) $attempt->id,
            'examQuestionId' => (string) $examQuestion->id,
            'answerId' => (string) $answer->id,
            'answerMode' => $answer->answer_mode,
            'gradingStatus' => $answer->grading_status,
            'pages' => $pages->map(fn (ExamAttemptAnswerPage $page): array => [
                'id' => (string) $page->id,
                'pageOrder' => (int) $page->page_order,
                'capturedAt' => $page->captured_at?->toIso8601String(),
                'width' => $page->width,
                'height' => $page->height,
                'mimeType' => $page->mediaAsset?->mime_type,
                'url' => route('exam-bank.answer-pages.show', [
                    'attempt' => $attempt->id,
                    'examQuestion' => $examQuestion->id,
                    'page' => $page->id,
                ]),
            ])->values()->all(),
        ];

        if ($teacherView) {
            $data['manualScore'] = $answer->manual_score !== null ? (float) $answer->manual_score : null;
            $data['feedback'] = $answer->feedback;
            $data['gradedBy'] = $this->gradedBy($answer);
            $data['gradedAt'] = $answer->graded_at?->toIso8601String();
        }

        return $data;
    }

    /**
     * @return array{id: string, name: ?string}|null
     */
    private function gradedBy(ExamAttemptAnswer $answer): ?array
    {
        if ($answer->graded_by_tenant_user_id === null || $answer->grader === null) {
            return null;
        }

        return [
            'id' => (string) $answer->grader->id,
            'name' => $answer->grader->user?->name,
        ];
    }

    /**
     * Server-side byte stream for a private asset. Mirrors
     * MediaProxyController::serve()'s upstream mechanics (HTTP GET from Bunny
     * Storage with the AccessKey header, pass-through of upstream headers) with
     * three deliberate differences:
     *  - the caller is already authorized by ExamAttemptPolicy::viewPages,
     *  - credentials resolve through the SAME per-tenant path the upload intent
     *    used (BunnyStorageProvider::configForTenant), so a tenant with its own
     *    storage zone reads from that zone, and
     *  - the response is never cached (private student data).
     */
    private function streamAsset(int $tenantId, MediaAsset $asset): Response
    {
        if ($asset->provider !== 'bunny'
            || $asset->provider_service !== 'storage'
            || $asset->status !== 'ready'
            || ! filled($asset->storage_key)) {
            return response('File not found.', 404);
        }

        try {
            $config = $this->storage->configForTenant($tenantId);
        } catch (RuntimeException $e) {
            Log::channel('bunny')->warning('Exam answer page: storage not configured', [
                'tenant_id' => $tenantId,
                'asset_id' => $asset->id,
                'error' => $e->getMessage(),
            ]);

            return response('Media service unavailable.', 503);
        }

        $storageUrl = rtrim((string) ($config['upload_base_url'] ?? ''), '/')
            .'/'.ltrim($asset->storage_key, '/');

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'AccessKey' => $config['client_upload_key'] ?? null,
                ])
                ->withOptions(['stream' => true])
                ->get($storageUrl);

            if (! $response->successful()) {
                Log::channel('bunny')->warning('Exam answer page: upstream error', [
                    'tenant_id' => $tenantId,
                    'asset_id' => $asset->id,
                    'status' => $response->status(),
                ]);

                return response('File not found.', 404);
            }

            $headers = [
                'Content-Type' => $response->header('Content-Type') ?? $asset->mime_type ?? 'application/octet-stream',
                'Cache-Control' => 'private, no-store',
                'X-Content-Type-Options' => 'nosniff',
            ];

            $contentLength = $response->header('Content-Length');
            if ($contentLength) {
                $headers['Content-Length'] = $contentLength;
            }

            $etag = $response->header('ETag');
            if ($etag) {
                $headers['ETag'] = $etag;
            }

            $lastModified = $response->header('Last-Modified');
            if ($lastModified) {
                $headers['Last-Modified'] = $lastModified;
            }

            return response($response->body(), 200, $headers);
        } catch (\Throwable $e) {
            Log::channel('bunny')->error('Exam answer page: stream exception', [
                'tenant_id' => $tenantId,
                'asset_id' => $asset->id,
                'error' => $e->getMessage(),
            ]);

            return response('Media proxy error.', 502);
        }
    }
}
