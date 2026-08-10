"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { formatNumber, initialsOf } from "@/lib/format";
import type { StageTeacher } from "../types";
import { PRIMARY } from "../constants";

interface StageTeachersStripProps {
  teachers: StageTeacher[];
  activeTeacherId?: string;
  onSelect: (teacherId: string | undefined) => void;
}

export function StageTeachersStrip({ teachers, activeTeacherId, onSelect }: StageTeachersStripProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  if (!teachers.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      dir="rtl"
      className="mb-6 flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin"
    >
      {teachers.map((teacher) => {
        const active = teacher.id === activeTeacherId;

        return (
          <button
            key={teacher.id}
            type="button"
            onClick={() => onSelect(active ? undefined : teacher.id)}
            className="group flex shrink-0 items-center gap-2 rounded-full py-1.5 pe-4 ps-1.5 transition-all duration-300"
            style={{
              background: active ? PRIMARY : isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.85)",
              border: `1px solid ${active ? PRIMARY : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              boxShadow: active
                ? `0 4px 16px rgb(var(--brand-primary-rgb) / 0.251)`
                : isDark
                  ? "0 1px 2px rgba(0,0,0,0.2)"
                  : "0 1px 3px rgba(120,90,60,0.05)",
            }}
          >
            {teacher.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={teacher.avatar}
                alt={teacher.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))` }}
              >
                {initialsOf(teacher.name)}
              </span>
            )}
            <span
              className="text-xs font-bold"
              style={{ color: active ? "#fff" : isDark ? "#F0ECE6" : "#1a1510" }}
            >
              {teacher.name}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-bold tabular-nums"
              style={{ color: active ? "rgba(255,255,255,0.85)" : isDark ? "#8a8290" : "#9CA3AF" }}
            >
              <Users className="h-3 w-3" />
              {formatNumber(teacher.coursesCount)}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
