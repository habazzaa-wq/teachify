"use client";

import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Video,
  Award,
  HardDrive,
  DollarSign,
  TrendingUp,
  UserPlus,
  Sparkles,
  RefreshCw,
  Download,
  Plus,
} from "lucide-react";
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import { usePlatformAuth } from "@/providers/PlatformAuthProvider";
import {
  AppButton,
  AppBadge,
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppPage,
  AppPageHeader,
  AppSection,
  AppChartCard,
  AppMetricCard,
  AppDivider,
} from "@/components/ui";
import { AreaChart, DonutChart, ActivityTimeline, SystemHealthCard } from "@/components/dashboard";
import type { TimelineEvent } from "@/components/dashboard";

const monthlyRevenue = [
  { label: "يناير", value: 12800 },
  { label: "فبراير", value: 15200 },
  { label: "مارس", value: 18400 },
  { label: "أبريل", value: 16200 },
  { label: "مايو", value: 21800 },
  { label: "يونيو", value: 24200 },
  { label: "يوليو", value: 28600 },
  { label: "أغسطس", value: 32400 },
  { label: "سبتمبر", value: 29800 },
  { label: "أكتوبر", value: 35600 },
  { label: "نوفمبر", value: 41200 },
  { label: "ديسمبر", value: 48500 },
];

const signupsData = [
  { label: "يناير", value: 120 },
  { label: "فبراير", value: 185 },
  { label: "مارس", value: 245 },
  { label: "أبريل", value: 198 },
  { label: "مايو", value: 312 },
  { label: "يونيو", value: 378 },
  { label: "يوليو", value: 420 },
  { label: "أغسطس", value: 512 },
  { label: "سبتمبر", value: 468 },
  { label: "أكتوبر", value: 584 },
  { label: "نوفمبر", value: 632 },
  { label: "ديسمبر", value: 745 },
];

const tenantDistribution = [
  { label: "تعليم", value: 45, color: "hsl(var(--chart-1))" },
  { label: "شركات", value: 28, color: "hsl(var(--chart-2))" },
  { label: "حكومي", value: 15, color: "hsl(var(--chart-3))" },
  { label: "أفراد", value: 12, color: "hsl(var(--chart-4))" },
];

const recentActivity: TimelineEvent[] = [
  { id: "1", title: "إضافة مستأجر جديد", description: "جامعة الملك عبدالعزيز", timestamp: "منذ 5 دقائق", type: "create" },
  { id: "2", title: "تحديث صلاحيات المشرف", description: "تم تعديل صلاحيات المشرف أحمد", timestamp: "منذ 12 دقيقة", type: "update" },
  { id: "3", title: "تسجيل دخول مشرف", description: "محمد علي - منصة الإدارة", timestamp: "منذ 28 دقيقة", type: "login" },
  { id: "4", title: "حذف دورة تدريبية", description: "تم حذف دورة 'أساسيات البرمجة'", timestamp: "منذ ساعة", type: "delete" },
  { id: "5", title: "تنبيه استخدام", description: "اقتراب حد التخزين للمستأجر 5 مؤسسات", timestamp: "منذ ساعتين", type: "warning" },
  { id: "6", title: "اكتمال معالجة", description: "معالجة 1,250 فيديو", timestamp: "منذ 3 ساعات", type: "info" },
];

const systemMetrics = [
  { label: "المعالج (CPU)", value: 34, max: 100, unit: "%", color: "success" as const },
  { label: "الذاكرة (RAM)", value: 62, max: 100, unit: "%", color: "warning" as const },
  { label: "التخزين", value: 71, max: 100, unit: "%", color: "warning" as const },
  { label: "معدل الطلبات", value: 845, max: 1000, unit: "req/s", color: "primary" as const },
];

const latestTenants = [
  { name: "جامعة الملك سعود", users: 1240, status: "active" as const, plan: "Enterprise" },
  { name: "شركة تكوين التعليمية", users: 520, status: "active" as const, plan: "Business" },
  { name: "أكاديمية حسوب", users: 310, status: "active" as const, plan: "Business" },
  { name: "مؤسسة التعليم المرن", users: 86, status: "pending" as const, plan: "Starter" },
  { name: "كلية التقنية العالمية", users: 450, status: "active" as const, plan: "Enterprise" },
];

