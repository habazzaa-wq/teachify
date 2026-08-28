"use client";

import { useState, useCallback, createElement } from "react";
import {
  Save,
  Image as ImageIcon,
  Type,
  Check,
  Sparkles,
  Trash2,
  Palette,
} from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppDivider,
  AppButton,
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardDescription,
  AppCardContent,
  AppInput,
  Label,
  AppLoadingState,
  AppErrorState,
} from "@/components/ui";
import { usePlatformBranding, useUpdatePlatformBranding } from "@/features/settings/hooks";
import type { SiteSettings } from "@/features/settings/types";
import { NAVBAR_ICON_OPTIONS, getNavbarIcon } from "@/features/settings/constants/navbar-icons";
import { useTenantStore } from "@/stores/tenant.store";
import { ChooseMediaButton } from "@/features/media-library/components/ChooseMediaButton";
import { mediaLibraryService } from "@/features/media-library/services";
import { toAbsoluteAssetUrl } from "@/lib/url";
import { cn } from "@/lib/cn";
import { BRAND_PRIMARY_DEFAULT, BRAND_SECONDARY_DEFAULT } from "@/lib/brand";

function NavbarLogoPreview({
  logoType,
  logoIcon,
  logoImage,
  name,
  primaryColor,
}: {
  logoType: string | null;
  logoIcon: string | null;
  logoImage: string | null;
  name: string;
  primaryColor: string;
}) {
  const icon = getNavbarIcon(logoIcon);
  const showIcon = logoType === "icon" && !!icon;
  const showImage = (logoType === "image" || (!logoType && logoImage)) && !!logoImage;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3">
      <div className="flex items-center gap-2.5">
        {showImage ? (
          <div className="relative h-9 w-[180px] shrink-0 overflow-hidden rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoImage}
              alt={name}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0.3";
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.opacity = "1";
              }}
            />
          </div>
        ) : (
          <div
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            {showIcon && icon ? (
              createElement(icon, { className: "h-5 w-5 text-white" })
            ) : (
              <Sparkles className="h-5 w-5 text-white" />
            )}
          </div>
        )}
        <span className="text-lg font-bold tracking-tight" style={{ color: primaryColor }}>
          {name || "اسم المنصة"}
        </span>
      </div>
      <span className="me-1 ms-auto hidden text-xs text-muted-foreground sm:block">
        معاينة شريط التنقّل
      </span>
    </div>
  );
}

