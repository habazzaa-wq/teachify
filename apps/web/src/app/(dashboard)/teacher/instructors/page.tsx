"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppPage, AppPageHeader, AppSection } from "@/components/ui";
import {
  instructorAdminApi,
  type InstructorRemovalStrategy,
  type ManagedInstructor,
} from "@/features/instructors/admin-api";

export default function TenantInstructorsPage() {
  const [instructors, setInstructors] = useState<ManagedInstructor[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [removingInstructor, setRemovingInstructor] = useState<ManagedInstructor | null>(null);
  const [removalStrategy, setRemovalStrategy] = useState<InstructorRemovalStrategy>("delete_content");
  const [replacementInstructorId, setReplacementInstructorId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadInstructors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setInstructors(await instructorAdminApi.list());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل قائمة المدربين.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadInstructors);
  }, [loadInstructors]);

  async function createInstructor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setTemporaryPassword("");
    try {
      const result = await instructorAdminApi.create({ name: name.trim(), email: email.trim() });
      setTemporaryPassword(result.temporary_password);
      setName("");
      setEmail("");
      await loadInstructors();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إنشاء حساب المدرب.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleInstructorStatus(instructor: ManagedInstructor) {
    setActionInProgress(instructor.id);
    setError("");
    try {
      await instructorAdminApi.updateStatus(
        instructor.id,
        instructor.status === "active" ? "suspended" : "active",
      );
      await loadInstructors();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحديث حالة المدرب.");
    } finally {
      setActionInProgress(null);
    }
  }

  async function resetInstructorPassword(instructor: ManagedInstructor) {
    if (!window.confirm(`هل تريد إعادة تعيين كلمة مرور ${instructor.name}؟`)) return;
    setActionInProgress(instructor.id);
    setError("");
    setTemporaryPassword("");
    try {
      setTemporaryPassword(await instructorAdminApi.resetPassword(instructor.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إعادة تعيين كلمة المرور.");
    } finally {
      setActionInProgress(null);
    }
  }

  async function removeInstructor() {
    if (!removingInstructor) return;
    setActionInProgress(removingInstructor.id);
    setError("");
    try {
      await instructorAdminApi.remove(removingInstructor.id, {
        strategy: removalStrategy,
        ...(removalStrategy === "transfer_to_instructor"
          ? { target_instructor_id: Number(replacementInstructorId) }
          : {}),
      });
      setRemovingInstructor(null);
      await loadInstructors();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حذف المدرب.");
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة المدربين"
        description="إنشاء حسابات المدربين ومراجعة الدورات المرتبطة بكل مدرب."
      />

      <AppSection className="mt-6">
        <form onSubmit={createInstructor} className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2 text-sm font-medium">
            اسم المدرب
            <input
              required
              maxLength={255}
              className="w-full rounded-lg border bg-background px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            البريد الإلكتروني
            <input
              required
              type="email"
              maxLength={255}
              dir="ltr"
              className="w-full rounded-lg border bg-background px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="self-end rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "جارٍ الإنشاء..." : "إنشاء حساب"}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        {temporaryPassword && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="font-semibold">بيانات الدخول المؤقتة جاهزة. أرسلها للمدرب بأمان:</p>
            <p className="mt-2 text-sm">سيُطلب منه تغيير كلمة المرور عند أول تسجيل دخول أو بعد إعادة تعيينها.</p>
            <code dir="ltr" className="mt-3 block select-all rounded-lg bg-background p-3">{temporaryPassword}</code>
          </div>
        )}
      </AppSection>

      <AppSection className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">المدربون</h2>
          <button type="button" onClick={() => void loadInstructors()} className="rounded-lg border px-3 py-2 text-sm">
            تحديث
          </button>
        </div>
        {loading ? (
          <p className="rounded-xl border p-5 text-sm text-muted-foreground">جارٍ تحميل المدربين...</p>
        ) : instructors.length === 0 ? (
          <p className="rounded-xl border p-5 text-sm text-muted-foreground">لا يوجد مدربون بعد.</p>
        ) : (
          <div className="divide-y rounded-xl border bg-card">
            {instructors.map((instructor) => (
              <article key={instructor.id} className="flex flex-wrap items-center gap-4 p-4">
                {instructor.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={instructor.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-muted font-semibold">
                    {instructor.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{instructor.name}</h3>
                  <p dir="ltr" className="truncate text-sm text-muted-foreground">{instructor.email}</p>
                  {instructor.courses.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      الدورات: {instructor.courses.map((course) => course.title).join("، ")}
                    </p>
                  )}
                </div>
                <span className="mr-auto rounded-full bg-muted px-3 py-1 text-xs">
                  {instructor.status === "active" ? "نشط" : "موقوف"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionInProgress === instructor.id}
                    onClick={() => void toggleInstructorStatus(instructor)}
                    className="rounded-lg border px-3 py-2 text-xs disabled:opacity-60"
                  >
                    {instructor.status === "active" ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    disabled={actionInProgress === instructor.id}
                    onClick={() => void resetInstructorPassword(instructor)}
                    className="rounded-lg border px-3 py-2 text-xs disabled:opacity-60"
                  >
                    إعادة تعيين كلمة المرور
                  </button>
                  <button
                    type="button"
                    disabled={actionInProgress === instructor.id}
                    onClick={() => {
                      setRemovingInstructor(instructor);
                      setRemovalStrategy("delete_content");
                      setReplacementInstructorId("");
                    }}
                    className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive disabled:opacity-60"
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </AppSection>
      {removingInstructor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-instructor-title"
            className="w-full max-w-xl rounded-2xl border bg-card p-6 shadow-xl"
          >
            <h2 id="remove-instructor-title" className="text-xl font-bold">
              حذف المدرب {removingInstructor.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              اختر مصير محتوى المدرب والدورات المشتركة قبل حذف حسابه. لا يمكن للمدرب تسجيل الدخول بعد التأكيد.
            </p>
            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="removal-strategy"
                  checked={removalStrategy === "delete_content"}
                  onChange={() => setRemovalStrategy("delete_content")}
                />
                <span>
                  <span className="block font-semibold">حذف محتواه</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    حذف دوراته المنفردة واختباراته وأسئلته والوسائط غير المستخدمة. تبقى الدورات والملفات المشتركة للآخرين، وتظل سجلات الطلاب السابقة محفوظة.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="removal-strategy"
                  checked={removalStrategy === "transfer_to_instructor"}
                  onChange={() => setRemovalStrategy("transfer_to_instructor")}
                />
                <span>
                  <span className="block font-semibold">نقل محتواه إلى مدرب آخر</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    نقل ملكية الدورات والاختبارات والأسئلة والوسائط إلى مدرب نشط في هذا المستأجر.
                  </span>
                </span>
              </label>
              {removalStrategy === "transfer_to_instructor" && (
                <label className="block space-y-2 text-sm font-medium">
                  اختر المدرب البديل
                  <select
                    required
                    value={replacementInstructorId}
                    onChange={(event) => setReplacementInstructorId(event.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="">اختر مدرباً</option>
                    {instructors
                      .filter((candidate) => candidate.id !== removingInstructor.id && candidate.status === "active")
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                      ))}
                  </select>
                </label>
              )}
              <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="removal-strategy"
                  checked={removalStrategy === "transfer_to_tenant"}
                  onChange={() => setRemovalStrategy("transfer_to_tenant")}
                />
                <span>
                  <span className="block font-semibold">نقل المحتوى إلى إدارة المستأجر</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    تصبح الإدارة مالكة للمحتوى، مع الاحتفاظ باسم وصورة المدرب كإسناد ظاهر على دوراته.
                  </span>
                </span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemovingInstructor(null)}
                disabled={actionInProgress === removingInstructor.id}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => void removeInstructor()}
                disabled={
                  actionInProgress === removingInstructor.id
                  || (removalStrategy === "transfer_to_instructor" && !replacementInstructorId)
                }
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {actionInProgress === removingInstructor.id ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppPage>
  );
}
