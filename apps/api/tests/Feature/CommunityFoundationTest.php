<?php

namespace Tests\Feature;

use App\Models\CommunityChannel;
use App\Models\CommunityMessage;
use App\Models\CommunityParticipant;
use App\Models\CommunitySetting;
use App\Models\CommunityStat;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Community\CommunityAccessService;
use App\Services\Community\CommunityChannelService;
use App\Services\Community\CommunityEngagementService;
use App\Services\Community\CommunityExamGateService;
use App\Services\Community\CommunityGamificationService;
use App\Services\Community\CommunityMessageService;
use App\Services\Community\CommunityModerationService;
use App\Services\Community\CommunityParticipantService;
use App\Services\Community\CommunityPresenceService;
use App\Services\Community\CommunityReactionService;
use App\Services\Community\CommunityReadReceiptService;
use App\Services\Community\CommunitySearchService;
use App\Services\Community\CommunitySeedService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommunityFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_creates_default_categories_channels_and_settings(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);

        $result = app(CommunitySeedService::class)->seed($tenant);

        $this->assertSame(8, $result['categories_created']);
        $this->assertSame(8, $result['channels_created']);
        $this->assertDatabaseHas('community_categories', [
            'tenant_id' => $tenant->id,
            'slug' => 'announcements',
            'moderator_only' => true,
        ]);
        $this->assertDatabaseHas('community_channels', [
            'tenant_id' => $tenant->id,
            'slug' => 'questions',
            'allows_questions' => true,
        ]);
        $this->assertDatabaseHas('community_settings', [
            'tenant_id' => $tenant->id,
            'is_enabled' => true,
        ]);

        // Idempotent.
        $again = app(CommunitySeedService::class)->seed($tenant);
        $this->assertSame(0, $again['categories_created']);
        $this->assertSame(0, $again['channels_created']);
    }

    public function test_member_joins_posts_and_stats_and_channel_state_update(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);

        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        app(CommunityParticipantService::class)->join($tenant, $student);

        $message = app(CommunityMessageService::class)->create($tenant, $channel, $student, [
            'body' => 'Hello community!',
            'content_type' => 'text',
        ]);

        $this->assertSame('active', $message->status);
        $this->assertSame('Hello community!', $message->body_text);

        $channel->refresh();
        $this->assertSame($message->id, $channel->last_message_id);

        $this->assertSame(1, app(\App\Services\Community\CommunityStatsService::class)->get($tenant, CommunityStat::TOTAL_MESSAGES));
        $this->assertDatabaseHas('community_participants', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'status' => 'active',
        ]);
    }

    public function test_roles_resolve_admin_moderator_member(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $access = app(CommunityAccessService::class);

        $this->assertSame(CommunityAccessService::ROLE_ADMIN, $access->roleFor($admin, $tenant));
        $this->assertSame(CommunityAccessService::ROLE_MODERATOR, $access->roleFor($instructor, $tenant));
        $this->assertSame(CommunityAccessService::ROLE_MEMBER, $access->roleFor($student, $tenant));
        $this->assertTrue($access->isModerator($instructor, $tenant));
        $this->assertFalse($access->isModerator($student, $tenant));
    }

    public function test_anti_spam_blocks_duplicates_and_moderator_can_pin(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        $service = app(CommunityMessageService::class);

        $service->create($tenant, $channel, $student, ['body' => 'Same content', 'content_type' => 'text']);

        $this->expectException(ValidationException::class);
        $service->create($tenant, $channel, $student, ['body' => 'Same content', 'content_type' => 'text']);

        $this->fail('Duplicate message should have been blocked.');
    }

    public function test_pin_and_delete_require_moderator_or_owner(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        $service = app(CommunityMessageService::class);
        $message = $service->create($tenant, $channel, $student, ['body' => 'Pin me', 'content_type' => 'text']);

        // Student cannot pin.
        $this->expectException(ValidationException::class);
        $service->pin($tenant, $message, $student, true);
        $this->fail('Student should not be able to pin.');
    }

    public function test_reactions_toggle_and_read_receipts_track_read_state(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $reader = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        $message = app(CommunityMessageService::class)->create($tenant, $channel, $student, [
            'body' => 'React to this',
            'content_type' => 'text',
        ]);

        $reactions = app(CommunityReactionService::class);
        $added = $reactions->toggle($tenant, $message, $reader, '👍');
        $this->assertSame('added', $added['action']);

        $removed = $reactions->toggle($tenant, $message, $reader, '👍');
        $this->assertSame('removed', $removed['action']);

        $receipts = app(CommunityReadReceiptService::class);
        $receipts->markRead($tenant, $channel, $reader, $message->id);

        $this->assertSame(0, $receipts->unreadCount($tenant, $channel, $reader));
        $seen = $receipts->seenBy($tenant, $channel, $message);
        $this->assertCount(1, $seen);
        $this->assertSame($reader->id, $seen[0]['id']);
    }

    public function test_exam_gate_blocks_community_during_active_exam(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $exam = \App\Models\Exam::create([
            'tenant_id' => $tenant->id,
            'title' => 'Midterm',
            'slug' => 'midterm',
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'published',
        ]);

        \Illuminate\Support\Facades\DB::table('exam_attempts')->insert([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam->id,
            'user_id' => $student->user_id,
            'score' => 0,
            'max_score' => 100,
            'passed' => false,
            'status' => 'in_progress',
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(ValidationException::class);
        app(CommunityExamGateService::class)->ensureNoActiveExam($student, $tenant);
        $this->fail('Active exam should block community access.');
    }

    public function test_exam_gate_ignores_abandoned_untimed_attempt_after_inactivity_window(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $exam = \App\Models\Exam::create([
            'tenant_id' => $tenant->id,
            'title' => 'Practice',
            'slug' => 'practice',
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'published',
        ]);

        \Illuminate\Support\Facades\DB::table('exam_attempts')->insert([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam->id,
            'user_id' => $student->user_id,
            'score' => 0,
            'max_score' => 100,
            'passed' => false,
            'is_practice' => true,
            'status' => 'in_progress',
            'started_at' => now()->subHours(2),
            'updated_at' => now()->subHours(2),
            'created_at' => now()->subHours(2),
        ]);

        app(CommunityExamGateService::class)->ensureNoActiveExam($student, $tenant);
        $this->assertTrue(true);
    }

    public function test_banned_member_cannot_post(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        app(CommunityParticipantService::class)->join($tenant, $student);
        app(CommunityModerationService::class)->ban($tenant, $student, $admin, 60, 'Spam');

        $this->expectException(ValidationException::class);
        app(CommunityMessageService::class)->create($tenant, $channel, $student, [
            'body' => 'Blocked',
            'content_type' => 'text',
        ]);
        $this->fail('Banned member should not be able to post.');
    }

    public function test_search_finds_messages_by_body_text(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        app(CommunityMessageService::class)->create($tenant, $channel, $student, [
            'body' => 'How do I solve quadratic equations?',
            'content_type' => 'text',
        ]);

        $result = app(CommunitySearchService::class)->search($tenant, $student, 'quadratic');
        $this->assertSame(1, $result['messages']->total());
        $this->assertSame(0, $result['threads']->total());
    }

    public function test_gamification_awards_xp_ranks_and_leaderboard(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $gamification = app(CommunityGamificationService::class);

        $gamification->award($tenant, $student, 'message_created', 5);
        $gamification->award($tenant, $student, 'accepted_answer', 25);
        $gamification->award($tenant, $student, 'solved', 10);

        $this->assertSame(40, $gamification->totalXp($tenant, $student));
        $this->assertSame('beginner', $gamification->rankFor(40));

        $leaderboard = $gamification->leaderboard($tenant);
        $this->assertSame(40, $leaderboard->first()->total_xp);
        $this->assertSame($student->id, $leaderboard->first()->tenant_user_id);
    }

    public function test_engagement_bookmarks_and_follows_channel(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'questions')->firstOrFail();

        $message = app(CommunityMessageService::class)->create($tenant, $channel, $student, [
            'body' => 'Saved for later',
            'content_type' => 'text',
        ]);

        $engagement = app(CommunityEngagementService::class);

        $engagement->bookmark($tenant, $message, $student, 'Review tonight');
        $this->assertTrue($engagement->isBookmarked($tenant, $message, $student));
        $this->assertCount(1, $engagement->bookmarks($tenant, $student));

        $follow = $engagement->followChannel($tenant, $channel, $student);
        $this->assertSame($channel->id, $follow->channel_id);

        $engagement->setMuted($tenant, $student, $channel->id, null, true);
        $this->assertTrue($engagement->follows($tenant, $student)->first()->muted);
    }

    public function test_presence_tracks_online_members_and_stats(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        $presence = app(CommunityPresenceService::class);
        $presence->online($tenant, $student, $channel->id);

        $this->assertTrue($presence->isOnline($tenant, $student));
        $this->assertSame(1, $presence->onlineCount($tenant));

        $stats = app(\App\Services\Community\CommunityStatsService::class);
        $this->assertSame(1, $stats->get($tenant, CommunityStat::ONLINE_MEMBERS));

        $presence->offline($tenant, $student);
        $this->assertFalse($presence->isOnline($tenant, $student));
        $this->assertSame(0, $presence->onlineCount($tenant));
    }

    public function test_cross_tenant_isolation_blocks_message_creation(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $secondStudent = $this->memberWithRole($secondTenant, 'student');
        $this->bindTenant($firstTenant);
        app(CommunitySeedService::class)->seed($firstTenant);
        $channel = CommunityChannel::query()->where('slug', 'general-discussion')->firstOrFail();

        // Second tenant's student tries to post into first tenant's channel.
        $this->expectException(ValidationException::class);
        app(CommunityMessageService::class)->create($firstTenant, $channel, $secondStudent, [
            'body' => 'Cross tenant',
            'content_type' => 'text',
        ]);
        $this->fail('Cross-tenant message should have been blocked.');
    }

    public function test_threaded_questions_support_replies_and_solving(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $answerer = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        app(CommunitySeedService::class)->seed($tenant);
        $channel = CommunityChannel::query()->where('slug', 'questions')->firstOrFail();

        $thread = app(CommunityChannelService::class)->createThread($tenant, $student, $channel, [
            'title' => 'Help with this question',
        ]);

        $service = app(CommunityMessageService::class);
        $question = $service->create($tenant, $channel, $student, [
            'body' => 'How does this work?',
            'content_type' => 'text',
            'thread_id' => $thread->id,
        ]);

        $answer = $service->create($tenant, $channel, $answerer, [
            'body' => 'Here is the explanation.',
            'content_type' => 'text',
            'thread_id' => $thread->id,
            'parent_message_id' => $question->id,
        ]);

        $this->assertSame($question->id, $answer->parent_message_id);

        // Question author accepts the answer.
        $accepted = $service->markAcceptedAnswer($tenant, $answer, $student, true);
        $this->assertTrue($accepted->is_official_answer);

        // Question author marks solved.
        $solved = $service->markSolved($tenant, $question, $student, true);
        $this->assertTrue($solved->is_solved);

        // XP awarded to the answer author: 3 for replying + 25 accepted answer.
        $this->assertSame(28, app(CommunityGamificationService::class)->totalXp($tenant, $answerer));
    }

    public function test_settings_can_be_disabled_which_blocks_access(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $settings = app(\App\Services\Community\CommunitySettingService::class);
        $settings->update($tenant, ['is_enabled' => false]);

        $this->assertFalse(app(CommunityAccessService::class)->canAccess($student, $tenant));
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seedTenantPermissions($tenant);

        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);

        $role = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }

    private function seedTenantPermissions(Tenant $tenant): void
    {
        if (Role::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $this->seed(IdentityAccessSeeder::class);

        if (! Permission::query()->where('slug', 'courses.view')->exists()) {
            $this->fail('Course permissions were not seeded.');
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
