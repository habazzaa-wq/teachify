"use client";

import { useState } from "react";
import { ChevronDown, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioTreeNodeProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: StudioTreeNodeProps[];
  selected?: boolean;
  expanded?: boolean;
  onSelect?: (id: string) => void;
  onToggle?: (id: string) => void;
  depth?: number;
  className?: string;
}

function TreeNodeItem({
  id,
  label,
  icon,
  children,
  selected,
  expanded: controlledExpanded,
  onSelect,
  onToggle,
  depth = 0,
}: StudioTreeNodeProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = controlledExpanded ?? internalExpanded;
  const hasChildren = children && children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      if (onToggle) onToggle(id);
      else setInternalExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onSelect?.(id);
          handleToggle();
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring",
          selected
            ? "bg-studio-accent-soft text-studio-accent font-medium"
            : "text-studio-fg-muted hover:text-studio-fg hover:bg-studio-soft",
        )}
        style={{ paddingRight: depth * 16 + 12 }}
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </motion.div>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {icon || <File className="h-3.5 w-3.5 shrink-0 text-studio-fg-subtle" />}
        <span className="flex-1 text-right truncate">{label}</span>
      </button>
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            key={`children-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {children!.map((child) => (
              <TreeNodeItem
                key={child.id}
                {...child}
                depth={depth + 1}
                selected={selected}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StudioTreeNode(props: StudioTreeNodeProps) {
  return <TreeNodeItem {...props} />;
}
