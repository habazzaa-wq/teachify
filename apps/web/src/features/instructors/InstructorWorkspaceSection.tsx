"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileImage,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { instructorApi, instructorApiErrorMessage } from "./api";
import { useInstructorAuth } from "./InstructorAuthProvider";
import type {
  InstructorExam,
  InstructorExamAnswer,
  InstructorMediaAsset,
  InstructorStudent,
  InstructorSubmission,
  InstructorWorkspaceMetrics,
} from "./api";

type Section = "home" | "media" | "students" | "exams" | "grading";

const sectionContent: Record<Exclude<Section, "home">, { title: string; subtitle: string }> = {
  media: {
    title: "مكتبة الوسائط",
    subtitle: "ملفاتك وصورك التي رفعتها إلى المنصة، دون ملفات المدرّبين الآخرين.",
  },
  students: {
    title: "الطلاب",
    subtitle: "الطلاب المسجّلون في الدورات التي تدرّسها، بما فيها الدورات المشتركة.",
  },
  exams: {
    title: "مكتبة الاختبارات",
    subtitle: "الاختبارات التي أنشأتها وحالة المحاولات الخاصة بها.",
  },
  grading: {
    title: "تصحيح إجابات الطلاب",
    subtitle: "تسليمات الطلاب في دوراتك التي تنتظر المراجعة والتقييم.",
  },
};

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-primary">مساحة المدرّب</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-studio-border bg-studio-panel p-6 text-sm text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
      جارٍ تحميل البيانات...
    </div>
  );
}

