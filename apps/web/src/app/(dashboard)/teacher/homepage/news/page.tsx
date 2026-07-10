"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Megaphone,
  MoreHorizontal,
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
  AppSwitch,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppStatusBadge,
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogFooter,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
  AppLoadingState,
  AppEmptyState,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import {
  useNewsList,
  useCreateNews,
  useUpdateNews,
  useDeleteNews,
  useReorderNews,
  useTickerSettings,
  useUpdateTickerSettings,
} from "@/features/homepage/news/hooks";
import { DEFAULT_TICKER, type NewsInput, type NewsRecord, type TickerConfig } from "@/features/homepage/news/types";
import { NewsTicker } from "@/components/home/NewsTicker";

function NewsFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: NewsRecord | null;
}) {
  const create = useCreateNews();
  const update = useUpdateNews();
  const [form, setForm] = useState<NewsInput>(() =>
    initial
      ? {
          title: initial.title,
          url: initial.url ?? "",
          is_active: initial.is_active,
          sort_order: initial.sort_order,
          starts_at: initial.starts_at,
          ends_at: initial.ends_at,
        }
      : { title: "", url: "", is_active: true, sort_order: 0, starts_at: null, ends_at: null },
  );

  const saving = create.isPending || update.isPending;

  const handleSave = () => {
    const payload: NewsInput = {
      title: form.title,
      url: form.url ? form.url : null,
      is_active: form.is_active,
      sort_order: form.sort_order,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };
    if (initial) {
      update.mutate({ id: initial.id, payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>
            {initial ? "تعديل خبر" : "إضافة خبر جديد"}
          </AppDialogTitle>
        </AppDialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              نص الخبر <span className="text-destructive">*</span>
            </label>
            <AppInput
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: افتتاح دورة البرمجة المتقدمة"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">رابط (اختياري)</label>
            <AppInput
              dir="ltr"
              value={form.url ?? ""}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium">يبدأ من</label>
              <AppInput
                type="datetime-local"
                value={form.starts_at?.slice(0, 16) ?? ""}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value ? e.target.value : null })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">ينتهي في</label>
              <AppInput
                type="datetime-local"
                value={form.ends_at?.slice(0, 16) ?? ""}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value ? e.target.value : null })}
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <span className="text-sm font-medium">نشط الآن</span>
            <AppSwitch
              checked={!!form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </label>
        </div>

        <AppDialogFooter>
          <AppButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </AppButton>
          <AppButton onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
            {initial ? "حفظ التعديلات" : "إضافة الخبر"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

function formatSchedule(startsAt: string | null, endsAt: string | null): string {
  const fmt = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const start = startsAt ? fmt(startsAt) : null;
  const end = endsAt ? fmt(endsAt) : null;
  if (start && end) return `من ${start} إلى ${end}`;
  if (start) return `يبدأ من ${start}`;
  if (end) return `ينتهي في ${end}`;
  return "نشط دائماً";
}

export default function HomepageNewsPage() {
  const { data, isLoading } = useNewsList();
  const remove = useDeleteNews();
  const reorder = useReorderNews();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsRecord | null>(null);

  const { data: tickerData, isLoading: tickerLoading } = useTickerSettings();
  const updateTicker = useUpdateTickerSettings();
  const [ticker, setTicker] = useState<TickerConfig>(DEFAULT_TICKER);

  useEffect(() => {
    // Sync server settings into local editable state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tickerData) setTicker({ ...DEFAULT_TICKER, ...tickerData });
  }, [tickerData]);

  const items = data?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: NewsRecord) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    if (!a || !b) return;
    reorder.mutate([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
  };

  const savingSettings = updateTicker.isPending;

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="شريط الأخبار"
        description="إدارة الأخبار المتحركة في أعلى الصفحة الرئيسية للأكاديمية"
      />
      <AppDivider className="mb-6" />

      <AppTabs defaultValue="news">
        <AppTabsList>
          <AppTabsTrigger value="news">الأخبار</AppTabsTrigger>
          <AppTabsTrigger value="appearance">إعدادات العرض</AppTabsTrigger>
        </AppTabsList>

        {/* News list */}
        <AppTabsContent value="news">
          {isLoading ? (
            <AppLoadingState />
          ) : items.length === 0 ? (
            <AppEmptyState
              icon={Megaphone}
              title="لا توجد أخبار بعد"
              description="أضف أول خبر ليظهر في شريط الأخبار أعلى الصفحة الرئيسية."
              action={
                <AppButton onClick={openCreate}>
                  <Plus className="h-4 w-4" /> إضافة خبر
                </AppButton>
              }
            />
          ) : (
            <AppCard className="overflow-hidden">
              <AppCardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b">
                <div className="space-y-1">
                  <AppCardTitle>الأخبار</AppCardTitle>
                  <AppCardDescription>
                    {items.length} {items.length === 1 ? "خبر معروض" : "أخبار معروضة"} في الشريط
                  </AppCardDescription>
                </div>
                <AppButton onClick={openCreate}>
                  <Plus className="h-4 w-4" /> إضافة خبر
                </AppButton>
              </AppCardHeader>

              {/* Column header (hidden on small screens) */}
              <div className="hidden grid-cols-[2.5rem_1fr_auto_auto_auto] gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold text-muted-foreground sm:grid">
                <span className="text-center">#</span>
                <span>الخبر</span>
                <span className="whitespace-nowrap">الحالة</span>
                <span className="hidden whitespace-nowrap md:block">الرابط</span>
                <span className="whitespace-nowrap text-end">الإجراءات</span>
              </div>

              <ul className="divide-y divide-border">
                {items.map((item, i) => (
                  <li
                    key={item.id}
                    className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {i + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {formatSchedule(item.starts_at, item.ends_at)}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <AppStatusBadge status={item.is_active ? "active" : "inactive"} />
                    </div>

                    <div
                      className="hidden max-w-[200px] shrink-0 truncate text-xs text-muted-foreground md:block"
                      dir="ltr"
                    >
                      {item.url ? (
                        <span className="font-mono">{item.url}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </div>

                    <div className="shrink-0">
                      <AppDropdownMenu>
                        <AppDropdownMenuTrigger asChild>
                          <AppButton
                            variant="ghost"
                            size="icon"
                            title="خيارات"
                            aria-label="خيارات"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </AppButton>
                        </AppDropdownMenuTrigger>
                        <AppDropdownMenuContent align="end" className="w-44">
                          <AppDropdownMenuItem
                            disabled={i === 0}
                            onSelect={() => move(i, -1)}
                          >
                            <ArrowUp className="me-2 h-4 w-4" /> تحريك لأعلى
                          </AppDropdownMenuItem>
                          <AppDropdownMenuItem
                            disabled={i === items.length - 1}
                            onSelect={() => move(i, 1)}
                          >
                            <ArrowDown className="me-2 h-4 w-4" /> تحريك لأسفل
                          </AppDropdownMenuItem>
                          <AppDropdownMenuSeparator />
                          <AppDropdownMenuItem onSelect={() => openEdit(item)}>
                            <Pencil className="me-2 h-4 w-4" /> تعديل
                          </AppDropdownMenuItem>
                          <AppDropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onSelect={() => remove.mutate(item.id)}
                          >
                            <Trash2 className="me-2 h-4 w-4" /> حذف
                          </AppDropdownMenuItem>
                        </AppDropdownMenuContent>
                      </AppDropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            </AppCard>
          )}
        </AppTabsContent>

        {/* Appearance settings */}
        <AppTabsContent value="appearance">
          {tickerLoading ? (
            <AppLoadingState />
          ) : (
            <div className="space-y-6">
              {/* Live preview */}
              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>معاينة حية</AppCardTitle>
                  <AppCardDescription>هكذا سيظهر الشريط في الصفحة الرئيسية</AppCardDescription>
                </AppCardHeader>
                <AppCardContent>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <NewsTicker collapsible={false} />
                  </div>
                  {items.length === 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      أضف أخبارًا من تبويب «الأخبار» لرؤيتها في المعاينة.
                    </p>
                  )}
                </AppCardContent>
              </AppCard>

              <AppCard>
                <AppCardHeader>
                  <AppCardTitle>إعدادات الشريط</AppCardTitle>
                  <AppCardDescription>تحكّم في شكل وحركة شريط الأخبار</AppCardDescription>
                </AppCardHeader>
                <AppCardContent className="space-y-6">
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div>
                      <span className="text-sm font-medium">تفعيل الشريط</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        إظهار شريط الأخبار أعلى الصفحة الرئيسية
                      </p>
                    </div>
                    <AppSwitch
                      checked={ticker.enabled}
                      onCheckedChange={(v) => setTicker({ ...ticker, enabled: v })}
                    />
                  </label>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">المحتوى والحركة</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">عنوان الشريط</label>
                        <AppInput
                          value={ticker.label}
                          onChange={(e) => setTicker({ ...ticker, label: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">اتجاه الحركة</label>
                        <AppSelect
                          value={ticker.direction}
                          onValueChange={(v) => setTicker({ ...ticker, direction: v as TickerConfig["direction"] })}
                        >
                          <AppSelectTrigger>
                            <AppSelectValue />
                          </AppSelectTrigger>
                          <AppSelectContent>
                            <AppSelectItem value="rtl">من اليمين لليسار</AppSelectItem>
                            <AppSelectItem value="ltr">من اليسار لليمين</AppSelectItem>
                          </AppSelectContent>
                        </AppSelect>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">السرعة (بكسل/ثانية)</label>
                        <AppInput
                          type="number"
                          min={10}
                          max={300}
                          value={ticker.speed}
                          onChange={(e) => setTicker({ ...ticker, speed: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">موضع الشريط</label>
                        <AppSelect
                          value={ticker.position}
                          onValueChange={(v) => setTicker({ ...ticker, position: v as TickerConfig["position"] })}
                        >
                          <AppSelectTrigger>
                            <AppSelectValue />
                          </AppSelectTrigger>
                          <AppSelectContent>
                            <AppSelectItem value="top">أعلى الصفحة</AppSelectItem>
                            <AppSelectItem value="bottom">أسفل الصفحة</AppSelectItem>
                          </AppSelectContent>
                        </AppSelect>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div>
                      <span className="text-sm font-medium">إظهار الأيقونة والعنوان</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        عرض شارة «مباشر» واسم الشريط في البداية
                      </p>
                    </div>
                    <AppSwitch
                      checked={ticker.showIcon}
                      onCheckedChange={(v) => setTicker({ ...ticker, showIcon: v })}
                    />
                  </label>
                </AppCardContent>
              </AppCard>

              <div className="flex justify-end">
                <AppButton onClick={() => updateTicker.mutate(ticker)} loading={savingSettings}>
                  حفظ إعدادات الشريط
                </AppButton>
              </div>
            </div>
          )}
        </AppTabsContent>
      </AppTabs>

      <NewsFormDialog
        key={dialogOpen ? (editing?.id ?? "new") : "closed"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
      />
    </AppPage>
  );
}
