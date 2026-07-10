"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { cn } from "@/lib/cn";

const MIN_WIDTH = 260;
const MAX_WIDTH = 480;

export function WorkspaceRightInspector() {
  const {
    rightInspectorOpen,
    rightInspectorWidth,
    setRightInspectorOpen,
    setRightInspectorWidth,
  } = useWorkspaceStore();

  const [isResizing, setIsResizing] = useState(false);
  const isRTL = typeof document !== "undefined"
    ? document.documentElement.dir === "rtl"
    : true;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = rightInspectorWidth;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = isRTL
          ? startWidth + delta
          : startWidth - delta;
        setRightInspectorWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [rightInspectorWidth, setRightInspectorWidth, isRTL],
  );

  const handleClose = useCallback(() => {
    setRightInspectorOpen(false);
  }, [setRightInspectorOpen]);

  return (
    <AnimatePresence>
      {rightInspectorOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: rightInspectorWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative flex h-full flex-col overflow-hidden bg-studio-surface border-r border-studio-border",
            isResizing && "select-none",
          )}
          role="complementary"
          aria-label="لوحة الخصائص"
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              "absolute top-0 z-20 flex w-3 cursor-col-resize items-center justify-center transition-colors hover:bg-studio-accent/20",
              isResizing && "bg-studio-accent/20",
              isRTL ? "right-0" : "left-0",
            )}
            style={{ height: "100%" }}
            role="separator"
            aria-orientation="vertical"
            aria-label="تغيير عرض اللوحة"
            tabIndex={0}
          >
            <GripVertical className="h-4 w-4 text-studio-fg-subtle" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-studio-border px-4 py-3">
            <h3 className="text-sm font-semibold text-studio-fg">
              الخصائص
            </h3>
            <StudioButton
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="إغلاق لوحة الخصائص"
            >
              <X className="h-4 w-4" />
            </StudioButton>
          </div>

          {/* Empty content placeholder */}
          <div className="flex-1 overflow-y-auto studio-scrollbar p-4">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-xl border border-dashed border-studio-border p-6">
                <p className="text-sm text-studio-fg-muted">
                  لوحة الخصائص
                </p>
                <p className="mt-1 text-xs text-studio-fg-subtle">
                  سيتم عرض تفاصيل العنصر المحدد هنا
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
