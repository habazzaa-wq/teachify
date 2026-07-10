"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  data?: Record<string, unknown>;
}

export interface StudioTreeNavigationProps {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect?: (node: TreeNode) => void;
  className?: string;
}

function TreeItem({
  node,
  depth = 0,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth?: number;
  selectedId?: string;
  onSelect?: (node: TreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect?.(node);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring",
          isSelected
            ? "bg-studio-accent-soft text-studio-accent font-medium"
            : "text-studio-fg-muted hover:text-studio-fg hover:bg-studio-soft",
        )}
        style={{ paddingRight: depth * 16 + 12 }}
      >
        {hasChildren ? (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              !expanded && "-rotate-90",
            )}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {node.icon && <span className="shrink-0">{node.icon}</span>}
        <span className="flex-1 text-right truncate">{node.label}</span>
      </button>
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children!.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StudioTreeNavigation({
  nodes,
  selectedId,
  onSelect,
  className,
}: StudioTreeNavigationProps) {
  return (
    <nav className={cn("space-y-0.5", className)}>
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}
