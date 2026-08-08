"use client";

import { useState, useCallback } from "react";
import { Save, Globe, ImageIcon } from "lucide-react";
import {
  AppPage, AppPageHeader, AppDivider, AppButton,
  AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent,
  AppInput, Label,
  AppLoadingState, AppErrorState,
} from "@/components/ui";
import { useSiteSettings, useUpdateSiteSettings } from "@/features/settings/hooks";
import type { SiteSettings } from "@/features/settings/types";
import { useTenantStore } from "@/stores/tenant.store";
import { ChooseMediaButton } from "@/features/media-library/components/ChooseMediaButton";
import { mediaLibraryService } from "@/features/media-library/services";
import { toAbsoluteAssetUrl } from "@/lib/url";

function SiteForm({ initial }: { initial: SiteSettings }) {
  const updateSite = useUpdateSiteSettings();
  const setTenantSite = useTenantStore((s) => s.setTenantSite);

  const [name, setName] = useState(initial.name ?? "");
  const [favicon, setFavicon] = useState(initial.favicon ?? "");

  const handleSave = useCallback(() => {
    const values: Partial<SiteSettings> = {
      favicon: favicon.trim() || null,
    };
    const trimmedName = name.trim();
    if (trimmedName) values.name = trimmedName;

    updateSite.mutate(values, {
      onSuccess: (result) => {
        setTenantSite({
          name: result.name,
          favicon: result.favicon ?? null,
        });
      },
    });
  }, [name, favicon, updateSite, setTenantSite]);

  return (
    <div className="space-y-8">
      {/* Site name */}
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> اسم الموقع
          </AppCardTitle>
          <AppCardDescription>
            يظهر في شريط لوحة التحكم والصفحة الرئيسية
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>اسم الأكاديمية</Label>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أكاديمية المستقبل"
              maxLength={255}
            />
          </div>
          {name.trim() && (
            <div className="flex items-center gap-2 rounded-lg border border-studio-border bg-studio-soft px-3 py-2 text-sm">
              <span className="text-studio-fg-muted">معاينة:</span>
              <span className="font-semibold text-studio-fg">{name.trim()}</span>
            </div>
          )}
        </AppCardContent>
      </AppCard>

      {/* Favicon */}
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> أيقونة الموقع (Favicon)
          </AppCardTitle>
          <AppCardDescription>
            اختر الأيقونة من مكتبة الوسائط أو الصق رابط الصورة هنا
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>رابط الأيقونة</Label>
            <AppInput
              dir="ltr"
              value={favicon}
              onChange={(e) => setFavicon(e.target.value)}
              placeholder="https://example.com/favicon.png"
              maxLength={2048}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ChooseMediaButton
              mode="single"
              allowedTypes={["image"]}
              label="اختيار من مكتبة الوسائط"
              onSelect={async (result) => {
                try {
                  const asset = await mediaLibraryService.getAsset(result.id);
                  const url = toAbsoluteAssetUrl(asset?.cdnUrl);
                  if (url) setFavicon(url);
                } catch {
                  /* ignore */
                }
              }}
            />
            {favicon.trim() && (
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setFavicon("")}
              >
                إزالة الأيقونة
              </AppButton>
            )}
          </div>
          {favicon.trim() && (
            <div className="flex items-center gap-3 rounded-lg border border-studio-border bg-studio-soft px-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={favicon.trim()}
                alt="معاينة الأيقونة"
                className="h-10 w-10 rounded-md border border-studio-border bg-white object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.2";
                }}
                onLoad={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "1";
                }}
              />
              <div className="text-sm">
                <div className="font-medium text-studio-fg">معاينة حية</div>
                <div className="text-xs text-studio-fg-muted">ستظهر في تبويب المتصفح</div>
              </div>
            </div>
          )}
        </AppCardContent>
      </AppCard>

      {/* Actions */}
      <div className="flex justify-end">
        <AppButton onClick={handleSave} loading={updateSite.isPending}>
          <Save className="h-4 w-4 ml-1" /> حفظ إعدادات الموقع
        </AppButton>
      </div>
    </div>
  );
}

function SiteSettingsPage() {
  const { data, isLoading, isError, refetch } = useSiteSettings();

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader
        title="إعدادات الموقع"
        description="عدّل اسم الموقع وأيقونة المتصفح (favicon) الخاصة بالأكاديمية"
      />
      <AppDivider className="mb-8" />

      <SiteForm initial={data} />
    </AppPage>
  );
}

export default SiteSettingsPage;
