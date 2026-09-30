"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Users,
  BookOpen,
  HardDrive,
  FileCheck2,
  Clock3,
  RefreshCw,
  Download,
  Plus,
  AlertTriangle,
  Info,
} from "lucide-react";
import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import { usePlatformAuth } from "@/providers/PlatformAuthProvider";
import {
  AppButton,
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppPage,
  AppPageHeader,
  AppSection,
  AppMetricCard,
  AppDivider,
} from "@/components/ui";
import { SystemHealthCard } from "@/components/dashboard";
import {
  platformStatsService,
  formatBytes,
  formatUptime,
} from "@/services/api/platform-stats.service";
import type { PlatformStats } from "@/types/platform-stats.types";

type SystemMetric = {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: "success" | "warning" | "primary";
};

function buildSystemMetrics(stats: PlatformStats | null): SystemMetric[] {
  if (!stats) return [];

  const memoryPercent = stats.host.memory?.used_percent ?? null;
  const diskUsedPercent =
    stats.host.disk_free_bytes !== null && stats.host.disk_total_bytes
      ? Math.round(
          ((stats.host.disk_total_bytes - stats.host.disk_free_bytes) /
            stats.host.disk_total_bytes) *
            100,
        )
      : null;
  const load = stats.host.load_average?.[0] ?? null;
  const cpuCount = stats.host.cpu_count;

  const colorFor = (percent: number | null): SystemMetric["color"] => {
    if (percent === null) return "primary";
    if (percent >= 75) return "warning";
    return "success";
  };

  const metrics: SystemMetric[] = [];

  if (memoryPercent !== null) {
    metrics.push({
      label: "الذاكرة (RAM)",
      value: memoryPercent,
      max: 100,
      unit: "%",
      color: colorFor(memoryPercent),
    });
  }

  if (diskUsedPercent !== null) {
    metrics.push({
      label: "التخزين",
      value: diskUsedPercent,
      max: 100,
      unit: "%",
      color: colorFor(diskUsedPercent),
    });
  }

  if (load !== null && cpuCount) {
    metrics.push({
      label: "حمل المعالج",
      value: Math.min(Math.round(load * 100), 100),
      max: 100,
      unit: "%",
      color: load > cpuCount ? "warning" : "success",
    });
  }

  const backlog = stats.queues.backlog_total;
  if (Number.isFinite(backlog)) {
    metrics.push({
      label: "مهام الطابور",
      value: Math.min(backlog, 999),
      max: 999,
      unit: "",
      color: backlog > 100 ? "warning" : "success",
    });
  }

  return metrics;
}

