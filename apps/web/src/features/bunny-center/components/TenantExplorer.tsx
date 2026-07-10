"use client";

import { memo, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Pin,
  Star,
  ChevronLeft,
  HardDrive,
  Wifi,
  Eye,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { AppBadge, AppProgress, AppAvatar, AppAvatarFallback, Skeleton } from "@/components/ui";
import { initialsOf } from "@/lib/format";
import { TENANT_STATUS_CONFIG } from "@/features/platform-tenants/constants";
import type { BunnyTenantUsage, BunnyCenterFilters, TopConsumer } from "../types";
import { TenantInspectorPanel } from "./TenantInspectorPanel";

interface TenantExplorerProps {
  tenants?: BunnyTenantUsage[];
  topConsumers?: TopConsumer[];
  loading?: boolean;
  filters: BunnyCenterFilters;
  onFilterChange: (filters: BunnyCenterFilters) => void;
  onRefresh?: () => void;
}

const ROW_HEIGHT = 64;
const OVERSCAN = 5;

const healthConfig = {
  healthy: { label: "سليم", color: "success" as const, dot: "bg-success" },
  warning: { label: "تحذير", color: "warning" as const, dot: "bg-warning" },
  critical: { label: "حرج", color: "destructive" as const, dot: "bg-destructive" },
};

function getStatusColor(status: string) {
  const cfg = TENANT_STATUS_CONFIG[status as keyof typeof TENANT_STATUS_CONFIG];
  return cfg?.label ?? status;
}

function getStatusVariant(status: string) {
  const cfg = TENANT_STATUS_CONFIG[status as keyof typeof TENANT_STATUS_CONFIG];
  return (cfg?.color as "success" | "warning" | "destructive" | "secondary" | "outline") ?? "secondary";
}

const TenantRow = memo(function TenantRow({
  tenant,
  selected,
  onSelect,
  onPin,
  onFavorite,
  style,
}: {
  tenant: BunnyTenantUsage;
  selected: boolean;
  onSelect: (t: BunnyTenantUsage) => void;
  onPin: (id: string) => void;
  onFavorite: (id: string) => void;
  style: React.CSSProperties;
}) {
  const health = healthConfig[tenant.health];
  const storagePct = tenant.storagePercentage;
  const bandwidthPct = tenant.bandwidthPercentage;
  const timeAgo = getRelativeTime(tenant.lastActivity);

  return (
    <motion.div
      layout
      style={style}
      className={cn(
        "absolute inset-x-0 flex items-center gap-3 border-b border-border/30 px-4 transition-colors duration-150 cursor-pointer",
        selected ? "bg-primary/5" : "hover:bg-muted/40",
      )}
      onClick={() => onSelect(tenant)}
      whileTap={{ scale: 0.995 }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onPin(tenant.tenantId); }}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
          tenant.pinned ? "text-primary" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-muted-foreground",
        )}
      >
        <Pin className="h-3 w-3" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onFavorite(tenant.tenantId); }}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
          tenant.favorited ? "text-amber-500" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-muted-foreground",
        )}
      >
        <Star className="h-3 w-3" />
      </button>

      <AppAvatar className="h-8 w-8 shrink-0 rounded-lg">
        <AppAvatarFallback className="text-[10px] font-semibold">
          {initialsOf(tenant.tenantName)}
        </AppAvatarFallback>
      </AppAvatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{tenant.tenantName}</span>
          <AppBadge variant={getStatusVariant(tenant.status)} className="text-[9px] px-1.5 py-0">
            {getStatusColor(tenant.status)}
          </AppBadge>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{tenant.plan}</span>
          <span className="text-muted-foreground/40">|</span>
          <span>{timeAgo}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <div className="w-20">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
            <HardDrive className="h-3 w-3" />
            <span className="tabular-nums">{tenant.storageUsed}GB</span>
          </div>
          <AppProgress value={storagePct} max={100} size="sm" variant={storagePct > 90 ? "destructive" : storagePct > 75 ? "warning" : "success"} />
        </div>
        <div className="w-20">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
            <Wifi className="h-3 w-3" />
            <span className="tabular-nums">{tenant.bandwidthUsed}GB</span>
          </div>
          <AppProgress value={bandwidthPct} max={100} size="sm" variant={bandwidthPct > 90 ? "destructive" : bandwidthPct > 75 ? "warning" : "success"} />
        </div>
        <div className="w-16 text-end">
          <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span className="tabular-nums">{formatNumber(tenant.viewsUsed)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", health.dot)} />
        <span className="text-xs tabular-nums font-medium">{tenant.usagePercentage}%</span>
      </div>

      <ChevronLeft className="h-4 w-4 text-muted-foreground/30 shrink-0" />
    </motion.div>
  );
});

