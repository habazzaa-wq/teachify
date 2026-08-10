"use client";

import { useState, useCallback } from "react";
import { Save, Globe, ImageIcon, Type } from "lucide-react";
import {
  AppPage, AppPageHeader, AppDivider, AppButton,
  AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent,
  AppInput, Label,
  AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent,
  AppSelectGroup, AppSelectLabel, AppSelectItem,
  AppLoadingState, AppErrorState,
} from "@/components/ui";
import { useSiteSettings, useUpdateSiteSettings } from "@/features/settings/hooks";
import type { SiteSettings } from "@/features/settings/types";
import {
  GOOGLE_FONTS,
  FONT_CATEGORY_LABELS,
  getFontOption,
  buildFontStack,
} from "@/features/settings/constants/google-fonts";
import { useTenantStore } from "@/stores/tenant.store";
import { ChooseMediaButton } from "@/features/media-library/components/ChooseMediaButton";
import { mediaLibraryService } from "@/features/media-library/services";
import { toAbsoluteAssetUrl } from "@/lib/url";

const FONT_CATEGORY_ORDER = ["arabic", "professional", "serif", "display", "handwriting", "mono"] as const;

function SiteForm({ initial }: { initial: SiteSettings }) {
  const updateSite = useUpdateSiteSettings();
  const setTenantSite = useTenantStore((s) => s.setTenantSite);

  const [name, setName] = useState(initial.name ?? "");
  const [favicon, setFavicon] = useState(initial.favicon ?? "");
  const [font, setFont] = useState<string | null>(initial.font ?? null);

  const handleSave = useCallback(() => {
    const values: Partial<SiteSettings> = {
      favicon: favicon.trim() || null,
      font: font?.trim() || null,
    };
    const trimmedName = name.trim();
    if (trimmedName) values.name = trimmedName;

    updateSite.mutate(values, {
      onSuccess: (result) => {
        setTenantSite({
          name: result.name,
          favicon: result.favicon ?? null,
          font: result.font ?? null,
        });
      },
    });
  }, [name, favicon, font, updateSite, setTenantSite]);

  const selectedFont = getFontOption(font);

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

      {/* Font */}
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4" /> نوع الخط
          </AppCardTitle>
          <AppCardDescription>
            اختر الخط الذي سيُطبَّق على الموقع والمنصة بالكامل — لوحة التحكم، صفحات الدورات، وكل الأقسام
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>الخط</Label>
            <AppSelect
              value={font ?? ""}
              onValueChange={(value) => setFont(value === "__default__" ? null : value)}
            >
              <AppSelectTrigger className="w-full">
                <AppSelectValue placeholder="الخط الافتراضي (القاهرة)" />
              </AppSelectTrigger>
              <AppSelectContent className="max-h-[26rem]">
                <AppSelectGroup>
                  <AppSelectItem value="__default__">الخط الافتراضي (القاهرة)</AppSelectItem>
                </AppSelectGroup>
                {FONT_CATEGORY_ORDER.map((category) => (
                  <AppSelectGroup key={category}>
                    <AppSelectLabel>{FONT_CATEGORY_LABELS[category]}</AppSelectLabel>
                    {GOOGLE_FONTS.filter((option) => option.category === category).map((option) => (
                      <AppSelectItem key={option.family} value={option.family}>
                        <span style={{ fontFamily: `"${option.family}", "system-ui", "sans-serif"` }}>
                          {option.family}
                          <span className="ms-2 text-xs text-muted-foreground">— {option.label}</span>
                        </span>
                      </AppSelectItem>
                    ))}
                  </AppSelectGroup>
                ))}
              </AppSelectContent>
            </AppSelect>
          </div>

          <div
            className="rounded-lg border border-studio-border bg-studio-soft px-4 py-4"
            style={{ fontFamily: buildFontStack(font) ?? undefined }}
          >
            <div className="text-lg font-bold text-studio-fg">
              أهلاً بكم في منصتكم التعليمية
            </div>
            <div className="mt-1 text-sm text-studio-fg-muted" dir="ltr">
              The quick brown fox jumps over the lazy dog 0123456789
            </div>
            <div className="mt-2 text-xs text-studio-fg-subtle">
              {selectedFont
                ? `معاينة مباشرة بخط ${selectedFont.family}`
                : "الخط الافتراضي: القاهرة (Cairo)"}
            </div>
          </div>
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
        description="عدّل اسم الموقع وأيقونة المتصفح (favicon) ونوع الخط المُطبَّق على المنصة بالكامل"
      />
      <AppDivider className="mb-8" />

      <SiteForm initial={data} />
    </AppPage>
  );
}

export default SiteSettingsPage;