function BrandingForm({ initial }: { initial: SiteSettings }) {
  const updatePlatform = useUpdatePlatformBranding();
  const setPlatformBranding = useTenantStore((s) => s.setPlatformBranding);

  const [name, setName] = useState(initial.name ?? "");
  const [logoType, setLogoType] = useState<string | null>(initial.logoType ?? null);
  const [logoIcon, setLogoIcon] = useState<string | null>(initial.logoIcon ?? null);
  const [logoImage, setLogoImage] = useState<string | null>(initial.logoImage ?? null);
  // افتراضياً استخدم ألوان الموقع الفعلية (#D87B63 / #FFB50E) حتى لو كانت
  // القيم المخزّنة فارغة (null/undefined/"").
  const [primaryColor, setPrimaryColor] = useState<string>(
    (initial.primaryColor ?? initial.primary_color ?? "").trim() || BRAND_PRIMARY_DEFAULT,
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    (initial.secondaryColor ?? initial.secondary_color ?? "").trim() || BRAND_SECONDARY_DEFAULT,
  );

  // يطبّق اللونين فوراً على كامل المنصة (the-mechanist.com) أثناء التعديل —
  // من غير انتظار الحفظ — عن طريق تحديث متجر platformBranding اللي بيقريء منه
  // BrandThemeProvider ويغيّر متغيرات CSS فوراً.
  const applyLive = useCallback(
    (primary: string, secondary: string) => {
      setPlatformBranding({ primaryColor: primary, secondaryColor: secondary });
    },
    [setPlatformBranding],
  );

  const handleSave = useCallback(() => {
    const values: Partial<SiteSettings> = {
      name: name.trim(),
      logo_type: logoType,
      logo_icon: logoType === "icon" ? (logoIcon ?? null) : null,
      logo_image: logoType === "image" ? (logoImage ?? null) : null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    };

    updatePlatform.mutate(values, {
      onSuccess: (result) => {
        setPlatformBranding({
          logo: result.logo ?? null,
          favicon: result.favicon ?? null,
          primaryColor: result.primaryColor ?? result.primary_color ?? primaryColor,
          secondaryColor: result.secondaryColor ?? result.secondary_color ?? secondaryColor,
          logoType: result.logoType ?? result.logo_type ?? null,
          logoIcon: result.logoIcon ?? result.logo_icon ?? null,
          logoImage: result.logoImage ?? result.logo_image ?? null,
          font: result.font ?? null,
        });
      },
    });
  }, [name, logoType, logoIcon, logoImage, primaryColor, secondaryColor, updatePlatform, setPlatformBranding]);

  const canSave = name.trim().length > 0 && (logoType !== "icon" || !!logoIcon);

  return (
    <div className="space-y-8">
      {/* Platform name */}
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4" /> اسم المنصة
          </AppCardTitle>
          <AppCardDescription>
            الاسم الذي يظهر بجوار الشعار في شريط التنقّل أعلى الصفحة الرئيسية
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>اسم المنصة</Label>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الميكانيكست"
              maxLength={255}
            />
          </div>
        </AppCardContent>
      </AppCard>

      {/* Logo type */}
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> شعار المنصة
          </AppCardTitle>
          <AppCardDescription>
            اختر شعاراً من مكتبة الأيقونات أو صورة من مكتبة الوسائط
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-6">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLogoType("icon")}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all hover:shadow-md",
                logoType === "icon"
                  ? "border-studio-accent ring-2 ring-studio-accent/30"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <Sparkles className="h-6 w-6 text-studio-accent" />
              <span className="text-sm font-semibold">أيقونة جاهزة</span>
              <span className="text-xs text-muted-foreground">من مكتبة الأيقونات</span>
              {logoType === "icon" && (
                <span className="absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-studio-accent text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLogoType("image")}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all hover:shadow-md",
                logoType === "image"
                  ? "border-studio-accent ring-2 ring-studio-accent/30"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <ImageIcon className="h-6 w-6 text-studio-accent" />
              <span className="text-sm font-semibold">صورة</span>
              <span className="text-xs text-muted-foreground">من مكتبة الوسائط</span>
              {logoType === "image" && (
                <span className="absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-studio-accent text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </div>

          {/* Icon picker */}
          {logoType === "icon" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>اختر الأيقونة</Label>
                {logoIcon && (
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setLogoIcon(null)}
                  >
                    <Trash2 className="h-4 w-4" /> إزالة
                  </AppButton>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {NAVBAR_ICON_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = logoIcon === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      title={option.label}
                      onClick={() => setLogoIcon(option.key)}
                      className={cn(
                        "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all hover:scale-105",
                        active
                          ? "border-studio-accent bg-studio-accent/10 text-studio-accent"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="max-w-full truncate px-1 text-[10px] leading-none">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image picker */}
          {logoType === "image" && (
            <div className="space-y-4">
              <div>
                <Label>صورة الشعار</Label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <ChooseMediaButton
                    mode="single"
                    allowedTypes={["image"]}
                    label={logoImage ? "تغيير الصورة" : "اختيار صورة من مكتبة الوسائط"}
                    onSelect={async (result) => {
                      try {
                        const asset = await mediaLibraryService.getAsset(result.id);
                        const url = toAbsoluteAssetUrl(asset?.cdnUrl);
                        if (url) setLogoImage(url);
                      } catch {
                        /* ignore */
                      }
                    }}
                  />
                  {logoImage && (
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setLogoImage(null)}
                    >
                      <Trash2 className="h-4 w-4" /> إزالة الصورة
                    </AppButton>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  يمكنك اختيار أي صورة مهما كان حجمها — سيتم ضبطها تلقائياً لتناسب شريط التنقّل
                </p>
              </div>

              {logoImage && (
                <div className="flex items-center gap-3 rounded-lg border border-studio-border bg-studio-soft px-3 py-3">
                  <div className="relative h-10 w-24 shrink-0 overflow-hidden rounded-md border border-studio-border bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoImage}
                      alt="معاينة الشعار"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "0.2";
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "1";
                      }}
                    />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-studio-fg">معاينة حية</div>
                    <div className="text-xs text-studio-fg-muted">
                      الصورة تُعرض بحجم مناسب دون تشويه ودون كسر تخطيط الصفحة
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AppCardContent>
      </AppCard>

      {/* Site colors */}
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> ألوان الموقع
          </AppCardTitle>
          <AppCardDescription>
            اللونان الأساسيان للمنصة — يظهران في شريط التنقّل والأزرار والكورسات وكامل صفحات الموقع
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Primary */}
            <div className="space-y-2 rounded-2xl border border-studio-border bg-studio-soft p-4">
              <Label>اللون الأساسي</Label>
              <div className="flex items-center gap-3">
                 <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setPrimaryColor(v);
                    applyLive(v, secondaryColor);
                  }}
                  className="h-12 w-12 shrink-0 cursor-pointer rounded-xl border border-studio-border bg-transparent p-1"
                  aria-label="اللون الأساسي"
                />
                <AppInput
                  value={primaryColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrimaryColor(v);
                    if (/^#[0-9A-Fa-f]{6}$/.test(v)) applyLive(v, secondaryColor);
                  }}
                  placeholder="#D87B63"
                  maxLength={7}
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                يُستخدم في الأزرار، العناصر النشطة، واسم المنصة
              </p>
            </div>

            {/* Secondary */}
            <div className="space-y-2 rounded-2xl border border-studio-border bg-studio-soft p-4">
              <Label>اللون الثانوي</Label>
              <div className="flex items-center gap-3">
                 <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setSecondaryColor(v);
                    applyLive(primaryColor, v);
                  }}
                  className="h-12 w-12 shrink-0 cursor-pointer rounded-xl border border-studio-border bg-transparent p-1"
                  aria-label="اللون الثانوي"
                />
                <AppInput
                  value={secondaryColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSecondaryColor(v);
                    if (/^#[0-9A-Fa-f]{6}$/.test(v)) applyLive(primaryColor, v);
                  }}
                  placeholder="#FFB50E"
                  maxLength={7}
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                يُستخدم في لمسات التحديد والـ hover والشارات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-studio-border bg-studio-surface p-4">
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 rounded-full border border-black/10"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="h-8 w-8 rounded-full border border-black/10"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
           <div className="text-sm text-studio-fg-muted">
               اللونان يُطبَّقان فوراً على كامل المنصة (the-mechanist.com) أثناء التعديل. احفظ لإبقائهما.
             </div>
          </div>
        </AppCardContent>
      </AppCard>

      {/* Live preview */}
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>معاينة حية</AppCardTitle>
          <AppCardDescription>هكذا سيظهر الشعار واسم المنصة في شريط التنقّل</AppCardDescription>
        </AppCardHeader>
        <AppCardContent>
          <NavbarLogoPreview
            logoType={logoType}
            logoIcon={logoIcon}
            logoImage={logoImage}
            name={name}
            primaryColor={primaryColor}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            المعاينة تعرض البيانات الحالية. احفظ التغييرات لتطبيقها على الموقع.
          </p>
        </AppCardContent>
      </AppCard>

      {/* Actions */}
      <div className="flex justify-end">
          <AppButton onClick={handleSave} loading={updatePlatform.isPending} disabled={!canSave}>
           <Save className="h-4 w-4 ml-1" /> حفظ الشعار والاسم والألوان
         </AppButton>
      </div>
    </div>
  );
}

function BrandingSettingsPage() {
  const { data, isLoading, isError, refetch } = usePlatformBranding();

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader
        title="الشعار واسم المنصة"
        description="تحكّم في اسم المنصة وشعارها الظاهر في شريط التنقّل بالصفحة الرئيسية"
      />
      <AppDivider className="mb-8" />

      <BrandingForm
        key={[data.name, data.logoType ?? data.logo_type, data.logoIcon ?? data.logo_icon, data.logoImage ?? data.logo_image, data.primaryColor ?? data.primary_color, data.secondaryColor ?? data.secondary_color].join("|")}
        initial={data}
      />
    </AppPage>
  );
}

export default BrandingSettingsPage;