function getRelativeTime(ts: string): string {
  const now = Date.now();
  const diff = now - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} ي`;
}

function TenantExplorer({ tenants, topConsumers, loading, filters, onFilterChange }: TenantExplorerProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [selectedTenant, setSelectedTenant] = useState<BunnyTenantUsage | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const sortedTenants = useMemo(() => {
    if (!tenants) return [];
    const sorted = [...tenants];
    sorted.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return 0;
    });
    return sorted;
  }, [tenants]);

  const virtualItems = useMemo(() => {
    const totalHeight = sortedTenants.length * ROW_HEIGHT;
    const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endIdx = Math.min(sortedTenants.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
    return {
      totalHeight,
      items: sortedTenants.slice(startIdx, endIdx).map((t, i) => ({
        tenant: t,
        index: startIdx + i,
        style: {
          height: ROW_HEIGHT,
          transform: `translateY(${(startIdx + i) * ROW_HEIGHT}px)`,
        } as React.CSSProperties,
      })),
      startIdx,
    };
  }, [sortedTenants, scrollTop, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleSelect = useCallback((tenant: BunnyTenantUsage) => {
    setSelectedTenant(tenant);
    setInspectorOpen(true);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setInspectorOpen(false);
    setTimeout(() => setSelectedTenant(null), 200);
  }, []);

  const handlePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleFavorite = useCallback((id: string) => {
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const tenantUsage = useMemo(() => {
    if (!selectedTenant) return null;
    const t = selectedTenant;
    return [
      { label: "المستخدم من التخزين", value: t.storageUsed, total: t.storageLimit, unit: "GB", color: "hsl(var(--primary))" },
      { label: "المستخدم من النطاق", value: t.bandwidthUsed, total: t.bandwidthLimit, unit: "GB", color: "hsl(var(--info))" },
      { label: "المستخدم من المشاهدات", value: t.viewsUsed, total: t.viewsLimit, unit: "", color: "hsl(var(--success))" },
    ];
  }, [selectedTenant]);

  const enrichedForInspector = useMemo(() => {
    if (!selectedTenant || !topConsumers) return null;
    return {
      ...selectedTenant,
      topFiles: topConsumers.slice(0, 5).map((c) => ({ name: c.tenantName, size: c.storage, type: "video" as const })),
      topVideos: topConsumers.slice(2, 7).map((c) => ({ name: c.tenantName, views: c.views, duration: "15:30" })),
    };
  }, [selectedTenant, topConsumers]);

  const showSearch = useMemo(() => ({
    search: searchValue,
    onSearchChange: (v: string) => {
      setSearchValue(v);
      onFilterChange({ ...filters, search: v });
    },
  }), [searchValue, filters, onFilterChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">مستكشف المؤسسات</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => showSearch.onSearchChange(e.target.value)}
              placeholder="بحث..."
              className="h-9 w-48 rounded-lg border border-border/50 bg-muted/50 pe-3 ps-9 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20"
              aria-label="بحث عن مؤسسة"
            />
          </div>
        </div>
      </div>

      <div className="relative flex gap-0">
        <motion.div
          layout
          className={cn(
            "relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300",
            inspectorOpen ? "flex-1" : "w-full",
          )}
        >
          <div
            ref={containerRef}
            className="h-[600px] overflow-y-auto scrollbar-thin"
            onScroll={handleScroll}
          >
            {/* Column headers */}
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card/95 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 backdrop-blur-sm">
              <div className="w-12" />
              <div className="w-8" />
              <div className="w-8" />
              <div className="min-w-0 flex-1">المؤسسة</div>
              <div className="hidden md:flex items-center gap-4">
                <span className="w-20">التخزين</span>
                <span className="w-20">النطاق</span>
                <span className="w-16 text-end">المشاهدات</span>
              </div>
              <span className="w-16 text-end">الاستخدام</span>
              <div className="w-4" />
            </div>

            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : virtualItems.items.length > 0 ? (
              <div className="relative" style={{ height: virtualItems.totalHeight }}>
                {virtualItems.items.map((item) => (
                  <TenantRow
                    key={item.tenant.tenantId}
                    tenant={{
                      ...item.tenant,
                      pinned: pinnedIds.has(item.tenant.tenantId),
                      favorited: favIds.has(item.tenant.tenantId),
                    }}
                    selected={selectedTenant?.tenantId === item.tenant.tenantId}
                    onSelect={handleSelect}
                    onPin={handlePin}
                    onFavorite={handleFavorite}
                    style={item.style}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MapPin className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">لا توجد نتائج</p>
                <p className="text-xs text-muted-foreground/60">حاول تغيير معايير البحث</p>
              </div>
            )}

            <div className="sticky bottom-0 border-t bg-card/95 px-4 py-2 text-[11px] text-muted-foreground/50 backdrop-blur-sm">
              {tenants ? `${tenants.length} مؤسسة` : "—"}
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {inspectorOpen && enrichedForInspector && (
            <TenantInspectorPanel
              tenant={enrichedForInspector}
              onClose={handleCloseInspector}
              usageData={tenantUsage ?? []}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { TenantExplorer };
