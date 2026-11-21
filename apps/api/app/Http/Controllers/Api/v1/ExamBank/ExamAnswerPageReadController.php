<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use App\Models\MediaAsset;
use App\Services\ExamBank\ExamAnswerPageReadService;
use App\Services\Media\MediaStorage;
use App\Services\Media\Providers\BunnyStorageProvider;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Private read-back of exam answer pages (Phase C).
 *
 * Serves private exam page bytes from local tenant-isolated storage, with a
 * legacy Bunny storage fallback for older assets. Every request is independently
 * authorized (owner student OR teacher authorized for the exam).
 */
class ExamAnswerPageReadController extends Controller
{
    public function __construct(
        private readonly ExamAnswerPageReadService $pages,
        private readonly MediaStorage $storage,
        private readonly BunnyStorageProvider $bunnyStorage,
    ) {}

    public function index(Request $request, ExamAttempt $attempt, ExamQuestion $examQuestion): JsonResponse
    {
        abort_unless(Gate::allows('viewPages', $attempt), 404);

        $user = $request->user();
        $teacherView = $attempt->user_id !== $user->id;

        ['answer' => $answer, 'pages' => $pages] = $this->pages->pages($attempt, $examQuestion);

        if ($teacherView) {
            $answer->loadMissing('grader.user');
        }

        return response()->json([
            'data' => $this->payload($attempt, $examQuestion, $answer, $pages, $teacherView),
        ]);
    }

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
                'url' => route(
                    request()->attributes->has('instructorMembership')
                        ? 'instructor.exam-bank.answer-pages.show'
                        : 'exam-bank.answer-pages.show',
                    [
                        'attempt' => $attempt->id,
                        'examQuestion' => $examQuestion->id,
                        'page' => $page->id,
                    ],
                    false,
                ),
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

    private function streamAsset(int $tenantId, MediaAsset $asset): Response
    {
        if ($asset->status !== 'ready' || ! filled($asset->storage_key)) {
            return response('File not found.', 404);
        }

        if ($asset->provider === 'local' && $asset->provider_service === 'storage') {
            return $this->streamLocalAsset($tenantId, $asset);
        }

        if ($asset->provider === 'bunny' && $asset->provider_service === 'storage') {
            return $this->streamLegacyBunnyAsset($tenantId, $asset);
        }

        return response('File not found.', 404);
    }

    private function streamLocalAsset(int $tenantId, MediaAsset $asset): Response
    {
        $storageKey = ltrim((string) $asset->storage_key, '/');
        if ($storageKey === '') {
            return response('File not found.', 404);
        }

        if (preg_match('#^tenants/(\d+)/#', $storageKey, $m) && (int) $m[1] !== $tenantId) {
            return response('File not found.', 404);
        }

        $disk = $this->storage->diskName();
        $fs = Storage::disk($disk);
        if (! $fs->exists($storageKey) && $disk !== 'public' && Storage::disk('public')->exists($storageKey)) {
            $fs = Storage::disk('public');
        }

        if (! $fs->exists($storageKey)) {
            return response('File not found.', 404);
        }

        $mime = $asset->mime_type ?: ($fs->mimeType($storageKey) ?: 'application/octet-stream');
        $size = $fs->size($storageKey);
        $lastModified = gmdate('D, d M Y H:i:s', (int) $fs->lastModified($storageKey)).' GMT';

        $headers = [
            'Content-Type' => $mime,
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Length' => (string) $size,
            'Last-Modified' => $lastModified,
        ];

        $stream = $fs->readStream($storageKey);
        if (! is_resource($stream)) {
            return response('File not found.', 404);
        }

        return new StreamedResponse(function () use ($stream): void {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, $headers);
    }

    private function streamLegacyBunnyAsset(int $tenantId, MediaAsset $asset): Response
    {
        try {
            $config = $this->bunnyStorage->configForTenant($tenantId);
        } catch (RuntimeException $e) {
            Log::channel('bunny')->warning('Exam answer page: storage not configured', [
                'tenant_id' => $tenantId,
                'asset_id' => $asset->id,
                'error' => $e->getMessage(),
            ]);

            return response('Media service unavailable.', 503);
        }

        $storageUrl = rtrim((string) ($config['upload_base_url'] ?? ''), '/')
            .'/'.ltrim((string) $asset->storage_key, '/');

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