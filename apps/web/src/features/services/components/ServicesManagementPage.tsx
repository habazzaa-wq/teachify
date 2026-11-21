"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ExternalLink,
  BriefcaseBusiness,
  Eye,
  FilePenLine,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  SearchX,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  AppBadge,
  AppButton,
  AppConfirmDialog,
  AppDivider,
  AppEmptyState,
  AppErrorState,
  AppMetricCard,
  AppPage,
  AppPageHeader,
  AppSearchInput,
  AppSection,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppStatusBadge,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
  AppTooltip,
  AppTooltipContent,
  AppTooltipProvider,
  AppTooltipTrigger,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { routes } from "@/constants/routes";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import {
  useDeleteService,
  useSaveService,
  useServiceInstructors,
  useTenantServices,
} from "../hooks";
import type { ServicePayload, ServiceRecord } from "../types";
import { ServiceCard } from "./ServiceCard";
import { ServiceFormDrawer } from "./ServiceFormDrawer";

type StatusFilter = "all" | "published" | "draft";
type SortOption = "manual" | "newest" | "oldest" | "title";
type ViewMode = "grid" | "list";

function toPayload(service: ServiceRecord): ServicePayload {
  return {
    title: service.title,
    image_url: service.image_url,
    summary: service.summary,
    description: service.description,
    highlights: service.highlights ?? [],
    contact_name: service.contact_name,
    contact_phone: service.contact_phone,
    instructor_tenant_user_id: service.instructor_tenant_user_id,
    is_published: service.is_published,
    sort_order: service.sort_order ?? 0,
  };
}

function ServicesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface"
        >
          <div className="h-40 animate-pulse bg-studio-muted" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-studio-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-studio-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-studio-muted" />
            <div className="h-12 animate-pulse rounded-lg bg-studio-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServicesManagementPage() {
  const { tenant } = useActiveTenant();
  const servicesQuery = useTenantServices();
  const instructorsQuery = useServiceInstructors();
  const saveService = useSaveService();
  const deleteService = useDeleteService();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("manual");
  const [view, setView] = useState<ViewMode>("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRecord | null>(null);

  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const instructors = useMemo(
    () => instructorsQuery.data ?? [],
    [instructorsQuery.data],
  );
  const publishedCount = services.filter((item) => item.is_published).length;
  const draftCount = services.length - publishedCount;
  const assignedCount = services.filter(
    (item) => item.instructor_tenant_user_id !== null,
  ).length;

  const visibleServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = services.filter((service) => {
      const matchesStatus =
        status === "all" ||
        (status === "published" ? service.is_published : !service.is_published);
      const matchesQuery =
        !query ||
        [service.title, service.summary, service.contact_name, service.description]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "ar");
      if (sort === "newest")
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      if (sort === "oldest")
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [services, search, status, sort]);

  const openCreate = () => {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  };

  const openEdit = (service: ServiceRecord) => {
    setEditing(service);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  };

  const togglePublish = (service: ServiceRecord) => {
    saveService.mutate({
      id: service.id,
      payload: { ...toPayload(service), is_published: !service.is_published },
    });
  };

  const hasFilters = Boolean(search.trim()) || status !== "all";

  return (
    <AppTooltipProvider delayDuration={200}>
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة الخدمات"
        description={
          tenant?.name
            ? `أنشئ خدمات ${tenant.name} التعليمية، نظّم تفاصيلها، وتحكّم في ظهورها للزوار.`
            : "أنشئ خدماتك التعليمية، نظّم تفاصيلها، وتحكّم في ظهورها للزوار."
        }
        breadcrumb={[
          { label: "لوحة التحكم", href: routes.dashboard },
          { label: "الخدمات" },
        ]}
        actions={
          <>
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => void servicesQuery.refetch()}
              disabled={servicesQuery.isFetching}
            >
              <RefreshCw
                className={cn(servicesQuery.isFetching && "animate-spin")}
              />
              تحديث
            </AppButton>
            <AppButton variant="outline" size="sm" asChild>
              <Link href={routes.publicServices} target="_blank">
                <ExternalLink />
                معاينة للزوار
              </Link>
            </AppButton>
            <AppButton size="sm" onClick={openCreate}>
              <Plus />
              خدمة جديدة
            </AppButton>
          </>
        }
      />

      <AppDivider className="mb-8" />

      <AppSection>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AppMetricCard
            title="إجمالي الخدمات"
            value={services.length}
            icon={BriefcaseBusiness}
            color="primary"
            loading={servicesQuery.isLoading}
            delay={0}
          />
          <AppMetricCard
            title="الخدمات المنشورة"
            value={publishedCount}
            icon={Eye}
            color="success"
            loading={servicesQuery.isLoading}
            delay={80}
          />
          <AppMetricCard
            title="المسودات"
            value={draftCount}
            icon={FilePenLine}
            color="warning"
            loading={servicesQuery.isLoading}
            delay={160}
          />
          <AppMetricCard
            title="بمسؤول محدد"
            value={assignedCount}
            icon={UserRoundCheck}
            color="info"
            loading={servicesQuery.isLoading}
            delay={240}
          />
        </div>
      </AppSection>

      <AppSection
        title="كتالوج الخدمات"
        description="إدارة شاملة لكل خدمة: المحتوى، الصورة، المميزات، وطريقة التواصل."
      >
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-studio-border bg-studio-surface/70 p-3 lg:flex-row lg:items-center">
          <AppSearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="ابحث باسم الخدمة أو الوصف..."
            containerClassName="lg:max-w-xs"
            className="h-9"
          />

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <AppSelect
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              <AppSelectTrigger className="h-9 w-[150px]">
                <AppSelectValue />
              </AppSelectTrigger>
              <AppSelectContent>
                <AppSelectItem value="all">كل الحالات</AppSelectItem>
                <AppSelectItem value="published">منشورة</AppSelectItem>
                <AppSelectItem value="draft">مسودة</AppSelectItem>
              </AppSelectContent>
            </AppSelect>

            <AppSelect value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <AppSelectTrigger className="h-9 w-[155px]">
                <ArrowUpDown className="me-1 h-3.5 w-3.5 text-studio-fg-muted" />
                <AppSelectValue />
              </AppSelectTrigger>
              <AppSelectContent>
                <AppSelectItem value="manual">حسب الترتيب</AppSelectItem>
                <AppSelectItem value="newest">الأحدث</AppSelectItem>
                <AppSelectItem value="oldest">الأقدم</AppSelectItem>
                <AppSelectItem value="title">حسب الاسم</AppSelectItem>
              </AppSelectContent>
            </AppSelect>

            <AppBadge variant="secondary" className="h-9 px-3 text-xs">
              {visibleServices.length} من {services.length} خدمة
            </AppBadge>

            <div className="flex items-center gap-1 rounded-lg border border-studio-border bg-studio-bg p-0.5">
              <AppTooltip>
                <AppTooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      view === "grid"
                        ? "bg-studio-surface text-studio-accent shadow-sm"
                        : "text-studio-fg-muted hover:text-studio-fg",
                    )}
                    aria-label="عرض شبكي"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </AppTooltipTrigger>
                <AppTooltipContent>عرض شبكي</AppTooltipContent>
              </AppTooltip>
              <AppTooltip>
                <AppTooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      view === "list"
                        ? "bg-studio-surface text-studio-accent shadow-sm"
                        : "text-studio-fg-muted hover:text-studio-fg",
                    )}
                    aria-label="عرض جدولي"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </AppTooltipTrigger>
                <AppTooltipContent>عرض جدولي</AppTooltipContent>
              </AppTooltip>
            </div>
          </div>
        </div>

        {servicesQuery.isLoading ? (
          <ServicesSkeleton />
        ) : servicesQuery.isError ? (
          <AppErrorState
            variant="card"
            title="تعذّر تحميل الخدمات"
            description="تأكد من اتصالك وحاول مرة أخرى."
            onRetry={() => void servicesQuery.refetch()}
          />
        ) : services.length === 0 ? (
          <AppEmptyState
            variant="card"
            icon={BriefcaseBusiness}
            title="ابدأ بإضافة خدمتك الأولى"
            description="عرّف الزوار بما تقدمه، أضف المميزات، وحدد مسؤول التواصل ليتمكنوا من الوصول إليك مباشرة."
            action={
              <AppButton onClick={openCreate}>
                <Plus />
                إضافة خدمة
              </AppButton>
            }
            secondaryAction="ستظهر الخدمات هنا بعد إنشائها ويمكنك تعديلها في أي وقت."
          />
        ) : visibleServices.length === 0 ? (
          <AppEmptyState
            variant="card"
            icon={SearchX}
            title="لا توجد نتائج مطابقة"
            description="جرّب تغيير كلمة البحث أو الفلتر الحالي."
            action={
              <AppButton
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
              >
                مسح الفلاتر
              </AppButton>
            }
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {visibleServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onTogglePublish={togglePublish}
                toggling={saveService.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface">
            <AppTable>
              <AppTableHeader>
                <AppTableRow>
                  <AppTableHead>الخدمة</AppTableHead>
                  <AppTableHead>الحالة</AppTableHead>
                  <AppTableHead>مسؤول التواصل</AppTableHead>
                  <AppTableHead>المميزات</AppTableHead>
                  <AppTableHead>الترتيب</AppTableHead>
                  <AppTableHead className="text-end">إجراءات</AppTableHead>
                </AppTableRow>
              </AppTableHeader>
              <AppTableBody>
                {visibleServices.map((service) => (
                  <AppTableRow key={service.id}>
                    <AppTableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-studio-border bg-studio-soft text-studio-accent">
                          {service.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={service.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BriefcaseBusiness className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-semibold">
                            {service.title}
                          </p>
                          <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                            {service.summary || "لا يوجد وصف"}
                          </p>
                        </div>
                      </div>
                    </AppTableCell>
                    <AppTableCell>
                      <AppStatusBadge
                        status={service.is_published ? "published" : "draft"}
                        label={service.is_published ? "منشورة" : "مسودة"}
                      />
                    </AppTableCell>
                    <AppTableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{service.contact_name || "غير محدد"}</span>
                      </div>
                    </AppTableCell>
                    <AppTableCell>
                      <AppBadge variant="outline">
                        {service.highlights?.length ?? 0} نقاط
                      </AppBadge>
                    </AppTableCell>
                    <AppTableCell>
                      <span className="tabular-nums text-sm text-muted-foreground">
                        {service.sort_order ?? 0}
                      </span>
                    </AppTableCell>
                    <AppTableCell>
                      <div className="flex items-center justify-end gap-1">
                        <AppTooltip>
                          <AppTooltipTrigger asChild>
                            <AppButton
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => togglePublish(service)}
                              disabled={saveService.isPending}
                              aria-label="تبديل حالة النشر"
                            >
                              {service.is_published ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4 opacity-40" />
                              )}
                            </AppButton>
                          </AppTooltipTrigger>
                          <AppTooltipContent>تبديل حالة النشر</AppTooltipContent>
                        </AppTooltip>
                        <AppButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(service)}
                          aria-label="تعديل"
                        >
                          <FilePenLine className="h-4 w-4" />
                        </AppButton>
                      </div>
                    </AppTableCell>
                  </AppTableRow>
                ))}
              </AppTableBody>
            </AppTable>
          </div>
        )}

        {services.length > 0 && !hasFilters && (
          <p className="mt-3 text-center text-xs text-muted-foreground/60">
            إجمالي {services.length} خدمة في الكتالوج
          </p>
        )}
      </AppSection>

      <ServiceFormDrawer
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editing}
        instructors={instructors}
        saving={saveService.isPending}
        onSave={(payload) =>
          saveService.mutate(
            { id: editing?.id ?? null, payload },
            { onSuccess: () => setFormOpen(false) },
          )
        }
      />

      <AppConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الخدمة"
        description={`سيتم حذف «${deleteTarget?.title ?? ""}» نهائياً. لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف الخدمة"
        destructive
        loading={deleteService.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteService.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </AppPage>
    </AppTooltipProvider>
  );
}
