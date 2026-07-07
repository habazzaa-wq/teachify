import { FileText } from "lucide-react";

interface ModuleNotesTabProps {
  notes: string | null;
}

export function ModuleNotesTab({ notes }: ModuleNotesTabProps) {
  if (!notes) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground/60">لا توجد ملاحظات</p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <p className="text-sm whitespace-pre-wrap">{notes}</p>
    </div>
  );
}
