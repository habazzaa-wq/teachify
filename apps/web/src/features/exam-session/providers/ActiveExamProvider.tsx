"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSuperAdminPath } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { ExamActiveReminder } from "../components/ExamActiveReminder";
import { ExamReminderSubmitDialog } from "../components/ExamReminderSubmitDialog";
import {
  ACTIVE_EXAM_CHANNEL,
  ACTIVE_EXAM_POLL_MS,
  ACTIVE_EXAM_QUERY_KEY,
  EXAM_SESSION_QUERY_KEY,
} from "../constants";
import { examSessionService } from "../services";
import type { ActiveExamAttempt, ExamSession } from "../types";

interface ActiveExamContextValue {
  /** The live unfinished attempt, or null when there is none. */
  activeAttempt: ActiveExamAttempt | null;
  isLoading: boolean;
  isSubmitting: boolean;
  submitDialogOpen: boolean;
  openSubmitDialog: () => void;
  closeSubmitDialog: () => void;
  returnToExam: () => void;
  submitExam: () => Promise<void>;
  refresh: () => void;
}

const ActiveExamContext = createContext<ActiveExamContextValue | null>(null);

/** Routes where the student is already inside the exam flow — never nag there. */
const EXAM_FLOW_PREFIXES = ["/exam-sessions", "/exam-results"];

function isExamFlowPath(pathname: string): boolean {
  return EXAM_FLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Global "persistent active exam reminder".
 *
 * - Polls GET /exams/active-attempt once on boot and then every 60s via the
 *   React Query cache (no aggressive polling, no duplicate in-flight requests).
 * - Keeps the last known attempt while offline and retries automatically.
 * - Syncs across tabs through a BroadcastChannel so submitting in one tab
 *   dismisses the reminder everywhere.
 * - Reacts to exam submissions that happen inside the exam engine (submit and
 *   auto-submit on timer expiry) by watching the shared query cache.
 */
export function ActiveExamProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const accessToken = useAuthStore((state) => state.accessToken);
  const activeTenantId = useTenantStore((state) => state.activeTenant?.id ?? null);

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  const sessionAvailable = Boolean(accessToken && activeTenantId);
  const isSuperAdmin = isSuperAdminPath(pathname);
  const inExamFlow = isExamFlowPath(pathname);
  const queryEnabled = sessionAvailable && !isSuperAdmin && !inExamFlow;

  const query = useQuery({
    queryKey: [ACTIVE_EXAM_QUERY_KEY],
    queryFn: () => examSessionService.activeAttempt(),
    enabled: queryEnabled,
    staleTime: 0,
    refetchInterval: ACTIVE_EXAM_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const attempt = query.data ?? null;

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [ACTIVE_EXAM_QUERY_KEY] });
  }, [queryClient]);

  // Broadcast a lifecycle event so other tabs refresh their reminder state.
  const broadcast = useCallback((message: { type: string; attemptId?: string }) => {
    try {
      channelRef.current?.postMessage(message);
    } catch {
      // ignore cross-tab messaging failures
    }
  }, []);

  // Multi-tab sync: react to submits/refreshes issued from other tabs.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(ACTIVE_EXAM_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const message = event.data;
      if (message?.type === "submitted" || message?.type === "refresh") {
        queryClient.invalidateQueries({ queryKey: [ACTIVE_EXAM_QUERY_KEY] });
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [queryClient]);

  // The exam engine (session page) submits on demand and automatically when the
  // timer expires. Watch its query cache so the reminder disappears everywhere
  // as soon as the attempt transitions to submitted.
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "added" && event.type !== "updated") return;

      const key = event.query.queryKey;
      if (!Array.isArray(key) || key[0] !== EXAM_SESSION_QUERY_KEY) return;

      const session = event.query.state.data as ExamSession | undefined;
      if (session?.attempt?.status === "submitted") {
        void queryClient.invalidateQueries({
          queryKey: [ACTIVE_EXAM_QUERY_KEY],
        });
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // Refresh whenever the session (login / logout / re-login) changes.
  useEffect(() => {
    if (sessionAvailable) {
      void queryClient.invalidateQueries({ queryKey: [ACTIVE_EXAM_QUERY_KEY] });
    }
  }, [sessionAvailable, queryClient]);

  // 1s ticker only while an attempt is visible so the countdown stays live and
  // the card is auto-hidden the moment the timer runs out.
  useEffect(() => {
    if (!attempt?.timerEndsAt && attempt?.remainingSeconds == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [attempt?.id, attempt?.timerEndsAt, attempt?.remainingSeconds]);

  const deadline = useMemo(() => {
    if (!attempt) return null;
    if (attempt.timerEndsAt) return new Date(attempt.timerEndsAt).getTime();
    if (attempt.remainingSeconds != null) return now + attempt.remainingSeconds * 1000;
    return null;
  }, [attempt, now]);

  const expiredLocally = deadline !== null && now >= deadline;

  const visible =
    queryEnabled && Boolean(attempt) && !expiredLocally && !inExamFlow && !isSuperAdmin;

  const remainingSeconds = useMemo(() => {
    if (!attempt || deadline === null) return null;
    return Math.max(0, Math.round((deadline - now) / 1000));
  }, [attempt, deadline, now]);

  const submitMutation = useMutation({
    mutationFn: () => examSessionService.submit(attempt!.id),
    onSuccess: () => {
      setSubmitDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: [ACTIVE_EXAM_QUERY_KEY] });
      broadcast({ type: "submitted", attemptId: attempt?.id });
      router.push(`/exam-results/${attempt!.id}`);
    },
  });

  const submitExam = useCallback(async () => {
    if (!attempt) return;
    try {
      await submitMutation.mutateAsync();
    } catch {
      // keep the dialog open so the student can retry
    }
  }, [attempt, submitMutation]);

  const returnToExam = useCallback(() => {
    if (!attempt) return;
    router.push(`/exam-sessions/${attempt.id}`);
  }, [attempt, router]);

  const value = useMemo<ActiveExamContextValue>(
    () => ({
      activeAttempt: attempt,
      isLoading: query.isLoading,
      isSubmitting: submitMutation.isPending,
      submitDialogOpen,
      openSubmitDialog: () => setSubmitDialogOpen(true),
      closeSubmitDialog: () => setSubmitDialogOpen(false),
      returnToExam,
      submitExam,
      refresh,
    }),
    [
      attempt,
      query.isLoading,
      submitMutation.isPending,
      submitDialogOpen,
      returnToExam,
      submitExam,
      refresh,
    ],
  );

  return (
    <ActiveExamContext.Provider value={value}>
      {visible && attempt ? (
        <ExamActiveReminder
          attempt={attempt}
          remainingSeconds={remainingSeconds}
          onReturn={returnToExam}
          onSubmit={() => setSubmitDialogOpen(true)}
        />
      ) : null}

      <ExamReminderSubmitDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        attemptTitle={attempt?.exam?.title ?? null}
        isOfficial={attempt?.isOfficial ?? false}
        submitting={submitMutation.isPending}
        onConfirm={() => void submitExam()}
      />
    </ActiveExamContext.Provider>
  );
}

export function useActiveExamContext(): ActiveExamContextValue {
  const ctx = useContext(ActiveExamContext);
  if (!ctx) {
    throw new Error(
      "useActiveExamContext must be used within an ActiveExamProvider",
    );
  }
  return ctx;
}
