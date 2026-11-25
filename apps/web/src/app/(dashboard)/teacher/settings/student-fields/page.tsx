"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  AppButton,
  AppCard,
  AppDivider,
  AppErrorState,
  AppLoadingState,
  AppPage,
  AppPageHeader,
  AppSwitch,
} from "@/components/ui";
import { useSettingsGroup, useUpdateSettingsGroup } from "@/features/settings/hooks";
import {
  resolveStudentFieldConfig,
  STUDENT_FIELD_KEYS,
  STUDENT_FIELD_LABELS,
  type StudentFieldConfig,
  type StudentFieldKey,
} from "@/features/student-fields";
import { useTenantStore } from "@/stores/tenant.store";

const FIELD_DESCRIPTIONS: Record<StudentFieldKey, string> = {
  parent_phone: "يظهر في التسجيل ويمكن إضافته مرة واحدة فقط، وبعدها يصبح للقراءة فقط.",
  gender: "خيار الجنس في تسجيل الطالب وملفه الشخصي.",
  study_type: "نوع الدراسة (أونلاين / اوفلاين).",
  study_level: "المرحلة الدراسية للطالب.",
  nationality: "جنسية الطالب.",
  governorate: "محافظة الطالب.",
  city: "مدينة الطالب، وتظهر بعد اختيار المحافظة.",
};

export default function StudentFieldsSettingsPage() {
  const { data, isLoading, isError, refetch } = useSettingsGroup("student_fields");
  const updateSettings = useUpdateSettingsGroup();
  const setStudentFields = useTenantStore((s) => s.setStudentFields);
  // `draft` is null until the admin changes something; the form then reflects
  // the query data directly and only user edits are kept in local state.
  const [draft, setDraft] = useState<StudentFieldConfig | null>(null);
  // Accept both the unwrapped `values` object returned by `useSettingsGroup`
  // and a full API response. A saved `false` must never fall back to the
  // all-true defaults and get saved back, re-enabling a disabled field.
  const form = resolveStudentFieldConfig(data, draft);

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;

  const toggle = (key: StudentFieldKey, value: boolean) => {
    setDraft((prev) => ({ ...(prev ?? form), [key]: value }));
  };

  const save = () => {
    updateSettings.mutate(
      { group: "student_fields", values: form },
      {
        onSuccess: () => {
          setStudentFields(form);
          setDraft(null);
          toast.success("تم حفظ إعدادات حقول الطالب بنجاح.");
        },
        onError: () => toast.error("تعذر حفظ الإعدادات. حاول مرة أخرى."),
      },
    );
  };

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="حقول حساب الطالب"
        description="اختر البيانات التي تريد دعمها في هذه المنصة. الحقول المعطلة لا تظهر في فورم التسجيل أو إنشاء الطالب."
      />
      <AppDivider className="mb-8" />

      <AppCard className="p-6">
        <div className="mb-5 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          الحقول الأساسية (الاسم، البريد الإلكتروني، رقم الهاتف، كلمة المرور) مطلوبة دايمًا ولا يمكن تعطيلها.
        </div>

        <div className="divide-y">
          {STUDENT_FIELD_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{STUDENT_FIELD_LABELS[key]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{FIELD_DESCRIPTIONS[key]}</p>
              </div>
              <AppSwitch
                checked={form[key]}
                onCheckedChange={(value) => toggle(key, value)}
                aria-label={`تفعيل ${STUDENT_FIELD_LABELS[key]}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <AppButton onClick={save} loading={updateSettings.isPending}>
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </AppButton>
        </div>
      </AppCard>
    </AppPage>
  );
}