function SuperAdminDashboardPage() {
  const { user } = usePlatformAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All state updates live in promise callbacks, never synchronously in the
  // effect body. A manual refresh just bumps `reloadToken` to re-run the fetch.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    platformStatsService
      .getStats()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setStats(null);
        setError("تعذّر تحميل إحصاءات المنصة.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const loadStats = useCallback(() => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  const counts = stats?.counts;
  const systemMetrics = buildSystemMetrics(stats);
  const failedJobs = stats?.queues.failed ?? null;
  const updatedAt = stats?.generated_at
    ? new Date(stats.generated_at).toLocaleString("ar")
    : null;

  // AppMetricCard animates a number, so it cannot render a placeholder; the
  // card's own skeleton covers the loading state instead.
  const num = (value: number | undefined | null) => value ?? 0;
  const text = (value: number | undefined | null) =>
    value === undefined || value === null ? "—" : value.toLocaleString("ar");

  return (
    <SuperAdminGuard>
      <AppPage maxWidth="xl">
        <AppPageHeader
          title={`مرحبًا، ${user?.name ?? "المشرف"}`}
          description="ملخص حقيقي للمنصة، مقروء مباشرة من قاعدة البيانات والخادم"
          actions={
            <>
              <AppButton
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={loading}
              >
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

        {error && (
          <AppCard className="mb-6 border-destructive/40">
            <AppCardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium">{error}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  لم يتم عرض أي أرقام تقديرية بدلاً منها.
                </p>
              </div>
            </AppCardContent>
          </AppCard>
        )}

        {/* Real platform counters */}
        <AppSection>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AppMetricCard
              title="إجمالي المستأجرين"
              value={num(counts?.tenants)}
              icon={Building2}
              color="primary"
              loading={loading}
              delay={0}
            />
            <AppMetricCard
              title="المستخدمين"
              value={num(counts?.users)}
              icon={Users}
              color="success"
              loading={loading}
              delay={100}
            />
            <AppMetricCard
              title="الدورات التدريبية"
              value={num(counts?.courses)}
              icon={BookOpen}
              color="info"
              loading={loading}
              delay={200}
            />
            <AppMetricCard
              title="الامتحانات"
              value={num(counts?.exams)}
              icon={FileCheck2}
              color="primary"
              loading={loading}
              delay={300}
            />
          </div>
        </AppSection>

        <AppSection>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AppMetricCard
              title="محاولات الامتحان"
              value={num(counts?.exam_attempts)}
              icon={FileCheck2}
              color="info"
              loading={loading}
              delay={0}
            />
            <AppMetricCard
              title="بانتظار التصحيح"
              value={num(counts?.exam_attempts_pending)}
              icon={Clock3}
              color="warning"
              loading={loading}
              delay={100}
            />
            <AppMetricCard
              title="نطاقات المستأجرين"
              value={num(counts?.tenant_domains)}
              icon={HardDrive}
              color="primary"
              loading={loading}
              delay={200}
            />
            <AppMetricCard
              title="مهام الطابور"
              value={num(stats?.queues.backlog_total)}
              icon={Clock3}
              color={stats && stats.queues.backlog_total > 100 ? "warning" : "success"}
              loading={loading}
              delay={300}
            />
          </div>
        </AppSection>

        {/* System health */}
        <AppSection>
          <AppCard className="card-elevated">
            <AppCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <AppCardTitle className="flex items-center gap-2 text-lg">
                  <HardDrive className="h-5 w-5 text-primary" />
                  صحة النظام
                </AppCardTitle>
                {updatedAt && (
                  <span className="text-xs text-muted-foreground">
                    حُدّث {updatedAt}
                  </span>
                )}
              </div>
            </AppCardHeader>
            <AppCardContent>
              {systemMetrics.length > 0 ? (
                <SystemHealthCard metrics={systemMetrics} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {loading
                    ? "جارٍ القراءة من الخادم…"
                    : "لا توجد مقاييس متاحة على هذا الخادم."}
                </p>
              )}

              <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <span>
                  الذاكرة المتاحة:{" "}
                  {formatBytes(
                    stats?.host.memory ? stats.host.memory.available * 1024 : null,
                  ) ?? "—"}
                </span>
                <span>
                  المساحة الحرة: {formatBytes(stats?.host.disk_free_bytes) ?? "—"}
                </span>
                <span>
                  مدة التشغيل: {formatUptime(stats?.host.uptime_seconds) ?? "—"}
                </span>
                <span>مهام فاشلة: {text(failedJobs)}</span>
              </div>
            </AppCardContent>
          </AppCard>
        </AppSection>

        {/* Where no data source exists yet, say so instead of inventing numbers */}
        <AppSection>
          <AppCard className="card-elevated">
            <AppCardHeader className="pb-3">
              <AppCardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-muted-foreground" />
                مؤشرات غير مفعلة بعد
              </AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                هذه اللوحة كانت تعرض أرقامًا ثابتة لم تأتِ من أي مصدر بيانات
                حقيقي. تم حذفها بدل عرض قيم مضللة:
              </p>
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li>• الإيرادات السنوية ونمو الاشتراكات</li>
                <li>• توزيع المستأجرين حسب القطاع</li>
                <li>• النشاطات الأخيرة</li>
                <li>• عدد المدرّبين والطلاب والشهادات والفيديوهات</li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                تتطلب هذه المؤشرات جداول إيرادات/اشتراكات وخدمة تسجيل أحداث،
                ولم تُبنَ بعد.
              </p>
            </AppCardContent>
          </AppCard>
        </AppSection>

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