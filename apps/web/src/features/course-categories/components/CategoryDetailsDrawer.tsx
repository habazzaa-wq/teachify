"use client";

import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import {
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
  AppDrawer,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { useCategory } from "../hooks";
import { CategoryOverviewTab } from "./CategoryOverviewTab";
import { CategoryChildrenTab } from "./CategoryChildrenTab";
import { CategoryCoursesTab } from "./CategoryCoursesTab";
import { CategorySEOTab } from "./CategorySEOTab";
import { CategoryActivityTab } from "./CategoryActivityTab";
import { CategoryNotesTab } from "./CategoryNotesTab";

interface CategoryDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
}

const TABS = [
  { value: "overview", label: "نظرة عامة" },
  { value: "children", label: "التصنيفات الفرعية" },
  { value: "courses", label: "الدورات" },
  { value: "seo", label: "SEO" },
  { value: "activity", label: "النشاطات" },
  { value: "notes", label: "ملاحظات" },
];

function CategoryDetailsDrawer({
  open,
  onOpenChange,
  categoryId,
}: CategoryDetailsDrawerProps) {
  const { data: category, isLoading } = useCategory(categoryId);
  const [activeTab, setActiveTab] = useState("overview");
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(["overview"]));

  useEffect(() => {
    if (open) {
      setActiveTab("overview");
      setMountedTabs(new Set(["overview"]));
    }
  }, [open]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setMountedTabs((prev) => new Set(prev).add(value));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!category && isLoading) {
    return (
      <AppDrawer open={open} onOpenChange={onOpenChange} side="end" className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]">
        <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
          <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </header>
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </AppDrawer>
    );
  }

  const drawerTitle = category?.name || "تفاصيل التصنيف";

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[80vw] lg:max-w-[900px] xl:max-w-[960px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label={drawerTitle}>
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <span className="text-sm font-bold text-primary">{category?.name?.charAt(0) ?? "?"}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {drawerTitle}
              </h2>
              <p className="text-xs text-muted-foreground">{category?.slug} • {category?.coursesCount ?? 0} دورات</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="shrink-0 border-b bg-background z-10">
          <div className="px-6 overflow-x-auto scrollbar-thin">
            <AppTabs value={activeTab} onValueChange={handleTabChange}>
              <AppTabsList className="flex h-auto gap-0 bg-transparent p-0 w-full border-0">
                {TABS.map((tab) => (
                  <AppTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                      "bg-transparent shadow-none rounded-none",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      "data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      "data-[state=inactive]:text-muted-foreground",
                      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all after:duration-200",
                      "data-[state=active]:after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100",
                      "data-[state=inactive]:hover:after:bg-muted-foreground/20 data-[state=inactive]:hover:after:scale-x-100",
                    )}
                  >
                    {tab.label}
                  </AppTabsTrigger>
                ))}
              </AppTabsList>
            </AppTabs>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto min-h-0 bg-muted/10"
          style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}
        >
          {category && (
            <div className="p-6">
              {(activeTab === "overview" || mountedTabs.has("overview")) && (
                <div style={{ display: activeTab === "overview" ? "block" : "none" }}>
                  <CategoryOverviewTab category={category} />
                </div>
              )}
              {(activeTab === "children" || mountedTabs.has("children")) && (
                <div style={{ display: activeTab === "children" ? "block" : "none" }}>
                  <CategoryChildrenTab category={category} />
                </div>
              )}
              {(activeTab === "courses" || mountedTabs.has("courses")) && (
                <div style={{ display: activeTab === "courses" ? "block" : "none" }}>
                  <CategoryCoursesTab category={category} />
                </div>
              )}
              {(activeTab === "seo" || mountedTabs.has("seo")) && (
                <div style={{ display: activeTab === "seo" ? "block" : "none" }}>
                  <CategorySEOTab category={category} />
                </div>
              )}
              {(activeTab === "activity" || mountedTabs.has("activity")) && (
                <div style={{ display: activeTab === "activity" ? "block" : "none" }}>
                  <CategoryActivityTab category={category} />
                </div>
              )}
              {(activeTab === "notes" || mountedTabs.has("notes")) && (
                <div style={{ display: activeTab === "notes" ? "block" : "none" }}>
                  <CategoryNotesTab category={category} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}

export { CategoryDetailsDrawer };