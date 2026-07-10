import { FileQuestion, type LucideIcon } from "lucide-react";
import { StudioEmptyState } from "@/components/studio";

interface ExamEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function ExamEmptyState({ icon: Icon = FileQuestion, title, description, action }: ExamEmptyStateProps) {
  return (
    <StudioEmptyState
      icon={<Icon className="h-8 w-8" />}
      title={title ?? "لا توجد اختبارات"}
      description={description ?? "ابدأ بإنشاء اختبار جديد من مكتبة الأسئلة."}
      action={action}
    />
  );
}
