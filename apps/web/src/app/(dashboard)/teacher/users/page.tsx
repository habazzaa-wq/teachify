"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Download, Trash2, Ban, UserCheck } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppDivider,
  AppButton,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import {
  useTenantUsers,
  useTenantUsersMetrics,
  useCreateTenantUser,
  useUpdateTenantUser,
  useDeleteTenantUser,
  useBulkDeleteTenantUsers,
  useSuspendTenantUser,
  useActivateTenantUser,
  useBulkSuspendTenantUsers,
  useBulkActivateTenantUsers,
  useForceLogoutTenantUser,
  useResetTenantUserPassword,
  useSendInvite,
  useResendInvite,
  useRevokeSession,
  useToggleTrustedDevice,
} from "@/features/tenant-users/hooks";
import { TenantUserMetricCards } from "@/features/tenant-users/components/TenantUserMetricCards";
import { TenantUsersToolbar } from "@/features/tenant-users/components/TenantUsersToolbar";
import { TenantUsersTable } from "@/features/tenant-users/components/TenantUsersTable";
import { TenantUserCreateDrawer } from "@/features/tenant-users/components/TenantUserCreateDrawer";
import { TenantUserEditDrawer } from "@/features/tenant-users/components/TenantUserEditDrawer";
import { TenantUserDetailsDrawer } from "@/features/tenant-users/components/TenantUserDetailsDrawer";
import { TenantUserDeleteDialog } from "@/features/tenant-users/components/TenantUserDeleteDialog";
import { TenantUserEmptyState } from "@/features/tenant-users/components/TenantUserEmptyState";
import { TenantUserLoadingState } from "@/features/tenant-users/components/TenantUserLoadingState";
import { TenantUserErrorState } from "@/features/tenant-users/components/TenantUserErrorState";
import type { TenantUser, UserStatus, UserRoleSlug, DepartmentSlug, CreateTenantUserPayload, UpdateTenantUserPayload } from "@/features/tenant-users/types";

