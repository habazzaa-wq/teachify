"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  BookOpen,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/cn";
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
  useSubjectsList,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useReorderSubjects,
} from "@/features/subjects/hooks";
import { IconPicker } from "@/features/subjects/components/IconPicker";
import type { SubjectInput, SubjectRecord } from "@/features/subjects/types";

const emptyForm: SubjectInput = {
  name: "",
  description: "",
  icon: null,
  is_active: true,
  sort_order: 0,
};

function SubjectIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return <BookOpen className={cn("h-5 w-5", className)} />;
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen, BookMarked, BookText, Calculator, Sigma, Hash,
    FlaskConical, Beaker, Atom, Dna, Globe, Map, Landmark, Scroll,
    Palette, Paintbrush, Music, Dumbbell, Monitor, Code, Brain,
    Heart, Languages, GraduationCap, Leaf, Microscope, Telescope, Pen, Compass,
  };
  const Icon = icons[name];
  return Icon ? <Icon className={cn("h-5 w-5", className)} /> : <BookOpen className={cn("h-5 w-5", className)} />;
}

function SubjectFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: SubjectRecord | null;
}) {
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const [form, setForm] = useState<SubjectInput>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          icon: initial.icon ?? null,
          is_active: initial.is_active,
          sort_order: initial.sort_order,
        }
      : { ...emptyForm },
  );

  const saving = create.isPending || update.isPending;

  const handleSave = () => {
    const payload: SubjectInput = {
      name: form.name,
      description: form.description ? form.description : null,
      icon: form.icon || null,
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
            {initial ? "تعديل المادة" : "إضافة مادة"}
          </AppDialogTitle>
        </AppDialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              اسم المادة <span className="text-destructive">*</span>
            </label>
            <AppInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: الرياضيات"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">الوصف</label>
            <AppTextarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف مختصر عن هذه المادة"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">أيقونة المادة</label>
            <IconPicker
              value={form.icon ?? null}
              onChange={(icon) => setForm({ ...form, icon })}
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
            {initial ? "حفظ التعديلات" : "إضافة المادة"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export default function SubjectsPage() {
  const { data, isLoading } = useSubjectsList();
  const remove = useDeleteSubject();
  const reorder = useReorderSubjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectRecord | null>(null);

  const items = data?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: SubjectRecord) => {
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
        title="المواد"
        description="إدارة المواد الدراسية"
      />
      <AppDivider className="mb-6" />

      {isLoading ? (
        <AppLoadingState />
      ) : items.length === 0 ? (
        <AppEmptyState
          icon={BookOpen}
          title="لا توجد مواد بعد"
          description="أضف أول مادة دراسية."
          action={
            <AppButton onClick={openCreate}>
              <Plus className="h-4 w-4" /> إضافة مادة
            </AppButton>
          }
        />
      ) : (
        <AppCard className="overflow-hidden">
          <AppCardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b">
            <div className="space-y-1">
              <AppCardTitle>المواد الدراسية</AppCardTitle>
              <AppCardDescription>
                {items.length} {items.length === 1 ? "مادة معروضة" : "مواد معروضة"}
              </AppCardDescription>
            </div>
            <AppButton onClick={openCreate}>
              <Plus className="h-4 w-4" /> إضافة مادة
            </AppButton>
          </AppCardHeader>

          <div className="hidden grid-cols-[2.5rem_1fr_auto_auto] gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold text-muted-foreground sm:grid">
            <span className="text-center">#</span>
            <span>المادة</span>
            <span className="whitespace-nowrap">الحالة</span>
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <SubjectIcon name={item.icon} />
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

      <SubjectFormDialog
        key={dialogOpen ? (editing?.id ?? "new") : "closed"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
      />
    </AppPage>
  );
}
