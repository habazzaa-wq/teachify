<?php

namespace App\Services\Discussions;

use App\Models\DiscussionPost;
use App\Models\DiscussionReport;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Security\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class DiscussionModerationService
{
    public function __construct(
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     * @return Collection<int, DiscussionReport>
     */
    public function listReports(Tenant $tenant, array $filters = []): Collection
    {
        $this->bindTenant($tenant);

        return DiscussionReport::query()
            ->where('tenant_id', $tenant->id)
            ->when(
                $filters['status'] ?? null,
                fn (Builder $query, $status) => $query->where('status', $status),
            )
            ->with(['post.author.user', 'reporter.user', 'reviewer.user'])
            ->orderBy('status')
            ->orderBy('created_at')
            ->get();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function report(
        Tenant $tenant,
        DiscussionPost $post,
        TenantUser $reporter,
        array $data,
    ): DiscussionReport {
        $this->bindTenant($tenant);
        $this->ensurePostInTenant($tenant, $post);
        $this->ensureReporterInTenant($tenant, $reporter);
        $this->ensureReason($data['reason'] ?? '');

        return DiscussionReport::create([
            'tenant_id' => $tenant->id,
            'discussion_post_id' => $post->id,
            'reported_by_tenant_user_id' => $reporter->id,
            'reason' => $data['reason'],
            'note' => $data['note'] ?? null,
            'status' => 'pending',
            'reviewed_by_tenant_user_id' => null,
            'reviewed_at' => null,
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();
    }

    public function hidePost(Tenant $tenant, DiscussionPost $post, TenantUser $moderator): DiscussionPost
    {
        $this->bindTenant($tenant);
        $this->ensurePostInTenant($tenant, $post);

        $post->forceFill(['status' => 'hidden'])->save();

        $this->audit->record('discussion.post.hidden', [
            'tenant_id' => $tenant->id,
            'post_id' => $post->id,
            'moderator_id' => $moderator->id,
        ]);

        return $post->refresh();
    }

    public function restorePost(Tenant $tenant, DiscussionPost $post, TenantUser $moderator): DiscussionPost
    {
        $this->bindTenant($tenant);
        $this->ensurePostInTenant($tenant, $post);

        $post->forceFill([
            'status' => 'active',
            'deleted_at' => null,
        ])->save();

        $this->audit->record('discussion.post.restored', [
            'tenant_id' => $tenant->id,
            'post_id' => $post->id,
            'moderator_id' => $moderator->id,
        ]);

        return $post->refresh();
    }

    public function resolveReport(Tenant $tenant, DiscussionReport $report, TenantUser $moderator): DiscussionReport
    {
        $this->bindTenant($tenant);
        $this->ensureReportInTenant($tenant, $report);
        $this->ensureReportOpen($report);

        $report->forceFill([
            'status' => 'resolved',
            'reviewed_by_tenant_user_id' => $moderator->id,
            'reviewed_at' => now(),
        ])->save();

        $this->audit->record('discussion.report.resolved', [
            'tenant_id' => $tenant->id,
            'report_id' => $report->id,
            'moderator_id' => $moderator->id,
        ]);

        return $report->refresh();
    }

    public function dismissReport(Tenant $tenant, DiscussionReport $report, TenantUser $moderator): DiscussionReport
    {
        $this->bindTenant($tenant);
        $this->ensureReportInTenant($tenant, $report);
        $this->ensureReportOpen($report);

        $report->forceFill([
            'status' => 'dismissed',
            'reviewed_by_tenant_user_id' => $moderator->id,
            'reviewed_at' => now(),
        ])->save();

        $this->audit->record('discussion.report.dismissed', [
            'tenant_id' => $tenant->id,
            'report_id' => $report->id,
            'moderator_id' => $moderator->id,
        ]);

        return $report->refresh();
    }

    private function ensureReportOpen(DiscussionReport $report): void
    {
        if ($report->status !== 'pending') {
            throw ValidationException::withMessages([
                'report' => ['This report has already been reviewed.'],
            ]);
        }
    }

    private function ensureReason(string $reason): void
    {
        if (trim($reason) === '') {
            throw ValidationException::withMessages([
                'reason' => ['A report reason is required.'],
            ]);
        }
    }

    private function ensureReporterInTenant(Tenant $tenant, TenantUser $reporter): void
    {
        if ($reporter->tenant_id !== $tenant->id || $reporter->status !== 'active') {
            throw ValidationException::withMessages([
                'reported_by_tenant_user_id' => ['The reporter is invalid for this tenant.'],
            ]);
        }
    }

    private function ensurePostInTenant(Tenant $tenant, DiscussionPost $post): void
    {
        if ($post->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'post' => ['The discussion post is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureReportInTenant(Tenant $tenant, DiscussionReport $report): void
    {
        if ($report->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'report' => ['The discussion report is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
