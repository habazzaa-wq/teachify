"use client";

import { AppPageHeader, AppWidget, AppEmptyState, AppButton, AppTabs, AppTabsList, AppTabsTrigger, AppTabsContent } from "@/components/ui";
import { Calendar, Plus } from "lucide-react";

function CalendarPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <AppPageHeader
        title="التقويم"
        description="جدولة الأحداث والمواعيد"
        actions={
          <AppButton size="sm">
            <Plus className="h-4 w-4" />
            حدث جديد
          </AppButton>
        }
      />

      <AppTabs defaultValue="month">
        <AppTabsList>
          <AppTabsTrigger value="month">شهري</AppTabsTrigger>
          <AppTabsTrigger value="week">أسبوعي</AppTabsTrigger>
          <AppTabsTrigger value="day">يومي</AppTabsTrigger>
          <AppTabsTrigger value="agenda">قائمة</AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value="month" className="mt-6">
          <AppWidget variant="default">
            <AppEmptyState
              icon={Calendar}
              title="لا توجد أحداث"
              description="لم يتم إضافة أي أحداث بعد. قم بإنشاء حدث جديد للبدء."
              action={
                <AppButton size="sm">
                  <Plus className="h-4 w-4" />
                  إضافة حدث
                </AppButton>
              }
              secondaryAction={
                <span>يمكنك مزامنة التقويم مع Google Calendar أو Outlook</span>
              }
            />
          </AppWidget>
        </AppTabsContent>

        <AppTabsContent value="week" className="mt-6">
          <AppWidget variant="default">
            <AppEmptyState icon={Calendar} title="لا توجد أحداث هذا الأسبوع" variant="compact" />
          </AppWidget>
        </AppTabsContent>

        <AppTabsContent value="day" className="mt-6">
          <AppWidget variant="default">
            <AppEmptyState icon={Calendar} title="لا توجد أحداث اليوم" variant="compact" />
          </AppWidget>
        </AppTabsContent>

        <AppTabsContent value="agenda" className="mt-6">
          <AppWidget variant="default">
            <AppEmptyState icon={Calendar} title="قائمة الأحداث فارغة" variant="compact" />
          </AppWidget>
        </AppTabsContent>
      </AppTabs>
    </div>
  );
}

export default CalendarPage;
