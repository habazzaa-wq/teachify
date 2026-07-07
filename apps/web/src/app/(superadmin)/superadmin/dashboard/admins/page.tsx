"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import {
  AppPage, AppPageHeader, AppSection, AppDivider, AppButton,
  AppTable, AppTableHeader, AppTableBody, AppTableRow, AppTableHead, AppTableCell,
  AppBadge, AppAvatar, AppAvatarFallback, AppPagination,
  AppDialog, AppDialogContent, AppDialogHeader, AppDialogTitle,
  AppDialogDescription, AppDialogFooter, AppInput, AppSelect, AppSelectItem, AppCheckbox,
  Skeleton, AppEmptyState, AppErrorState,
} from "@/components/ui";
import {
  usePlatformAdmins, useCreatePlatformAdmin, useUpdatePlatformAdmin, useDeletePlatformAdmin, useBulkDeletePlatformAdmins,
} from "@/features/platform-admins/hooks";
import { ADMIN_ROLE_CONFIG, ADMIN_STATUS_CONFIG } from "@/features/platform-admins/constants";
import type { PlatformAdmin } from "@/features/platform-admins/types";

function PlatformAdminsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformAdmin | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = usePlatformAdmins({ search, page, per_page: 25 });
  const createAdmin = useCreatePlatformAdmin();
  const updateAdmin = useUpdatePlatformAdmin();
  const deleteAdmin = useDeletePlatformAdmin();
  const bulkDeleteAdmins = useBulkDeletePlatformAdmins();

  const admins: PlatformAdmin[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleCreate = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createAdmin.mutate({
      name: form.get("name") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
      role: form.get("role") as "super_admin" | "support" | "analyst",
    }, { onSuccess: () => setCreateOpen(false) });
  }, [createAdmin]);

  const handleStatusChange = useCallback((admin: PlatformAdmin, status: string) => {
    updateAdmin.mutate({ id: admin.id, data: { status } });
  }, [updateAdmin]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteAdmin.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }, [deleteTarget, deleteAdmin]);

  const allSelected = admins.length > 0 && selectedIds.length === admins.length;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(admins.map((a: PlatformAdmin) => a.id));
    }
  }, [admins, allSelected]);

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const confirmBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDeleteAdmins.mutate(selectedIds, {
      onSuccess: () => { setBulkDeleteOpen(false); setSelectedIds([]); },
    });
  }, [selectedIds, bulkDeleteAdmins]);

  return (
    <SuperAdminGuard>
      <AppPage maxWidth="xl">
        <AppPageHeader
          title="إدارة المشرفين"
          description="إدارة مشرفي المنصة والصلاحيات"
          actions={
            <>
              <AppButton variant="outline" size="sm" onClick={() => refetch()} loading={isRefetching}>
                <RefreshCw className="h-4 w-4" /> تحديث
              </AppButton>
              <AppButton size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> إضافة مشرف
              </AppButton>
            </>
          }
        />
        <AppDivider className="mb-8" />

        <AppSection>
          <div className="mb-4">
            <AppInput
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
          </div>

          {isError ? (
            <AppErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : admins.length === 0 ? (
            <AppEmptyState title="لا يوجد مشرفون" description="لم يتم إضافة أي مشرفين بعد" action={<AppButton onClick={() => setCreateOpen(true)}>إضافة مشرف</AppButton>} />
          ) : (
            <>
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <AppTable>
                  <AppTableHeader>
                    <AppTableRow>
                      <AppTableHead className="w-10">
                        <AppCheckbox checked={allSelected} onCheckedChange={toggleAll as never} />
                      </AppTableHead>
                      <AppTableHead>المشرف</AppTableHead>
                      <AppTableHead>البريد</AppTableHead>
                      <AppTableHead>الدور</AppTableHead>
                      <AppTableHead>الحالة</AppTableHead>
                      <AppTableHead>تاريخ الترقية</AppTableHead>
                      <AppTableHead>الإجراءات</AppTableHead>
                    </AppTableRow>
                  </AppTableHeader>
                  <AppTableBody>
                    {admins.map((admin: PlatformAdmin) => {
                      const roleCfg = ADMIN_ROLE_CONFIG[admin.role] ?? { label: admin.role, color: "secondary" };
                      const statusCfg = ADMIN_STATUS_CONFIG[admin.status] ?? { label: admin.status, color: "secondary" };
                      return (
                        <AppTableRow key={admin.id}>
                          <AppTableCell>
                            <AppCheckbox
                              checked={selectedIds.includes(admin.id)}
                              onCheckedChange={() => toggleOne(admin.id)}
                            />
                          </AppTableCell>
                          <AppTableCell>
                            <div className="flex items-center gap-2">
                              <AppAvatar className="h-8 w-8">
                                <AppAvatarFallback>{admin.user.name.charAt(0)}</AppAvatarFallback>
                              </AppAvatar>
                              <span className="font-medium">{admin.user.name}</span>
                            </div>
                          </AppTableCell>
                          <AppTableCell className="text-sm text-muted-foreground">{admin.user.email}</AppTableCell>
                          <AppTableCell>
                            <AppBadge variant={roleCfg.color as "success" | "warning" | "destructive" | "secondary" | "outline"}>
                              {roleCfg.label}
                            </AppBadge>
                          </AppTableCell>
                          <AppTableCell>
                            <AppBadge variant={statusCfg.color as "success" | "warning" | "destructive" | "secondary" | "outline"}>
                              {statusCfg.label}
                            </AppBadge>
                          </AppTableCell>
                          <AppTableCell className="text-sm text-muted-foreground">
                            {admin.granted_at ? new Date(admin.granted_at).toLocaleDateString("ar") : "-"}
                          </AppTableCell>
                          <AppTableCell>
                            <select
                              className="text-sm bg-transparent border rounded px-2 py-1"
                              value={admin.status}
                              onChange={(e) => handleStatusChange(admin, e.target.value)}
                            >
                              <option value="active">نشط</option>
                              <option value="inactive">غير نشط</option>
                              <option value="suspended">موقوف</option>
                            </select>
                            <AppButton variant="ghost" size="sm" className="text-destructive mr-1" onClick={() => setDeleteTarget(admin)}>
                              حذف
                            </AppButton>
                          </AppTableCell>
                        </AppTableRow>
                      );
                    })}
                  </AppTableBody>
                </AppTable>
              </div>
              {selectedIds.length > 0 && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                  <span className="text-sm text-muted-foreground">
                    تم تحديد <span className="font-semibold text-foreground">{selectedIds.length}</span> مشرف
                  </span>
                  <div className="mr-auto flex items-center gap-2">
                    <AppButton variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} loading={bulkDeleteAdmins.isPending}>
                      <Trash2 className="h-4 w-4" />
                      حذف المحددة
                    </AppButton>
                    <AppButton variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                      إلغاء التحديد
                    </AppButton>
                  </div>
                </div>
              )}
              {total > 25 && (
                <AppPagination currentPage={page} lastPage={Math.ceil(total / 25)} total={total} onPageChange={setPage} className="mt-4" />
              )}
            </>
          )}
        </AppSection>

        <AppDialog open={createOpen} onOpenChange={setCreateOpen}>
          <AppDialogContent>
            <AppDialogHeader>
              <AppDialogTitle>إضافة مشرف جديد</AppDialogTitle>
              <AppDialogDescription>أدخل بيانات المشرف الجديد</AppDialogDescription>
            </AppDialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <AppInput name="name" placeholder="الاسم" required />
              <AppInput name="email" type="email" placeholder="البريد الإلكتروني" required />
              <AppInput name="password" type="password" placeholder="كلمة المرور" required />
              <AppSelect name="role" defaultValue="support">
                <AppSelectItem value="super_admin">مدير عام</AppSelectItem>
                <AppSelectItem value="support">دعم فني</AppSelectItem>
                <AppSelectItem value="analyst">محلل</AppSelectItem>
              </AppSelect>
              <AppDialogFooter>
                <AppButton type="submit" loading={createAdmin.isPending}>إضافة</AppButton>
              </AppDialogFooter>
            </form>
          </AppDialogContent>
        </AppDialog>

        <AppDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AppDialogContent>
            <AppDialogHeader>
              <AppDialogTitle>حذف مشرف</AppDialogTitle>
              <AppDialogDescription>هل أنت متأكد من حذف المشرف {deleteTarget?.user.name}؟</AppDialogDescription>
            </AppDialogHeader>
            <AppDialogFooter>
              <AppButton variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</AppButton>
              <AppButton variant="destructive" onClick={confirmDelete} loading={deleteAdmin.isPending}>حذف</AppButton>
            </AppDialogFooter>
          </AppDialogContent>
        </AppDialog>

        <AppDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AppDialogContent>
            <AppDialogHeader>
              <AppDialogTitle>حذف المشرفين المحددين</AppDialogTitle>
              <AppDialogDescription>هل أنت متأكد من حذف {selectedIds.length} مشرف؟</AppDialogDescription>
            </AppDialogHeader>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">هذا الإجراء لا يمكن التراجع عنه.</p>
            </div>
            <AppDialogFooter>
              <AppButton variant="outline" onClick={() => setBulkDeleteOpen(false)}>إلغاء</AppButton>
              <AppButton variant="destructive" onClick={confirmBulkDelete} loading={bulkDeleteAdmins.isPending}>حذف ({selectedIds.length})</AppButton>
            </AppDialogFooter>
          </AppDialogContent>
        </AppDialog>
      </AppPage>
    </SuperAdminGuard>
  );
}

export default PlatformAdminsPage;