export function InstructorWorkspaceSection({ section }: { section: Section }) {
  const { user, accessToken } = useInstructorAuth();
  const [metrics, setMetrics] = useState<InstructorWorkspaceMetrics | null>(null);
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [exams, setExams] = useState<InstructorExam[]>([]);
  const [submissions, setSubmissions] = useState<InstructorSubmission[]>([]);
  const [examAnswers, setExamAnswers] = useState<InstructorExamAnswer[]>([]);
  const [answerPages, setAnswerPages] = useState<Record<string, string[]>>({});
  const [loadingAnswerPages, setLoadingAnswerPages] = useState("");
  const answerPageUrls = useRef<string[]>([]);
  const [assets, setAssets] = useState<InstructorMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busySubmission, setBusySubmission] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => () => {
    answerPageUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    const load = async () => {
      try {
        if (section === "home") {
          const response = await instructorApi.workspace(accessToken);
          if (!cancelled) setMetrics(response.data);
        } else if (section === "students") {
          const response = await instructorApi.listStudents(accessToken);
          if (!cancelled) setStudents(response.data);
        } else if (section === "exams") {
          const response = await instructorApi.listExams(accessToken);
          if (!cancelled) setExams(response.data);
        } else if (section === "grading") {
          const [assignmentResponse, examResponse] = await Promise.all([
            instructorApi.gradingQueue(accessToken),
            instructorApi.examGradingQueue(accessToken),
          ]);
          if (!cancelled) {
            setSubmissions(assignmentResponse.data);
            setExamAnswers(examResponse.data);
          }
        } else {
          const response = await instructorApi.listMediaAssets(accessToken);
          if (!cancelled) setAssets(response.data);
        }
      } catch (cause) {
        if (!cancelled) setError(instructorApiErrorMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadKey, section]);

  async function uploadMedia(file: File) {
    if (!accessToken) return;
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await instructorApi.uploadMediaFile(accessToken, file);
      setNotice("تم رفع الملف إلى مكتبة الوسائط الخاصة بك.");
      reload();
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
      setLoading(false);
    }
  }

  async function submitGrade(event: FormEvent<HTMLFormElement>, submission: InstructorSubmission) {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    const score = Number(form.get("score"));
    const feedback = String(form.get("feedback") ?? "");
    setBusySubmission(submission.id);
    setError("");
    setNotice("");
    try {
      await instructorApi.gradeAssignment(
        accessToken,
        submission.assignment.id,
        submission.id,
        score,
        feedback,
      );
      setSubmissions((items) => items.filter((item) => item.id !== submission.id));
      setNotice("تم حفظ التقييم بنجاح.");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setBusySubmission("");
    }
  }

  async function submitExamGrade(event: FormEvent<HTMLFormElement>, answer: InstructorExamAnswer) {
    event.preventDefault();
    if (!accessToken) return;
    const form = new FormData(event.currentTarget);
    const score = Number(form.get("score"));
    const feedback = String(form.get("feedback") ?? "");
    setBusySubmission(answer.id);
    setError("");
    setNotice("");
    try {
      await instructorApi.gradeExamAnswer(accessToken, answer.attempt_id, answer.id, score, feedback);
      setExamAnswers((items) => items.filter((item) => item.id !== answer.id));
      setNotice("تم تصحيح إجابة الاختبار بنجاح.");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setBusySubmission("");
    }
  }

  async function toggleExamAnswerPages(answer: InstructorExamAnswer) {
    if (answerPages[answer.id]) {
      setAnswerPages((pages) => {
        const next = { ...pages };
        delete next[answer.id];
        return next;
      });
      return;
    }
    if (!accessToken) return;
    setLoadingAnswerPages(answer.id);
    setError("");
    try {
      const { data } = await instructorApi.listExamAnswerPages(
        accessToken,
        answer.attempt_id,
        answer.exam_question_id,
      );
      const blobs = await Promise.all(data.pages.map((page) =>
        instructorApi.fetchExamAnswerPage(
          accessToken,
          answer.attempt_id,
          answer.exam_question_id,
          page.id,
        ),
      ));
      const urls = blobs.map((blob) => URL.createObjectURL(blob));
      answerPageUrls.current.push(...urls);
      setAnswerPages((pages) => ({ ...pages, [answer.id]: urls }));
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setLoadingAnswerPages("");
    }
  }

  const topBar = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-primary">مرحباً، {user?.name}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">نظرة عامة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          تابع دوراتك وطلابك ومهامك التعليمية من مساحة عمل واحدة.
        </p>
      </div>
      <button
        type="button"
        onClick={reload}
        className="inline-flex items-center gap-2 rounded-xl border border-studio-border bg-studio-panel px-3 py-2 text-sm transition hover:border-primary"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        تحديث
      </button>
    </div>
  );

  if (section !== "home") {
    const content = sectionContent[section];
    return (
      <>
        <PageHeading {...content} />
        {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</p>}
        {section === "media" && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-studio-border bg-studio-panel p-4">
            <div>
              <p className="font-semibold">أضف ملفاً إلى مكتبتك</p>
              <p className="mt-1 text-xs text-muted-foreground">الملفات المرفوعة متاحة لك فقط في مساحة المدرّب.</p>
            </div>
            <label className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              رفع ملف
              <input
                type="file"
                className="sr-only"
                disabled={loading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadMedia(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        )}
        {loading ? <LoadingPanel /> : (
          <>
            {section === "students" && (
              students.length === 0 ? <EmptyState text="لا يوجد طلاب مسجلون في دوراتك حتى الآن." /> : (
                <div className="overflow-hidden rounded-2xl border border-studio-border bg-studio-panel">
                  <div className="hidden grid-cols-[2fr_2fr_1fr_1fr] gap-4 border-b border-studio-border px-5 py-3 text-xs font-semibold text-muted-foreground md:grid">
                    <span>الطالب</span><span>البريد الإلكتروني</span><span>الدورات</span><span>تاريخ الانضمام</span>
                  </div>
                  {students.map((student) => (
                    <div key={student.id} className="grid gap-2 border-b border-studio-border px-5 py-4 last:border-0 md:grid-cols-[2fr_2fr_1fr_1fr] md:items-center md:gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} image={student.avatar} />
                        <span className="font-medium">{student.name || "طالب"}</span>
                      </div>
                      <span dir="ltr" className="text-sm text-muted-foreground md:text-right">{student.email || "—"}</span>
                      <span className="text-sm">{student.courses_count} دورة</span>
                      <span className="text-xs text-muted-foreground">{formatDate(student.joined_at)}</span>
                    </div>
                  ))}
                </div>
              )
            )}
            {section === "exams" && (
              exams.length === 0 ? <EmptyState text="لا توجد اختبارات أنشأتها بعد." /> : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {exams.map((exam) => (
                    <article key={exam.id} className="rounded-2xl border border-studio-border bg-studio-panel p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></span>
                          <div><h2 className="font-semibold">{exam.title}</h2><p className="mt-1 text-xs text-muted-foreground">أُنشئ في {formatDate(exam.created_at)}</p></div>
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{exam.status}</span>
                      </div>
                      <div className="mt-5 flex gap-6 border-t border-studio-border pt-4 text-sm">
                        <span><strong>{exam.question_count}</strong> سؤال</span>
                        <span><strong>{exam.attempts_count}</strong> محاولة</span>
                      </div>
                    </article>
                  ))}
                </div>
              )
            )}
            {section === "media" && (
              assets.length === 0 ? <EmptyState text="مكتبتك فارغة. ارفع أول ملف للبدء." /> : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {assets.map((asset) => (
                    <article key={asset.id} className="overflow-hidden rounded-2xl border border-studio-border bg-studio-panel">
                      <div className="grid aspect-[16/9] place-items-center bg-studio-bg">
                        {asset.type === "image" && (asset.thumbnailUrl || asset.cdnUrl)
                          ? <img src={asset.thumbnailUrl || asset.cdnUrl || ""} alt="" className="h-full w-full object-cover" />
                          : <FileImage className="h-10 w-10 text-primary/70" aria-hidden="true" />}
                      </div>
                      <div className="p-4">
                        <p className="truncate font-medium">{asset.title || asset.originalFilename}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{asset.type} · {formatBytes(asset.sizeBytes)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )
            )}
            {section === "grading" && (
              <div className="space-y-8">
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">إجابات الاختبارات المقالية</h2>
                    <p className="mt-1 text-sm text-muted-foreground">إجابات الاختبارات التي أنشأتها فقط.</p>
                  </div>
                  {examAnswers.length === 0 ? <EmptyState text="لا توجد إجابات اختبارات تنتظر التصحيح." /> : (
                    examAnswers.map((answer) => (
                      <article key={answer.id} className="rounded-2xl border border-studio-border bg-studio-panel p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-primary">{answer.exam.title}</p>
                            <h3 className="mt-1 font-semibold">{answer.question.title || "إجابة مقالية"}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{answer.student.name || "طالب"} · {answer.question.type || "سؤال"}</p>
                          </div>
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700">{formatDate(answer.submitted_at)} · {answer.page_count} صفحات</span>
                        </div>
                        <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-studio-bg p-4 text-sm leading-6">{formatAnswer(answer.answer)}</pre>
                        {answer.page_count > 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              disabled={loadingAnswerPages === answer.id}
                              onClick={() => void toggleExamAnswerPages(answer)}
                              className="inline-flex items-center gap-2 rounded-lg border border-studio-border px-3 py-2 text-sm font-medium transition hover:border-primary disabled:opacity-60"
                            >
                              <FileImage className="h-4 w-4 text-primary" aria-hidden="true" />
                              {loadingAnswerPages === answer.id ? "جارٍ تحميل الصور..." : answerPages[answer.id] ? "إخفاء صور الإجابة" : `عرض صور الإجابة (${answer.page_count})`}
                            </button>
                            {answerPages[answer.id] && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {(answerPages[answer.id] ?? []).map((url, index) => (
                                  <a key={`${answer.id}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-studio-border">
                                    <img src={url} alt={`صفحة ${index + 1} من إجابة الطالب`} className="max-h-[32rem] w-full bg-white object-contain" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <form onSubmit={(event) => void submitExamGrade(event, answer)} className="mt-4 grid gap-3 border-t border-studio-border pt-4 md:grid-cols-[140px_1fr_auto] md:items-end">
                          <label className="text-xs font-medium">
                            الدرجة (من {answer.question.points})
                            <input name="score" type="number" min="0" max={answer.question.points} step="0.01" required defaultValue={answer.manual_score ?? ""} className="mt-1 w-full rounded-lg border border-studio-border bg-background px-3 py-2 text-sm" />
                          </label>
                          <label className="text-xs font-medium">
                            ملاحظات للطالب
                            <input name="feedback" maxLength={5000} defaultValue={answer.feedback ?? ""} className="mt-1 w-full rounded-lg border border-studio-border bg-background px-3 py-2 text-sm" placeholder="أضف ملاحظات أو توجيهات..." />
                          </label>
                          <button disabled={busySubmission === answer.id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                            {busySubmission === answer.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            حفظ التصحيح
                          </button>
                        </form>
                      </article>
                    ))
                  )}
                </section>
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">تسليمات الواجبات</h2>
                    <p className="mt-1 text-sm text-muted-foreground">التسليمات في دوراتك المسندة إليك.</p>
                  </div>
                  {submissions.length === 0 ? <EmptyState text="لا توجد تسليمات واجبات تنتظر التصحيح." /> : (
                    <div className="space-y-4">
                      {submissions.map((submission) => (
                        <article key={submission.id} className="rounded-2xl border border-studio-border bg-studio-panel p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-primary">{submission.assignment.course || "دورة"}</p>
                          <h2 className="mt-1 font-semibold">{submission.assignment.title}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{submission.student.name} · {submission.student.email}</p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700">{formatDate(submission.submitted_at)}</span>
                      </div>
                      {submission.notes && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-studio-bg p-3 text-sm">{submission.notes}</p>}
                      {submission.files.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {submission.files.map((file, index) => file.url ? (
                            <a key={`${submission.id}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="rounded-lg border border-studio-border px-3 py-2 text-xs text-primary hover:underline">
                              {file.title || "عرض ملف التسليم"}
                            </a>
                          ) : null)}
                        </div>
                      )}
                      <form onSubmit={(event) => void submitGrade(event, submission)} className="mt-4 grid gap-3 border-t border-studio-border pt-4 md:grid-cols-[140px_1fr_auto] md:items-end">
                        <label className="text-xs font-medium">
                          الدرجة (من {submission.assignment.max_score})
                          <input name="score" type="number" min="0" max={submission.assignment.max_score} required className="mt-1 w-full rounded-lg border border-studio-border bg-background px-3 py-2 text-sm" />
                        </label>
                        <label className="text-xs font-medium">
                          ملاحظات للطالب
                          <input name="feedback" maxLength={5000} className="mt-1 w-full rounded-lg border border-studio-border bg-background px-3 py-2 text-sm" placeholder="أضف ملاحظات أو توجيهات..." />
                        </label>
                        <button disabled={busySubmission === submission.id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                          {busySubmission === submission.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          حفظ التصحيح
                        </button>
                      </form>
                    </article>
                  ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <>
      {topBar}
      {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {loading ? <LoadingPanel /> : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="الدورات" value={metrics?.courses} icon={BookOpen} href="/instructor/courses" />
            <MetricCard label="الطلاب" value={metrics?.students} icon={Users} href="/instructor/students" />
            <MetricCard label="ملفات الوسائط" value={metrics?.media} icon={FileImage} href="/instructor/media" />
            <MetricCard label="الاختبارات" value={metrics?.exams} icon={GraduationCap} href="/instructor/exams" />
            <MetricCard label="اختبارات الدورات" value={metrics?.quizzes} icon={ClipboardCheck} href="/instructor/courses" />
            <MetricCard label="تسليمات تنتظر التصحيح" value={metrics?.pending_grading} icon={ClipboardCheck} href="/instructor/grading" />
          </section>
          <section className="mt-6 rounded-2xl border border-studio-border bg-studio-panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">ابدأ من هنا</h2>
                <p className="mt-1 text-sm text-muted-foreground">أنشئ دورة جديدة أو تابع مهامك التعليمية.</p>
              </div>
              <Link href="/instructor/courses/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                إنشاء دورة <ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <QuickLink href="/instructor/courses" icon={BookOpen} label="إدارة دوراتي" />
              <QuickLink href="/instructor/grading" icon={ClipboardCheck} label="مراجعة التسليمات" />
              <QuickLink href="/instructor/profile" icon={Users} label="تحديث ملفي الشخصي" />
            </div>
          </section>
        </>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | undefined;
  icon: typeof BookOpen;
  href: string;
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-studio-border bg-studio-panel p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <ArrowUpLeft className="h-4 w-4 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-primary" aria-hidden="true" />
      </div>
      <p className="mt-5 text-3xl font-bold tabular-nums">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof BookOpen; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-studio-border p-3 text-sm transition hover:border-primary hover:bg-studio-bg">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      {label}
    </Link>
  );
}

function Avatar({ name, image }: { name: string | null; image: string | null }) {
  return image
    ? <img src={image} alt="" className="h-9 w-9 rounded-full object-cover" />
    : <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{name?.slice(0, 1) || "ط"}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-studio-border bg-studio-panel px-5 py-12 text-center text-sm text-muted-foreground">{text}</div>;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAnswer(answer: unknown): string {
  if (typeof answer === "string") return answer;
  if (answer === null || answer === undefined) return "لم تُسجّل إجابة نصية.";
  return JSON.stringify(answer, null, 2);
}
