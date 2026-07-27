"use client";

import { memo, useCallback } from "react";
import { Eye, MoreHorizontal, GraduationCap, Ban, CheckCircle, Trash2 } from "lucide-react";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
  AppAvatar,
  AppAvatarImage,
  AppAvatarFallback,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppCheckbox,
} from "@/components/ui";
import { formatDate, formatDateTime, initialsOf } from "@/lib/format";
import { STUDENT_STATUS_CONFIG } from "../constants";
import type { Student } from "../types";

interface StudentTableProps {
  students: Student[];
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
  onView: (student: Student) => void;
  onActivate: (student: Student) => void;
  onSuspend: (student: Student) => void;
  onDelete: (student: Student) => void;
}

const StudentTableRow = memo(function StudentTableRow({
  student,
  isSelected,
  onSelectToggle,
  onView,
  onActivate,
  onSuspend,
  onDelete,
}: {
  student: Student;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onView: (student: Student) => void;
  onActivate: (student: Student) => void;
  onSuspend: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  const statusConfig = STUDENT_STATUS_CONFIG[student.status];

  return (
    <AppTableRow className={isSelected ? "bg-muted/50" : ""}>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppCheckbox
          checked={isSelected}
          onCheckedChange={() => onSelectToggle(student.id)}
          aria-label={`تحديد ${student.fullName}`}
        />
      </AppTableCell>
      <AppTableCell className="cursor-pointer" onClick={() => onView(student)}>
        <div className="flex items-center gap-3 min-w-0">
          <AppAvatar className="h-9 w-9">
            {student.avatar && <AppAvatarImage src={student.avatar} alt={student.fullName} />}
            <AppAvatarFallback className="text-xs">{initialsOf(student.fullName)}</AppAvatarFallback>
          </AppAvatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{student.fullName}</p>
            <p className="text-xs text-muted-foreground truncate" dir="ltr">{student.email}</p>
          </div>
        </div>
      </AppTableCell>
      <AppTableCell className="text-sm text-muted-foreground cursor-pointer" dir="ltr" onClick={() => onView(student)}>
        {student.phone || "—"}
      </AppTableCell>
      <AppTableCell className="cursor-pointer" onClick={() => onView(student)}>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">{student.enrolledCoursesCount}</span>
            <span className="text-muted-foreground mr-1">كورس</span>
          </span>
        </div>
      </AppTableCell>
      <AppTableCell className="cursor-pointer" onClick={() => onView(student)}>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm">
            <span className="font-medium">{student.completedCoursesCount}</span>
            <span className="text-muted-foreground mr-1">مكتمل</span>
          </span>
        </div>
      </AppTableCell>
      <AppTableCell className="cursor-pointer" onClick={() => onView(student)}>
        <AppBadge
          variant={statusConfig.color as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}
          className="text-[10px] gap-1"
        >
          <span
            className={statusConfig.color === "success" ? "bg-success" : statusConfig.color === "secondary" ? "bg-muted-foreground" : "bg-destructive"}
            style={{ height: 6, width: 6, borderRadius: "50%", display: "inline-block" }}
          />
          {statusConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums cursor-pointer" onClick={() => onView(student)}>
        {student.lastActivityAt ? formatDateTime(student.lastActivityAt) : "—"}
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums cursor-pointer" onClick={() => onView(student)}>
        {formatDate(student.createdAt)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppDropdownMenu>
          <AppDropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </AppDropdownMenuTrigger>
          <AppDropdownMenuContent align="end" className="w-44">
            <AppDropdownMenuItem onClick={() => onView(student)}>
              <Eye className="h-4 w-4" />
              عرض التفاصيل
            </AppDropdownMenuItem>
            {student.status !== "active" && (
              <AppDropdownMenuItem onClick={() => onActivate(student)}>
                <CheckCircle className="h-4 w-4" />
                تفعيل
              </AppDropdownMenuItem>
            )}
            {student.status === "active" && (
              <AppDropdownMenuItem onClick={() => onSuspend(student)} className="text-destructive focus:text-destructive">
                <Ban className="h-4 w-4" />
                إيقاف
              </AppDropdownMenuItem>
            )}
            <AppDropdownMenuItem onClick={() => onDelete(student)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />
              حذف
            </AppDropdownMenuItem>
          </AppDropdownMenuContent>
        </AppDropdownMenu>
      </AppTableCell>
    </AppTableRow>
  );
});

function StudentTable({
  students,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  onView,
  onActivate,
  onSuspend,
  onDelete,
}: StudentTableProps) {
  const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));

  const handleSelectAll = useCallback(() => {
    onSelectAll();
  }, [onSelectAll]);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <AppTable>
        <AppTableHeader>
          <AppTableRow>
            <AppTableHead className="w-10">
              <AppCheckbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="تحديد الكل"
              />
            </AppTableHead>
            <AppTableHead>الطالب</AppTableHead>
            <AppTableHead>الهاتف</AppTableHead>
            <AppTableHead>الكورسات</AppTableHead>
            <AppTableHead>المكتملة</AppTableHead>
            <AppTableHead>الحالة</AppTableHead>
            <AppTableHead>آخر نشاط</AppTableHead>
            <AppTableHead>تاريخ الانضمام</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {students.map((student) => (
            <StudentTableRow
              key={student.id}
              student={student}
              isSelected={selectedIds.has(student.id)}
              onSelectToggle={onSelectToggle}
              onView={onView}
              onActivate={onActivate}
              onSuspend={onSuspend}
              onDelete={onDelete}
            />
          ))}
        </AppTableBody>
      </AppTable>
    </div>
  );
}

export { StudentTable };
