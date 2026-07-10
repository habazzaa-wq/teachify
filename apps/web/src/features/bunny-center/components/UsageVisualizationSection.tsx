"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, DonutChart } from "@/components/dashboard";
import { AppChartCard } from "@/components/ui";
import type { UsageReport, TopConsumer } from "../types";

interface UsageVisualizationSectionProps {
  usageReport?: UsageReport;
  topConsumers?: TopConsumer[];
  loading?: boolean;
}

const chartColors = {
  storage: { color: "hsl(var(--primary))", gradient: { from: "hsl(var(--primary))", to: "hsl(var(--primary))" } },
  bandwidth: { color: "hsl(var(--info))", gradient: { from: "hsl(var(--info))", to: "hsl(var(--info))" } },
  views: { color: "hsl(var(--success))", gradient: { from: "hsl(var(--success))", to: "hsl(var(--success))" } },
  requests: { color: "hsl(var(--warning))", gradient: { from: "hsl(var(--warning))", to: "hsl(var(--warning))" } },
};

const consumerColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const TopConsumerItem = memo(function TopConsumerItem({ consumer, index }: { consumer: TopConsumer; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-xs font-semibold tabular-nums text-muted-foreground w-5">{index + 1}</span>
        <span className="text-sm truncate">{consumer.tenantName}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs tabular-nums text-muted-foreground">{consumer.storage} GB</span>
        <span className="text-xs tabular-nums text-muted-foreground">{consumer.bandwidth} GB</span>
        <span className={consumer.growth > 20 ? "text-xs tabular-nums text-success font-medium" : "text-xs tabular-nums text-muted-foreground"}>
          +{consumer.growth}%
        </span>
      </div>
    </motion.div>
  );
});

function UsageVisualizationSection({ usageReport, topConsumers, loading }: UsageVisualizationSectionProps) {
  const donutSegments = useMemo(() => {
    if (!topConsumers) return [];
    return topConsumers.slice(0, 5).map((c, i) => ({
      label: c.tenantName.length > 12 ? c.tenantName.slice(0, 12) + "..." : c.tenantName,
      value: c.storage,
      color: consumerColors[i] ?? "hsl(var(--muted))",
    }));
  }, [topConsumers]);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">تصور الاستخدام</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AppChartCard title="التخزين" description="على مدار 12 شهر" loading={loading}>
          {usageReport && <AreaChart data={usageReport.storage} height={160} {...chartColors.storage} showGrid showLabels />}
        </AppChartCard>
        <AppChartCard title="النطاق الترددي" description="على مدار 12 شهر" loading={loading}>
          {usageReport && <AreaChart data={usageReport.bandwidth} height={160} {...chartColors.bandwidth} showGrid showLabels />}
        </AppChartCard>
        <AppChartCard title="المشاهدات" description="على مدار 12 شهر" loading={loading}>
          {usageReport && <AreaChart data={usageReport.views} height={160} {...chartColors.views} showGrid showLabels />}
        </AppChartCard>
        <AppChartCard title="الطلبات" description="على مدار 12 شهر" loading={loading}>
          {usageReport && <AreaChart data={usageReport.requests} height={160} {...chartColors.requests} showGrid showLabels />}
        </AppChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AppChartCard
          title="أكثر المستهلكين"
          description="أعلى 10 مؤسسات في استخدام التخزين"
          loading={loading}
        >
          {topConsumers && (
            <div className="divide-y divide-border/50">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-xs font-medium text-muted-foreground">المؤسسة</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground w-12 text-end">تخزين</span>
                  <span className="text-xs font-medium text-muted-foreground w-12 text-end">نطاق</span>
                  <span className="text-xs font-medium text-muted-foreground w-12 text-end">نمو</span>
                </div>
              </div>
              {topConsumers.map((c, i) => (
                <TopConsumerItem key={c.tenantId} consumer={c} index={i} />
              ))}
            </div>
          )}
        </AppChartCard>

        <AppChartCard
          title="توزيع التخزين"
          description="أكبر 5 مؤسسات"
          loading={loading}
        >
          {topConsumers && (
            <div className="flex justify-center pt-4">
              <DonutChart segments={donutSegments} size={180} strokeWidth={20} />
            </div>
          )}
        </AppChartCard>
      </div>
    </div>
  );
}

export { UsageVisualizationSection };
