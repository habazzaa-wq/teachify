"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Plus, Database, Search, Lock, Building2, Globe } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogTitle,
  PermissionGuard,
} from "@/components/ui";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import {
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
} from "@/components/ui/AppSelect";
import { AppPagination } from "@/components/ui/AppPagination";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  StudioButton,
  StudioSurfaceCard,
  StudioStatusChip,
  StudioEmptyState,
} from "@/components/studio";
import { studioAnimationVariants } from "@/components/studio";
import { BANK_STATUS_CONFIG, VISIBILITY_CONFIG } from "@/features/exam-bank/constants";
import { useBanks, useDeleteBank } from "@/features/exam-bank/hooks";
import type { BankStatus, ExamVisibility, QuestionBank } from "@/features/exam-bank/types";
import { CreateBankDialog } from "./CreateBankDialog";

const STATUS_OPTIONS: { value: BankStatus | "all"; label: string }[] = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: BANK_STATUS_CONFIG.active.label },
  { value: "inactive", label: BANK_STATUS_CONFIG.inactive.label },
  { value: "archived", label: BANK_STATUS_CONFIG.archived.label },
];

const VISIBILITY_ICONS: Record<ExamVisibility, React.ComponentType<{ className?: string }>> = {
  private: Lock,
  organization: Building2,
  public: Globe,
};

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "حذف",
  loading,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>{title}</AppDialogTitle>
          <AppDialogDescription>{description}</AppDialogDescription>
        </AppDialogHeader>
        <AppDialogFooter className="mt-6 gap-2">
          <AppButton variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </AppButton>
          <AppButton variant="destructive" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export function BanksTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BankStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBank, setEditBank] = useState<QuestionBank | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionBank | null>(null);

  const { data, isLoading, isError, refetch } = useBanks({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    perPage: 24,
  });

  const deleteMutation = useDeleteBank();

  const banks = data?.data ?? [];

  const openCreate = () => {
    setEditBank(null);
    setDialogOpen(true);
  };

  const openEdit = (bank: QuestionBank) => {
    setEditBank(bank);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-studio-fg">مستودعات الأسئلة</h2>
          <p className="mt-1 text-sm text-studio-fg-muted">
            خزّن أسئلتك ضمن مستودعات منظمة بحسب الفئة والظهور.
          </p>
        </div>
        <StudioButton variant="primary" size="md" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          مستودع جديد
        </StudioButton>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-fg-subtle" />
          <AppInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث عن مستودع..."
            className="ps-10"
          />
        </div>
        <div className="w-full sm:w-56">
          <AppSelect
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as BankStatus | "all");
              setPage(1);
            }}
          >
            <AppSelectTrigger>
              <AppSelectValue placeholder="الحالة" />
            </AppSelectTrigger>
            <AppSelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>
      </div>

      {isLoading ? (
        <BankGridSkeleton />
      ) : isError ? (
        <StudioEmptyState
          icon={<Search className="h-8 w-8" />}
          title="تعذّر تحميل المستودعات"
          description="حدث خطأ أثناء جلب البيانات."
          action={
            <StudioButton variant="soft" size="sm" onClick={() => refetch()}>
              إعادة المحاولة
            </StudioButton>
          }
        />
      ) : banks.length === 0 ? (
        <StudioEmptyState
          icon={<Database className="h-8 w-8" />}
          title={search || statusFilter !== "all" ? "لا توجد نتائج" : "لا توجد مستودعات بعد"}
          description={
            search || statusFilter !== "all"
              ? "جرّب تعديل معايير البحث أو التصفية."
              : "ابدأ بإنشاء أول مستودع للأسئلة."
          }
          action={
            !search && statusFilter === "all" ? (
              <StudioButton variant="soft" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                مستودع جديد
              </StudioButton>
            ) : undefined
          }
        />
      ) : (
        <>
          <motion.div
            variants={studioAnimationVariants.fadeInUp}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {banks.map((bank) => {
              const VisibilityIcon = VISIBILITY_ICONS[bank.visibility];
              const visibilityLabel = VISIBILITY_CONFIG[bank.visibility].label;
              return (
                <StudioSurfaceCard key={bank.id} hoverable padding="md" className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-soft text-studio-fg-subtle">
                        <Database className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-studio-fg">{bank.name}</h3>
                        <StudioStatusChip status={bank.status} />
                      </div>
                    </div>
                    <span
                      className="flex items-center gap-1 text-xs text-studio-fg-subtle"
                      title={visibilityLabel}
                    >
                      <VisibilityIcon className="h-3.5 w-3.5" />
                      {visibilityLabel}
                    </span>
                  </div>

                  {bank.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-studio-fg-muted">
                      {bank.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-studio-fg-subtle">
                      {bank.questionCount ?? 0} سؤال
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(bank)}
                        className="rounded-md p-1.5 text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
                        aria-label={`تعديل ${bank.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <PermissionGuard permission="banks.delete">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(bank)}
                          className="rounded-md p-1.5 text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger"
                          aria-label={`حذف ${bank.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                </StudioSurfaceCard>
              );
            })}
          </motion.div>

          {data && data.lastPage > 1 && (
            <div className="pt-4">
              <AppPagination
                currentPage={data.currentPage}
                lastPage={data.lastPage}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <CreateBankDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editBank={editBank}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف المستودع"
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function BankGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}
