"use client";

import { AppDrawer, AppDialogHeader, AppDialogTitle, AppTabs, AppTabsList, AppTabsTrigger, AppTabsContent } from "@/components/ui";
import { ModuleOverviewTab } from "./ModuleOverviewTab";
import { ModuleActivityTab } from "./ModuleActivityTab";
import { ModuleNotesTab } from "./ModuleNotesTab";
import type { CourseModule } from "../types";

interface ModuleDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: CourseModule | null;
}

export function ModuleDetailsDrawer({ open, onOpenChange, module }: ModuleDetailsDrawerProps) {
  if (!module) return null;

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} side="end">
      <AppDialogHeader className="px-6 pt-6">
        <AppDialogTitle>{module.title}</AppDialogTitle>
      </AppDialogHeader>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AppTabs defaultValue="overview">
          <AppTabsList className="w-full">
            <AppTabsTrigger value="overview" className="flex-1">نظرة عامة</AppTabsTrigger>
            <AppTabsTrigger value="activity" className="flex-1">النشاط</AppTabsTrigger>
            <AppTabsTrigger value="notes" className="flex-1">ملاحظات</AppTabsTrigger>
          </AppTabsList>
          <AppTabsContent value="overview">
            <ModuleOverviewTab module={module} />
          </AppTabsContent>
          <AppTabsContent value="activity">
            <ModuleActivityTab />
          </AppTabsContent>
          <AppTabsContent value="notes">
            <ModuleNotesTab notes={module.notes} />
          </AppTabsContent>
        </AppTabs>
      </div>
    </AppDrawer>
  );
}