function SuperAdminDashboardPage() {
  const { user } = usePlatformAuth();

  return (
    <SuperAdminGuard>
      <AppPage maxWidth="xl">
        {/* Welcome section */}
        <AppPageHeader
          title={`مرحبًا، ${user?.name ?? "المشرف"}`}
          description="إليك ملخص منصة الإدارة لهذا اليوم"
          actions={
            <>
              <AppButton variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
                تحديث
              </AppButton>
              <AppButton variant="outline" size="sm">
                <Download className="h-4 w-4" />
                تصدير
              </AppButton>
              <AppButton size="sm">
                <Plus className="h-4 w-4" />
                مستأجر جديد
              </AppButton>
            </>
          }
        />

        <AppDivider className="mb-8" />

        {/* Quick stat cards */}
        <AppSection>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AppMetricCard title="إجمالي المستأجرين" value={128} icon={Building2} color="primary" trend={{ value: 12, positive: true }} delay={0} />
            <AppMetricCard title="المستخدمين النشطين" value={45280} icon={Users} color="success" trend={{ value: 8, positive: true }} delay={100} />
            <AppMetricCard title="المدرّبين" value={2840} icon={GraduationCap} color="info" trend={{ value: 15, positive: true }} delay={200} />
            <AppMetricCard title="الطلاب" value={38920} icon={UserPlus} color="primary" trend={{ value: 22, positive: true }} delay={300} />
          </div>
        </AppSection>

        {/* Secondary stat cards */}
        <AppSection>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AppMetricCard title="الدورات التدريبية" value={1560} icon={BookOpen} color="info" trend={{ value: 6, positive: true }} delay={100} />
            <AppMetricCard title="الشهادات" value={12400} icon={Award} color="warning" trend={{ value: 18, positive: true }} delay={200} />
            <AppMetricCard title="مقاطع الفيديو" value={28400} icon={Video} color="primary" trend={{ value: 9, positive: true }} delay={300} />
            <AppMetricCard title="مساحة التخزين" value={284} icon={HardDrive} color="success" suffix=" GB" trend={{ value: 32, positive: false }} delay={400} />
          </div>
        </AppSection>

        {/* Charts row */}
        <AppSection>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue chart */}
            <div className="lg:col-span-2">
              <AppChartCard
                title="الإيرادات السنوية"
                description="إجمالي الإيرادات خلال 12 شهر"
                badge={
                  <AppBadge variant="success" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +24.5%
                  </AppBadge>
                }
                chartHeight={220}
              >
                <div className="mb-2">
                  <span className="text-3xl font-bold tracking-tight">$312,580</span>
                  <span className="me-2 text-sm text-muted-foreground">إجمالي الإيرادات</span>
                </div>
                <div className="h-[200px]">
                  <AreaChart
                    data={monthlyRevenue}
                    height={200}
                    color="hsl(var(--success))"
                    gradient={{ from: "hsl(var(--success))", to: "hsl(var(--success))" }}
                    showGrid
                    showLabels
                  />
                </div>
              </AppChartCard>
            </div>

            {/* Donut chart */}
            <div>
              <AppChartCard title="توزيع المستأجرين" description="حسب القطاع">
                <div className="flex justify-center pt-4">
                  <DonutChart segments={tenantDistribution} size={180} strokeWidth={22} />
                </div>
              </AppChartCard>
            </div>
          </div>
        </AppSection>

        {/* Bottom row */}
        <AppSection>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Activity timeline */}
            <div className="lg:col-span-1">
              <AppCard className="card-elevated h-full">
                <AppCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <AppCardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                      النشاطات الأخيرة
                    </AppCardTitle>
                    <AppBadge variant="secondary" className="text-[10px]">
                      مباشر
                    </AppBadge>
                  </div>
                </AppCardHeader>
                <AppCardContent>
                  <ActivityTimeline events={recentActivity} />
                </AppCardContent>
              </AppCard>
            </div>

            {/* Latest tenants table */}
            <div className="lg:col-span-1">
              <AppCard className="card-elevated h-full">
                <AppCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <AppCardTitle className="flex items-center gap-2 text-lg">
                      <UserPlus className="h-5 w-5 text-success" />
                      آخر المستأجرين
                    </AppCardTitle>
                    <AppButton variant="ghost" size="sm" className="h-7 text-xs">
                      عرض الكل
                    </AppButton>
                  </div>
                </AppCardHeader>
                <AppCardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {latestTenants.map((tenant) => (
                      <div
                        key={tenant.name}
                        className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.users.toLocaleString("ar")} مستخدم
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <AppBadge
                            variant={tenant.status === "active" ? "success" : "warning"}
                            className="text-[10px] capitalize"
                          >
                            {tenant.status === "active" ? "نشط" : "قيد الانتظار"}
                          </AppBadge>
                          <span className="text-[10px] text-muted-foreground/60">
                            {tenant.plan}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </AppCardContent>
              </AppCard>
            </div>

            {/* System health */}
            <div className="lg:col-span-1">
              <AppCard className="card-elevated h-full">
                <AppCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <AppCardTitle className="flex items-center gap-2 text-lg">
                      <HardDrive className="h-5 w-5 text-primary" />
                      صحة النظام
                    </AppCardTitle>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      <span className="text-xs text-muted-foreground">جيد</span>
                    </div>
                  </div>
                </AppCardHeader>
                <AppCardContent>
                  <SystemHealthCard metrics={systemMetrics} />
                </AppCardContent>
              </AppCard>
            </div>
          </div>
        </AppSection>

        {/* Signups chart */}
        <AppSection>
          <AppChartCard
            title="نمو المستخدمين الجدد"
            description="عدد المشتركين الجدد شهريًا"
            badge={
              <AppBadge variant="default" className="gap-1">
                <UserPlus className="h-3 w-3" />
                +4,847 هذا العام
              </AppBadge>
            }
            chartHeight={200}
          >
            <div className="h-[180px]">
              <AreaChart
                data={signupsData}
                height={180}
                color="hsl(var(--primary))"
                gradient={{ from: "hsl(var(--primary))", to: "hsl(var(--primary))" }}
                showGrid
                showLabels
              />
            </div>
          </AppChartCard>
        </AppSection>

        {/* Footer */}
        <AppDivider />
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            منصة الإدارة — v1.0.0 · جميع الحقوق محفوظة
          </p>
        </div>
      </AppPage>
    </SuperAdminGuard>
  );
}

export default SuperAdminDashboardPage;
