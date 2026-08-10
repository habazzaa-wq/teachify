"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import type { StageItem } from "@/features/homepage/educational-stages/types";
import { PRIMARY } from "../constants";

interface CatalogStageStripProps {
  stages: StageItem[];
  activeStageId?: string;
  onSelect: (stageId: string | undefined) => void;
}

export function CatalogStageStrip({ stages, activeStageId, onSelect }: CatalogStageStripProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  if (!stages.length) {
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
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className="group flex shrink-0 items-center gap-2 rounded-full px-4 py-2 transition-all duration-300"
        style={{
          background: !activeStageId ? PRIMARY : isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.85)",
          border: `1px solid ${!activeStageId ? PRIMARY : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          boxShadow: !activeStageId
            ? `0 4px 16px rgb(var(--brand-primary-rgb) / 0.251)`
            : isDark
              ? "0 1px 2px rgba(0,0,0,0.2)"
              : "0 1px 3px rgba(120,90,60,0.05)",
        }}
      >
        <Layers
          className="h-4 w-4"
          style={{ color: !activeStageId ? "#fff" : isDark ? "#8a8290" : "#9CA3AF" }}
        />
        <span
          className="text-xs font-bold"
          style={{ color: !activeStageId ? "#fff" : isDark ? "#F0ECE6" : "#1a1510" }}
        >
          كل المراحل
        </span>
      </button>

      {stages.map((stage) => {
        const active = String(stage.id) === activeStageId;

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelect(active ? undefined : String(stage.id))}
            className="group flex shrink-0 items-center gap-2 rounded-full px-4 py-2 transition-all duration-300"
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
            <span
              className="text-xs font-bold"
              style={{ color: active ? "#fff" : isDark ? "#F0ECE6" : "#1a1510" }}
            >
              {stage.name}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
