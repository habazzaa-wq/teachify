"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { instructorApi, instructorApiErrorMessage } from "@/features/instructors/api";
import { useInstructorAuthStore } from "@/features/instructors/store";

export default function InstructorProfilePage() {
  const { user, membership, accessToken } = useInstructorAuth();
  const updateUser = useInstructorAuthStore((state) => state.updateUser);
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setAvatar(user?.avatar ?? "");
    setJobTitle(membership?.job_title ?? "");
    setDepartment(membership?.department ?? "");
  }, [membership?.department, membership?.job_title, user?.avatar, user?.name]);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    setError("");
    try {
      const response = await instructorApi.uploadMediaFile(accessToken, file);
      const assetUrl = response.data.asset.cdnUrl ?? response.data.asset.thumbnailUrl;
      if (!assetUrl) throw new Error("تعذر الحصول على رابط الصورة بعد رفعها.");
      setAvatar(new URL(assetUrl, window.location.origin).toString());
      setNotice("تم رفع الصورة إلى مكتبة الوسائط. احفظ الملف الشخصي لتطبيقها.");
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
        name: name.trim(),
        avatar: avatar.trim() || null,
        job_title: jobTitle.trim(),
        department: department.trim(),
      });
      updateUser(response.user);
      setName(response.user.name);
      setAvatar(response.user.avatar ?? "");
      setNotice("تم حفظ بيانات الملف الشخصي.");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link className="text-sm text-muted-foreground underline" href="/instructor/courses">
        العودة إلى لوحة المدرب
      </Link>
      <h1 className="mt-3 text-2xl font-bold">ملفي الشخصي</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        حدّث بياناتك وصورتك الظاهرة للطلاب في صفحة المدربين والدورات.
      </p>

      <form onSubmit={saveProfile} className="mt-6 space-y-5 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div
            role="img"
            aria-label={name || "صورة المدرب"}
            className="h-20 w-20 shrink-0 rounded-full border bg-muted bg-cover bg-center"
            style={avatar ? { backgroundImage: `url("${avatar}")` } : undefined}
          />
          <label className="space-y-2 text-sm font-medium">
            الصورة الشخصية
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={uploadAvatar}
              className="block max-w-full text-sm"
            />
            <span className="block text-xs font-normal text-muted-foreground">
              {uploading ? "جارٍ الرفع..." : "سيتم حفظ الصورة في مكتبة الوسائط الخاصة بالأكاديمية."}
            </span>
          </label>
        </div>

        <label className="block space-y-2 text-sm font-medium">
          الاسم
          <input
            required
            maxLength={255}
            className="w-full rounded-lg border bg-background px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          المسمى المهني
          <input
            maxLength={255}
            className="w-full rounded-lg border bg-background px-3 py-2"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          التخصص
          <input
            maxLength={255}
            className="w-full rounded-lg border bg-background px-3 py-2"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          />
        </label>

        <p dir="ltr" className="text-sm text-muted-foreground">{user?.email}</p>
        {membership?.must_change_password && (
          <p role="status" className="text-sm text-amber-700">يجب تغيير كلمة المرور قبل استخدام باقي خصائص الحساب.</p>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
        <button
          type="submit"
          disabled={saving || uploading || !name.trim()}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ الملف الشخصي"}
        </button>
      </form>
    </main>
  );
}
