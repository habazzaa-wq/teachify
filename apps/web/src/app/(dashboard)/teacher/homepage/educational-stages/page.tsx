"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  MoreHorizontal,
  ImagePlus,
  X,
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
  AppInput,
  AppTextarea,
  AppSwitch,
  AppStatusBadge,
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogFooter,
  AppLoadingState,
  AppEmptyState,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import {
  useEducationalStagesList,
  useCreateEducationalStage,
  useUpdateEducationalStage,
  useDeleteEducationalStage,
  useReorderEducationalStages,
} from "@/features/homepage/educational-stages/hooks";
import { mediaLibraryService } from "@/features/media-library/services";
import { ChooseMediaButton } from "@/features/media-library/components/ChooseMediaButton";
import type { EducationalStageInput, EducationalStageRecord } from "@/features/homepage/educational-stages/types";

const emptyForm: EducationalStageInput = {
  name: "",
  description: "",
  image: "",
  link: "",
  is_active: true,
  sort_order: 0,
};

function StageFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: EducationalStageRecord | null;
}) {
  const create = useCreateEducationalStage();
  const update = useUpdateEducationalStage();
  const [form, setForm] = useState<EducationalStageInput>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          image: initial.image ?? "",
          link: initial.link ?? "",
          is_active: initial.is_active,
          sort_order: initial.sort_order,
        }
      : { ...emptyForm },
  );

  const saving = create.isPending || update.isPending;

  const handleSave = () => {
    const payload: EducationalStageInput = {
      name: form.name,
      description: form.description ? form.description : null,
      image: form.image ? form.image : null,
      link: form.link ? form.link : null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    if (initial) {
      update.mutate(
        { id: initial.id, payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-lg">
        <AppDialogHeader>
          <AppDialogTitle>
            {initial ? "تعديل مرحلة دراسية" : "إضافة مرحلة دراسية"}
          </AppDialogTitle>
        </AppDialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              اسم المرحلة <span className="text-destructive">*</span>
            </label>
            <AppInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: المرحلة الابتدائية"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">الوصف</label>
            <AppTextarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف مختصر عن هذه المرحلة الدراسية"
              rows={3}
            />
          </div>

          {/* Image */}
          <div>
            <label className="mb-2 block text-sm font-medium">صورة المرحلة</label>
            {form.image ? (
              <div className="relative mb-3 overflow-hidden rounded-xl border border-border">
                <div className="relative aspect-[16/9] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image}
                    alt={form.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: "" })}
                  className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  aria-label="إزالة الصورة"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <ChooseMediaButton
                mode="single"
                allowedTypes={["image"]}
                label={form.image ? "تغيير الصورة" : "اختيار صورة"}
                onSelect={async (result) => {
                  const asset = await mediaLibraryService.getAsset(result.id);
                  if (asset?.cdnUrl) {
                    setForm({ ...form, image: asset.cdnUrl });
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">أو</span>
              <AppInput
                dir="ltr"
                value={form.image ?? ""}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="max-w-[260px] flex-1"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              رابط (اختياري)
            </label>
            <AppInput
              dir="ltr"
              value={form.link ?? ""}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                ترتيب العرض
              </label>
              <AppInput
                type="number"
                min={0}
                value={form.sort_order ?? 0}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-end">
              <label className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3">
                <span className="text-sm font-medium">نشطة الآن</span>
                <AppSwitch
                  checked={!!form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </label>
            </div>
          </div>
        </div>

        <AppDialogFooter>
          <AppButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </AppButton>
          <AppButton onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
            {initial ? "حفظ التعديلات" : "إضافة المرحلة"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export default function HomepageEducationalStagesPage() {
  const { data, isLoading } = useEducationalStagesList();
  const remove = useDeleteEducationalStage();
  const reorder = useReorderEducationalStages();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EducationalStageRecord | null>(null);

  const items = data?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: EducationalStageRecord) => {
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

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="المراحل الدراسية"
        description="إدارة المراحل الدراسية التي تظهر في الصفحة الرئيسية للأكاديمية"
      />
      <AppDivider className="mb-6" />

      {isLoading ? (
        <AppLoadingState />
      ) : items.length === 0 ? (
        <AppEmptyState
          icon={GraduationCap}
          title="لا توجد مراحل دراسية بعد"
          description="أضف أول مرحلة دراسية لتظهر في قسم مخصص بالصفحة الرئيسية."
          action={
            <AppButton onClick={openCreate}>
              <Plus className="h-4 w-4" /> إضافة مرحلة
            </AppButton>
          }
        />
      ) : (
        <AppCard className="overflow-hidden">
          <AppCardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b">
            <div className="space-y-1">
              <AppCardTitle>المراحل الدراسية</AppCardTitle>
              <AppCardDescription>
                {items.length} {items.length === 1 ? "مرحلة معروضة" : "مراحل معروضة"}
              </AppCardDescription>
            </div>
            <AppButton onClick={openCreate}>
              <Plus className="h-4 w-4" /> إضافة مرحلة
            </AppButton>
          </AppCardHeader>

          <div className="hidden grid-cols-[2.5rem_1fr_auto_auto_auto] gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold text-muted-foreground sm:grid">
            <span className="text-center">#</span>
            <span>المرحلة</span>
            <span className="whitespace-nowrap">الحالة</span>
            <span className="whitespace-nowrap">الرابط</span>
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

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {item.name}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.description ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <AppStatusBadge status={item.is_active ? "active" : "inactive"} />
                </div>

                <div
                  className="hidden max-w-[200px] shrink-0 truncate text-xs text-muted-foreground md:block"
                  dir="ltr"
                >
                  {item.link ? (
                    <span className="font-mono">{item.link}</span>
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

      <StageFormDialog
        key={dialogOpen ? (editing?.id ?? "new") : "closed"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
      />
    </AppPage>
  );
}
