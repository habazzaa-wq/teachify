"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { User, Phone, Youtube, Facebook, Gift, MessageCircle, Star } from "lucide-react";
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
  AppTextarea,
  AppSwitch,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
  AppLoadingState,
} from "@/components/ui";
import { ChooseMediaButton } from "@/features/media-library/components/ChooseMediaButton";
import { mediaLibraryService } from "@/features/media-library/services";
import { useHeroSettings, useUpdateHeroSettings } from "@/features/homepage/hero/hooks";
import { DEFAULT_HERO, type HeroSettings } from "@/features/homepage/hero/types";
import { HeroSection } from "@/components/home/HeroSection";

export default function HomepageHeroPage() {
  const { data, isLoading } = useHeroSettings();
  const updateHero = useUpdateHeroSettings();
  const [form, setForm] = useState<HeroSettings>(DEFAULT_HERO);

  useEffect(() => {
    if (data) {
      setForm({ ...DEFAULT_HERO, ...data });
    }
  }, [data]);

  const saving = updateHero.isPending;

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="البطاقة التعريفية"
        description="إدارة قسم الترحيب والتعريف بالمعلم في الصفحة الرئيسية"
      />
      <AppDivider className="mb-6" />

      <AppTabs defaultValue="content">
        <AppTabsList>
          <AppTabsTrigger value="content">المحتوى</AppTabsTrigger>
          <AppTabsTrigger value="social">روابط التواصل</AppTabsTrigger>
          <AppTabsTrigger value="preview">معاينة حية</AppTabsTrigger>
        </AppTabsList>

        {/* Content tab */}
        <AppTabsContent value="content">
          {isLoading ? (
            <AppLoadingState />
          ) : (
            <div className="space-y-6">
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>العنوان والوصف</AppCardTitle>
                  <AppCardDescription>
                    النص الذي يظهر في أعلى قسم الترحيب
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      عنوان القسم <span className="text-destructive">*</span>
                    </label>
                    <AppInput
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="مرحباً بكم في منصتنا التعليمية"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">الوصف الفرعي</label>
                    <AppTextarea
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="وصف مختصر للمنصة يظهر تحت العنوان"
                      rows={2}
                    />
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div>
                      <span className="text-sm font-medium">تفعيل القسم</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        إظهار قسم الترحيب في الصفحة الرئيسية
                      </p>
                    </div>
                    <AppSwitch
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                    />
                  </label>
                </AppCardContent>
              </AppCard>

              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>شارات التعريف</AppCardTitle>
                  <AppCardDescription>
                    الشارات التي تظهر في أعلى الزاويتين (يمين ويسار)
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">الشارة اليمنى</label>
                    <AppInput
                      value={form.badge1Text}
                      onChange={(e) => setForm({ ...form, badge1Text: e.target.value })}
                      placeholder="معلم محترف"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">الشارة اليسرى</label>
                    <AppInput
                      value={form.badge2Text}
                      onChange={(e) => setForm({ ...form, badge2Text: e.target.value })}
                      placeholder="خبرة 20+ سنة"
                    />
                  </div>
                </AppCardContent>
              </AppCard>

              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>صورة المعلم</AppCardTitle>
                  <AppCardDescription>
                    الصورة التي تظهر في الشكل الدائري في وسط القسم
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">اسم المعلم</label>
                    <AppInput
                      value={form.teacherName}
                      onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                      placeholder="الأستاذ / اسم المعلم"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">الصورة</label>
                    <div className="flex items-center gap-4">
                      {form.teacherImage ? (
                        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border">
                          <Image
                            src={form.teacherImage}
                            alt={form.teacherName || "المعلم"}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/40">
                          <User className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <ChooseMediaButton
                          mode="single"
                          allowedTypes={["image"]}
                          label={form.teacherImage ? "تغيير الصورة" : "اختيار صورة"}
                          onSelect={async (result) => {
                            try {
                              const asset = await mediaLibraryService.getAsset(result.id);
                              if (asset?.cdnUrl) {
                                setForm({ ...form, teacherImage: asset.cdnUrl });
                              }
                            } catch {
                              /* ignore */
                            }
                          }}
                        />
                        {form.teacherImage && (
                          <AppButton
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setForm({ ...form, teacherImage: "" })}
                          >
                            حذف الصورة
                          </AppButton>
                        )}
                      </div>
                    </div>
                  </div>
                </AppCardContent>
              </AppCard>

              <div className="flex justify-end">
                <AppButton
                  onClick={() => updateHero.mutate(form)}
                  loading={saving}
                  disabled={!form.title.trim()}
                >
                  حفظ الإعدادات
                </AppButton>
              </div>
            </div>
          )}
        </AppTabsContent>

        {/* Social links tab */}
        <AppTabsContent value="social">
          {isLoading ? (
            <AppLoadingState />
          ) : (
            <div className="space-y-6">
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>روابط التواصل الاجتماعي</AppCardTitle>
                  <AppCardDescription>
                    الروابط التي تظهر في أيقونات نصف الدائرة أسفل صورة المعلم
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Facebook className="h-4 w-4" /> فيسبوك
                    </label>
                    <AppInput
                      dir="ltr"
                      value={form.socialLinks.facebook}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: { ...form.socialLinks, facebook: e.target.value },
                        })
                      }
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Youtube className="h-4 w-4" /> يوتيوب
                    </label>
                    <AppInput
                      dir="ltr"
                      value={form.socialLinks.youtube}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: { ...form.socialLinks, youtube: e.target.value },
                        })
                      }
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" /> رقم الهاتف
                    </label>
                    <AppInput
                      dir="ltr"
                      value={form.socialLinks.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: { ...form.socialLinks, phone: e.target.value },
                        })
                      }
                      placeholder="+20 ..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" /> رقم الواتساب
                    </label>
                    <AppInput
                      dir="ltr"
                      value={form.socialLinks.whatsapp}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: { ...form.socialLinks, whatsapp: e.target.value },
                        })
                      }
                      placeholder="+20 ..."
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      يُستخدم لرابط محادثة الواتساب في القائمة المنسدلة لأيقونة الهاتف
                    </p>
                  </div>
                </AppCardContent>
              </AppCard>

              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>إعدادات الأيقونات</AppCardTitle>
                  <AppCardDescription>
                    تسمية وإظهار أو إخفاء كل أيقونة على حدة
                  </AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-4">
                  {(
                    [
                      ["gifts", "الهدايا", Gift],
                      ["facebook", "فيس بوك", Facebook],
                      ["chat", "محادثة مباشرة", MessageCircle],
                      ["youtube", "يوتيوب", Youtube],
                      ["bestStudents", "أفضل الطلاب", Star],
                      ["phone", "رقم الهاتف", Phone],
                    ] as const
                  ).map(([key, defaultLabel, Icon]) => {
                    const iconKey = key as keyof typeof form.icons;
                    const cfg = form.icons[iconKey];
                    return (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <AppInput
                            value={cfg.label}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                icons: {
                                  ...form.icons,
                                  [iconKey]: { ...cfg, label: e.target.value },
                                },
                              })
                            }
                            placeholder={defaultLabel}
                            className="h-9 w-40"
                          />
                        </div>
                        <AppSwitch
                          checked={cfg.visible}
                          onCheckedChange={(v) =>
                            setForm({
                              ...form,
                              icons: {
                                ...form.icons,
                                [iconKey]: { ...cfg, visible: v },
                              },
                            })
                          }
                        />
                      </label>
                    );
                  })}
                </AppCardContent>
              </AppCard>

              <div className="flex justify-end">
                <AppButton
                  onClick={() => updateHero.mutate(form)}
                  loading={saving}
                >
                  حفظ روابط التواصل
                </AppButton>
              </div>
            </div>
          )}
        </AppTabsContent>

        {/* Preview tab */}
        <AppTabsContent value="preview">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>معاينة حية</AppCardTitle>
              <AppCardDescription>هكذا سيظهر قسم الترحيب في الصفحة الرئيسية</AppCardDescription>
            </AppCardHeader>
            <AppCardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <HeroSection />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                المعاينة تعرض البيانات المحفوظة حالياً. عدّل المحتوى في تبويب «المحتوى» ثم احفظ.
              </p>
            </AppCardContent>
          </AppCard>
        </AppTabsContent>
      </AppTabs>
    </AppPage>
  );
}
