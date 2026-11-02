"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Check,
  Clock3,
  Globe2,
  GraduationCap,
  Linkedin,
  Mail,
  Phone,
  Sparkles,
  UserRound,
  Youtube,
} from "lucide-react";
import { AppButton } from "@/components/ui";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { instructorApi, instructorApiErrorMessage } from "@/features/instructors/api";
import { useInstructorAuthStore } from "@/features/instructors/store";
import type { InstructorMembership, InstructorUser } from "@/features/instructors/types";

type ProfileValues = {
  firstName: string;
  lastName: string;
  avatar: string;
  jobTitle: string;
  department: string;
  phone: string;
  bio: string;
  expertise: string;
  experienceYears: string;
  websiteUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
};

function splitName(name: string): [string, string] {
  const [first = "", ...rest] = name.trim().split(/\s+/);
  return [first, rest.join(" ")];
}

function textInputClass(): string {
  return "w-full rounded-xl border border-studio-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10";
}

function ProfileField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>}
    </label>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function InstructorProfileForm({
  user,
  membership,
  accessToken,
}: {
  user: InstructorUser;
  membership: InstructorMembership;
  accessToken: string | null;
}) {
  const updateUser = useInstructorAuthStore((state) => state.updateUser);
  const updateMembership = useInstructorAuthStore((state) => state.updateMembership);
  const [firstName, fallbackLastName] = splitName(user.name);
  const [values, setValues] = useState<ProfileValues>({
    firstName: membership.first_name || firstName,
    lastName: membership.last_name || fallbackLastName,
    avatar: user.avatar ?? "",
    jobTitle: membership.job_title ?? "",
    department: membership.department ?? "",
    phone: membership.phone ?? "",
    bio: membership.bio ?? "",
    expertise: membership.expertise ?? "",
    experienceYears: membership.experience_years == null ? "" : String(membership.experience_years),
    websiteUrl: membership.website_url ?? "",
    linkedinUrl: membership.linkedin_url ?? "",
    youtubeUrl: membership.youtube_url ?? "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const profileCompletion = useMemo(() => {
    const checks = [
      values.firstName,
      values.lastName,
      values.avatar,
      values.jobTitle,
      values.department,
      values.phone,
      values.bio,
      values.expertise,
      values.experienceYears,
      values.websiteUrl || values.linkedinUrl || values.youtubeUrl,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [values]);

  function update<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    setError("");
    setNotice("");
    try {
      const response = await instructorApi.uploadMediaFile(accessToken, file);
      const assetUrl = response.data.asset.cdnUrl ?? response.data.asset.thumbnailUrl;
      if (!assetUrl) throw new Error("تعذر الحصول على رابط الصورة بعد رفعها.");
      update("avatar", new URL(assetUrl, window.location.origin).toString());
      setNotice("رُفعت الصورة إلى مكتبة الوسائط. احفظ التغييرات لتحديث ملفك.");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await instructorApi.updateProfile(accessToken, {
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        avatar: values.avatar.trim() || null,
        job_title: values.jobTitle.trim(),
        department: values.department.trim(),
        phone: values.phone.trim(),
        bio: values.bio.trim(),
        expertise: values.expertise.trim(),
        experience_years: values.experienceYears ? Number(values.experienceYears) : null,
        website_url: values.websiteUrl.trim() || null,
        linkedin_url: values.linkedinUrl.trim() || null,
        youtube_url: values.youtubeUrl.trim() || null,
      });
      updateUser(response.user);
      updateMembership(response.membership);
      setNotice("تم حفظ ملفك الشخصي بنجاح.");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  const memberSince = membership.joined_at
    ? new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(new Date(membership.joined_at))
    : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/instructor"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            <ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
            العودة إلى مساحة العمل
          </Link>
          <p className="mt-5 text-sm font-semibold text-primary">حضورك المهني</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">ملفي الشخصي</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            عرّف الطلاب بخبرتك وأسلوبك التعليمي. تظهر المعلومات المهنية التي تضيفها على ملفك العام وصفحات دوراتك.
          </p>
        </div>
        <span className="hidden h-14 w-14 place-items-center rounded-2xl border border-primary/15 bg-primary/5 text-primary sm:grid">
          <Sparkles className="h-7 w-7" aria-hidden="true" />
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <div
              role="img"
              aria-label={user.name || "الصورة الشخصية"}
              className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-background bg-primary/10 text-3xl font-bold text-primary shadow-xl ring-1 ring-primary/20 sm:h-32 sm:w-32"
            >
              {values.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                `${values.firstName.slice(0, 1)}${values.lastName.slice(0, 1)}` || <UserRound className="h-10 w-10" />
              )}
            </div>
            <label
              htmlFor="instructor-avatar"
              className="absolute bottom-1 end-1 grid h-10 w-10 cursor-pointer place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg transition hover:scale-105"
              aria-label="تغيير الصورة الشخصية"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
            </label>
            <input
              id="instructor-avatar"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={uploadAvatar}
              className="sr-only"
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold text-primary">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              ملف المدرّب
            </span>
            <h2 className="mt-3 truncate text-2xl font-bold text-foreground">
              {[values.firstName, values.lastName].filter(Boolean).join(" ") || "اسم المدرّب"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{values.jobTitle || "أضف مسماك المهني"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {values.department && (
                <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">{values.department}</span>
              )}
              {values.expertise && (
                <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">{values.expertise}</span>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {uploading ? "جارٍ رفع الصورة إلى مكتبة الأكاديمية..." : "اضغط على أيقونة الكاميرا لتحديث صورتك"}
            </p>
          </div>

          <div className="w-full rounded-2xl border border-studio-border bg-background/80 p-4 sm:w-52">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">اكتمال الملف</span>
              <span className="text-sm font-bold tabular-nums text-primary">{profileCompletion}%</span>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="اكتمال الملف الشخصي"
              aria-valuenow={profileCompletion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-gradient-to-l from-primary to-primary/60 transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">أكمل بياناتك لتمنح الطلاب صورة أوضح عن خبرتك.</p>
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-studio-border bg-studio-panel p-5 shadow-sm sm:p-7">
            <SectionHeading
              icon={UserRound}
              title="المعلومات الأساسية"
              description="استخدم اسمك الحقيقي وبيانات التواصل التي ترغب بمشاركتها مع طلابك."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ProfileField label="الاسم الأول">
                <input required maxLength={100} autoComplete="given-name" className={textInputClass()} value={values.firstName} onChange={(event) => update("firstName", event.target.value)} />
              </ProfileField>
              <ProfileField label="اسم العائلة">
                <input required maxLength={100} autoComplete="family-name" className={textInputClass()} value={values.lastName} onChange={(event) => update("lastName", event.target.value)} />
              </ProfileField>
              <ProfileField label="البريد الإلكتروني" hint="لأمان حسابك، لا يمكن تغيير البريد من هذه الصفحة.">
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input readOnly value={user.email} dir="ltr" className={`${textInputClass()} bg-muted/50 ps-10`} />
                </div>
              </ProfileField>
              <ProfileField label="رقم الهاتف">
                <div className="relative">
                  <Phone className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input type="tel" maxLength={30} autoComplete="tel" className={`${textInputClass()} ps-10`} value={values.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+20" />
                </div>
              </ProfileField>
            </div>
          </section>

          <section className="rounded-3xl border border-studio-border bg-studio-panel p-5 shadow-sm sm:p-7">
            <SectionHeading
              icon={BriefcaseBusiness}
              title="الهوية والخبرة المهنية"
              description="أبرز تخصصك والمجالات التي تستطيع مساعدة الطلاب فيها."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ProfileField label="المسمى المهني" hint="مثال: مدرّب رياضيات، استشاري تعليم">
                <input maxLength={255} autoComplete="organization-title" className={textInputClass()} value={values.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} />
              </ProfileField>
              <ProfileField label="القسم أو المجال">
                <input maxLength={255} className={textInputClass()} value={values.department} onChange={(event) => update("department", event.target.value)} placeholder="مثال: العلوم والهندسة" />
              </ProfileField>
              <ProfileField label="التخصص الدقيق">
                <input maxLength={255} className={textInputClass()} value={values.expertise} onChange={(event) => update("expertise", event.target.value)} placeholder="مثال: الجبر الخطي" />
              </ProfileField>
              <ProfileField label="سنوات الخبرة">
                <input type="number" min={0} max={80} inputMode="numeric" className={textInputClass()} value={values.experienceYears} onChange={(event) => update("experienceYears", event.target.value)} placeholder="مثال: 8" />
              </ProfileField>
              <div className="sm:col-span-2">
                <ProfileField label="نبذة تعريفية" hint="اكتب نبذة واضحة ومختصرة عن خبرتك وطريقتك في التدريس (حتى 2000 حرف).">
                  <textarea rows={5} maxLength={2000} className={`${textInputClass()} resize-y leading-7`} value={values.bio} onChange={(event) => update("bio", event.target.value)} placeholder="عرّف الطلاب بخبرتك، وما يميز أسلوبك التعليمي، والنتائج التي تساعدهم على تحقيقها..." />
                  <span className="mt-1 block text-end text-xs text-muted-foreground">{values.bio.length} / 2000</span>
                </ProfileField>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-studio-border bg-studio-panel p-5 shadow-sm sm:p-7">
            <SectionHeading
              icon={Globe2}
              title="روابطك المهنية"
              description="أضف روابط اختيارية ليتمكن الطلاب من التعرف على أعمالك ومحتواك."
            />
            <div className="space-y-4">
              <ProfileField label="موقعك أو معرض أعمالك">
                <div className="relative">
                  <Globe2 className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input type="url" maxLength={2048} dir="ltr" className={`${textInputClass()} ps-10`} value={values.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} placeholder="https://example.com" />
                </div>
              </ProfileField>
              <ProfileField label="LinkedIn">
                <div className="relative">
                  <Linkedin className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input type="url" maxLength={2048} dir="ltr" className={`${textInputClass()} ps-10`} value={values.linkedinUrl} onChange={(event) => update("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/your-profile" />
                </div>
              </ProfileField>
              <ProfileField label="قناة YouTube">
                <div className="relative">
                  <Youtube className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input type="url" maxLength={2048} dir="ltr" className={`${textInputClass()} ps-10`} value={values.youtubeUrl} onChange={(event) => update("youtubeUrl", event.target.value)} placeholder="https://youtube.com/@your-channel" />
                </div>
              </ProfileField>
            </div>
          </section>

          {error && <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
          {notice && (
            <p role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {notice}
            </p>
          )}
          {membership.must_change_password && (
            <p role="status" className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
              يجب تغيير كلمة المرور قبل استخدام باقي خصائص الحساب.
            </p>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link href="/instructor" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-studio-border px-5 text-sm font-semibold transition hover:bg-studio-hover">
              إلغاء
            </Link>
            <AppButton type="submit" disabled={saving || uploading || !values.firstName.trim() || !values.lastName.trim()} loading={saving}>
              حفظ التغييرات
            </AppButton>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-3xl border border-studio-border bg-studio-panel p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold">ملفك أمام الطلاب</h2>
                <p className="text-xs text-muted-foreground">معلومات تساعد على بناء الثقة</p>
              </div>
            </div>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-muted-foreground">{values.jobTitle || "أضف مسماك المهني"}</span>
              </li>
              <li className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-muted-foreground">{values.expertise || "حدّد تخصصك الدقيق"}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-muted-foreground">
                  {values.experienceYears ? `${values.experienceYears} سنوات من الخبرة` : "أضف سنوات خبرتك"}
                </span>
              </li>
            </ul>
            {values.bio && <p className="mt-5 border-t border-studio-border pt-4 text-sm leading-7 text-muted-foreground">{values.bio}</p>}
          </section>

          <section className="rounded-3xl border border-studio-border bg-studio-panel p-5 shadow-sm">
            <h2 className="font-bold">معلومات الحساب</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">البريد الإلكتروني</dt>
                <dd className="mt-1 break-all font-medium" dir="ltr">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">حالة الحساب</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5 font-medium">
                  <span className={`h-2 w-2 rounded-full ${membership.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {membership.status === "active" ? "نشط" : "قيد المراجعة"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">عضو منذ</dt>
                <dd className="mt-1 font-medium">{memberSince}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">رقم العضوية</dt>
                <dd className="mt-1 font-medium tabular-nums">#{membership.id}</dd>
              </div>
            </dl>
          </section>
          <p className="px-2 text-xs leading-6 text-muted-foreground">
            بيانات هذا الملف خاصة بعضويتك في الأكاديمية، ولا تظهر إلا المعلومات المهنية التي تضيفها.
          </p>
        </aside>
      </form>
    </div>
  );
}

export default function InstructorProfilePage() {
  const { user, membership, accessToken } = useInstructorAuth();

  if (!user || !membership) {
    return <p className="py-16 text-center text-sm text-muted-foreground">جارٍ تحميل بيانات الملف الشخصي...</p>;
  }

  return <InstructorProfileForm key={membership.id} user={user} membership={membership} accessToken={accessToken} />;
}
