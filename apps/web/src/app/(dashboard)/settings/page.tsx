"use client";

import { useState, useEffect, useCallback } from "react";
import { Save } from "lucide-react";
import {
  AppPage, AppPageHeader, AppSection, AppDivider, AppButton,
  AppInput, AppTextarea, AppSelect, AppSelectItem, AppSwitch, AppTabs,
  AppTabsList, AppTabsTrigger, AppTabsContent, AppCard,
  AppLoadingState, AppErrorState,
} from "@/components/ui";
import { useSettings, useUpdateSettingsGroup } from "@/features/settings/hooks";

function SettingsPage() {
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const updateSettings = useUpdateSettingsGroup();

  const [formState, setFormState] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (settings) setFormState(settings as Record<string, Record<string, unknown>>);
  }, [settings]);

  const updateField = useCallback((group: string, key: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [group]: { ...(prev[group] ?? {}), [key]: value },
    }));
  }, []);

  const saveGroup = useCallback((group: string) => {
    updateSettings.mutate({ group, values: formState[group] ?? {} });
  }, [formState, updateSettings]);

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;

  const groups = Object.keys(formState);

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader title="الإعدادات" description="إعدادات الأكاديمية" />
      <AppDivider className="mb-8" />

      <AppTabs defaultValue={groups[0] ?? "profile"}>
        <AppTabsList>
          {groups.map((group) => (
            <AppTabsTrigger key={group} value={group}>
              {group === "profile" ? "الملف الشخصي" :
               group === "branding" ? "العلامة التجارية" :
               group === "locale" ? "اللغة والتنسيق" :
               group === "notifications" ? "الإشعارات" :
               group === "enrollment" ? "التسجيل" :
               group === "video" ? "الفيديو" :
               group === "storage" ? "التخزين" :
               group === "setup" ? "الإعداد" : group}
            </AppTabsTrigger>
          ))}
        </AppTabsList>

        {groups.map((group) => (
          <AppTabsContent key={group} value={group} className="mt-6">
            <AppCard className="p-6">
              <div className="space-y-4">
                {Object.entries(formState[group] ?? {}).map(([key, value]) => (
                  <div key={key}>
                    {typeof value === "boolean" ? (
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{key}</label>
                        <AppSwitch checked={value as boolean} onCheckedChange={(v) => updateField(group, key, v)} />
                      </div>
                    ) : typeof value === "string" && value.length > 100 ? (
                      <div>
                        <label className="text-sm font-medium block mb-1">{key}</label>
                        <AppTextarea value={value as string} onChange={(e) => updateField(group, key, e.target.value)} />
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium block mb-1">{key}</label>
                        <AppInput value={String(value ?? "")} onChange={(e) => updateField(group, key, e.target.value)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <AppButton onClick={() => saveGroup(group)} loading={updateSettings.isPending}>
                  <Save className="h-4 w-4 ml-1" /> حفظ
                </AppButton>
              </div>
            </AppCard>
          </AppTabsContent>
        ))}
      </AppTabs>
    </AppPage>
  );
}

export default SettingsPage;
