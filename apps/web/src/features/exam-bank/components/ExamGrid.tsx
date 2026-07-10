"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Exam, ViewMode } from "@/features/exam-bank/types";
import { ExamCard } from "./ExamCard";

interface ExamGridProps {
  exams: Exam[];
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onExamClick: (exam: Exam) => void;
  onTogglePin?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  selectable?: boolean;
}

export function ExamGrid({
  exams,
  viewMode,
  selectedIds,
  onSelectionChange,
  onExamClick,
  onTogglePin,
  onToggleFavorite,
  onDuplicate,
  onArchive,
  onDelete,
  onPublish,
  selectable = true,
}: ExamGridProps) {
  const lastIndexRef = useRef<number | null>(null);
  const modifiersRef = useRef({ shift: false, ctrl: false, meta: false });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      modifiersRef.current = { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey };
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(
    (exam: Exam, checked: boolean, index: number) => {
      const { shift, ctrl, meta } = modifiersRef.current;
      const next = new Set(selectedIds);

      if (shift && lastIndexRef.current !== null) {
        const start = Math.min(lastIndexRef.current, index);
        const end = Math.max(lastIndexRef.current, index);
        for (let i = start; i <= end; i++) {
          const id = exams[i]?.id;
          if (id) next.add(id);
        }
      } else if (ctrl || meta) {
        if (checked) next.add(exam.id);
        else next.delete(exam.id);
      } else if (checked) {
        next.add(exam.id);
      } else {
        next.delete(exam.id);
      }

      lastIndexRef.current = index;
      onSelectionChange(next);
    },
    [exams, selectedIds, onSelectionChange],
  );

  const gridClass =
    viewMode === "list"
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <motion.div layout className={cn(gridClass)}>
      <AnimatePresence mode="popLayout">
        {exams.map((exam, index) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            viewMode={viewMode}
            selected={selectedIds.has(exam.id)}
            selectable={selectable}
            onSelect={(e, checked) => handleSelect(e, checked, index)}
            onClick={onExamClick}
            onTogglePin={onTogglePin}
            onToggleFavorite={onToggleFavorite}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onDelete={onDelete}
            onPublish={onPublish}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export default ExamGrid;