function exportUsersToCSV(users: TenantUser[]) {
  const headers = ["الاسم", "البريد", "الهاتف", "القسم", "المسمى", "الدور", "الحالة", "2FA", "آخر دخول", "تاريخ الإنشاء"];
  const rows = users.map((u) => [
    u.fullName, u.email, u.phone, u.department, u.jobTitle,
    u.role.name, u.status, u.twoFactorEnabled ? "نعم" : "لا",
    u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("ar") : "—",
    new Date(u.createdAt).toLocaleDateString("ar"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentSlug | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRoleSlug | "all">("all");
  const [twoFactorFilter, setTwoFactorFilter] = useState<string>("all");
  const [lastLoginFilter, setLastLoginFilter] = useState<string>("all");
  const [dateCreatedFilter, setDateCreatedFilter] = useState<string>("all");
  const [sort, setSort] = useState("createdAt");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantUser | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [passwordResult, setPasswordResult] = useState<string | null>(null);

  const params = useMemo(() => ({
    search,
    status: statusFilter,
    department: departmentFilter,
    role: roleFilter,
    twoFactor: twoFactorFilter === "true" ? true : twoFactorFilter === "false" ? false : "all" as const,
    lastLogin: lastLoginFilter as "today" | "week" | "month" | "older" | "all",
    dateCreated: dateCreatedFilter as "today" | "week" | "month" | "older" | "all",
    sort: sort as "fullName" | "email" | "createdAt" | "lastLogin" | "status",
  }), [search, statusFilter, departmentFilter, roleFilter, twoFactorFilter, lastLoginFilter, dateCreatedFilter, sort]);

  const usersQuery = useTenantUsers(params);
  const metricsQuery = useTenantUsersMetrics();
  const createUser = useCreateTenantUser();
  const updateUser = useUpdateTenantUser();
  const deleteUser = useDeleteTenantUser();
  const bulkDelete = useBulkDeleteTenantUsers();
  const suspendUser = useSuspendTenantUser();
  const activateUser = useActivateTenantUser();
  const bulkSuspend = useBulkSuspendTenantUsers();
  const bulkActivate = useBulkActivateTenantUsers();
  const forceLogout = useForceLogoutTenantUser();
  const resetPassword = useResetTenantUserPassword();
  const sendInvite = useSendInvite();
  const resendInvite = useResendInvite();
  const revokeSession = useRevokeSession();
  const toggleTrusted = useToggleTrustedDevice();

  const users = usersQuery.data?.data ?? [];
  const isLoading = usersQuery.isLoading || metricsQuery.isLoading;
  const isError = usersQuery.isError;

  const openCreateDrawer = useCallback(() => setCreateDrawerOpen(true), []);

  const openViewDrawer = useCallback((user: TenantUser) => {
    setSelectedUserId(user.id);
    setDetailsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((user: TenantUser) => {
    setSelectedUserId(user.id);
    setEditDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: CreateTenantUserPayload) => {
      createUser.mutate(data, {
        onSuccess: () => setCreateDrawerOpen(false),
      });
    },
    [createUser],
  );

  const handleEditSave = useCallback(
    (id: string, data: UpdateTenantUserPayload) => {
      updateUser.mutate({ id, data }, {
        onSuccess: () => setEditDrawerOpen(false),
      });
    },
    [updateUser],
  );

  const handleSuspend = useCallback(
    (user: TenantUser) => suspendUser.mutate(user.id),
    [suspendUser],
  );

  const handleActivate = useCallback(
    (user: TenantUser) => activateUser.mutate(user.id),
    [activateUser],
  );

  const handleForceLogout = useCallback(
    (user: TenantUser) => forceLogout.mutate(user.id),
    [forceLogout],
  );

  const handleResetPassword = useCallback(
    (user: TenantUser) => {
      resetPassword.mutate(user.id, {
        onSuccess: (password) => setPasswordResult(password),
      });
    },
    [resetPassword],
  );

  const handleSendInvite = useCallback(
    (user: TenantUser) => sendInvite.mutate(user.id),
    [sendInvite],
  );

  const handleResendInvite = useCallback(
    (user: TenantUser) => resendInvite.mutate(user.id),
    [resendInvite],
  );

  const handleCopyEmail = useCallback((user: TenantUser) => {
    navigator.clipboard.writeText(user.email);
  }, []);

  const handleDelete = useCallback((user: TenantUser) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteUser]);

  const handleBulkAction = useCallback(
    (action: string) => {
      if (selectedIds.length === 0) return;
      switch (action) {
        case "delete":
          setBulkDeleteOpen(true);
          return;
        case "suspend":
          bulkSuspend.mutate(selectedIds);
          break;
        case "activate":
          bulkActivate.mutate(selectedIds);
          break;
      }
      setSelectedIds([]);
    },
    [selectedIds, bulkSuspend, bulkActivate],
  );

  const confirmBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDelete.mutate(selectedIds, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setSelectedIds([]);
      },
    });
  }, [selectedIds, bulkDelete]);

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة المستخدمين"
        description="إدارة المستخدمين والأعضاء في هذه الأكاديمية"
        actions={
          <>
            <AppDropdownMenu>
              <AppDropdownMenuTrigger asChild>
                <AppButton variant="outline" size="sm" disabled={selectedIds.length === 0}>
                  إجراءات جماعية ({selectedIds.length})
                </AppButton>
              </AppDropdownMenuTrigger>
              <AppDropdownMenuContent align="end" className="w-48">
                <AppDropdownMenuItem onClick={() => handleBulkAction("activate")}>
                  <UserCheck className="h-4 w-4" />
                  تفعيل
                </AppDropdownMenuItem>
                <AppDropdownMenuItem onClick={() => handleBulkAction("suspend")}>
                  <Ban className="h-4 w-4" />
                  إيقاف
                </AppDropdownMenuItem>
                <AppDropdownMenuSeparator />
                <AppDropdownMenuItem
                  onClick={() => handleBulkAction("delete")}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </AppDropdownMenuItem>
              </AppDropdownMenuContent>
            </AppDropdownMenu>
            <AppButton variant="outline" size="sm" onClick={() => exportUsersToCSV(users)}>
              <Download className="h-4 w-4" />
              تصدير
            </AppButton>
            <AppButton size="sm" onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              إضافة مستخدم
            </AppButton>
          </>
        }
      />

      <AppDivider className="mb-8" />

      <AppSection>
        <TenantUserMetricCards
          data={metricsQuery.data}
          loading={metricsQuery.isLoading}
        />
      </AppSection>

      <AppSection>
        {isError ? (
          <TenantUserErrorState onRetry={() => usersQuery.refetch()} />
        ) : isLoading ? (
          <TenantUserLoadingState />
        ) : users.length === 0 && !search && statusFilter === "all" && departmentFilter === "all" && roleFilter === "all" ? (
          <TenantUserEmptyState onCreate={openCreateDrawer} />
        ) : (
          <>
            <div className="mb-4">
              <TenantUsersToolbar
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                departmentFilter={departmentFilter}
                onDepartmentChange={setDepartmentFilter}
                roleFilter={roleFilter}
                onRoleChange={setRoleFilter}
                twoFactorFilter={twoFactorFilter}
                onTwoFactorChange={setTwoFactorFilter}
                lastLoginFilter={lastLoginFilter}
                onLastLoginChange={setLastLoginFilter}
                dateCreatedFilter={dateCreatedFilter}
                onDateCreatedChange={setDateCreatedFilter}
                sort={sort}
                onSortChange={setSort}
                onRefresh={() => usersQuery.refetch()}
                refreshing={usersQuery.isRefetching}
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  تم تحديد <span className="font-semibold text-foreground">{selectedIds.length}</span> مستخدم
                </span>
                <div className="mr-auto flex items-center gap-2">
                  <AppButton variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} loading={bulkDelete.isPending}>
                    <Trash2 className="h-4 w-4" />
                    حذف المحددة
                  </AppButton>
                  <AppButton variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                    إلغاء التحديد
                  </AppButton>
                </div>
              </div>
            )}
            <TenantUsersTable
              users={users}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onView={openViewDrawer}
              onEdit={openEditDrawer}
              onSuspend={handleSuspend}
              onActivate={handleActivate}
              onForceLogout={handleForceLogout}
              onResetPassword={handleResetPassword}
              onSendInvite={handleSendInvite}
              onResendInvite={handleResendInvite}
              onCopyEmail={handleCopyEmail}
              onDelete={handleDelete}
            />
            {users.length > 0 && (
              <p className="mt-3 text-xs text-center text-muted-foreground/60">
                إجمالي {users.length} مستخدم
              </p>
            )}
          </>
        )}
      </AppSection>

      <TenantUserCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createUser.isPending}
      />

      <TenantUserEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        userId={selectedUserId}
        onSave={handleEditSave}
        saving={updateUser.isPending}
      />

      <TenantUserDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        userId={selectedUserId}
        onRevokeSession={(userId, sessionId) => revokeSession.mutate({ userId, sessionId })}
        onToggleTrustDevice={(userId, deviceId, trusted) => toggleTrusted.mutate({ userId, deviceId, trusted })}
      />

      <TenantUserDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userName={deleteTarget?.fullName ?? ""}
        onConfirm={confirmDelete}
        loading={deleteUser.isPending}
      />

      <TenantUserDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        userName=""
        onConfirm={confirmBulkDelete}
        loading={bulkDelete.isPending}
        bulk
        bulkCount={selectedIds.length}
      />

      {passwordResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-xl border bg-card p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">تم إعادة تعيين كلمة المرور</h3>
            <p className="text-sm text-muted-foreground mb-4">
              كلمة المرور الجديدة:
            </p>
            <div className="rounded-lg border bg-muted p-3 mb-4">
              <code className="text-sm font-mono break-all" dir="ltr">{passwordResult}</code>
            </div>
            <AppButton
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(passwordResult);
                setPasswordResult(null);
              }}
            >
              نسخ وإغلاق
            </AppButton>
          </div>
        </div>
      )}
    </AppPage>
  );
}

export default UsersPage;
