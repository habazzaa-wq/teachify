"use client";

import { memo, useState, useCallback } from "react";
import { FolderOpen, FolderClosed, Star } from "lucide-react";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
} from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";
import { CATEGORY_STATUS_CONFIG, SORT_OPTIONS, DEFAULT_ICONS } from "../constants";
import { CategoryRowActions } from "./CategoryRowActions";
import type { Category, CategoryStatus, CategorySort } from "../types";

interface CategoriesTableProps {
  categories: Category[];
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onToggleFeature: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onDuplicate: (category: Category) => void;
  onDelete: (category: Category) => void;
  onRestore: (category: Category) => void;
  onForceDelete: (category: Category) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
}

const CategoriesTableRow = memo(function CategoriesTableRow({
  category,
  onView,
  onEdit,
  onToggleFeature,
  onToggleActive,
  onDuplicate,
  onDelete,
  onRestore,
  onForceDelete,
  expanded,
  onToggleExpand,
}: {
  category: Category;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onToggleFeature: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onDuplicate: (category: Category) => void;
  onDelete: (category: Category) => void;
  onRestore: (category: Category) => void;
  onForceDelete: (category: Category) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const statusConfig = CATEGORY_STATUS_CONFIG[category.active ? "active" : "inactive"];
  const hasChildren = category.children && category.children.length > 0;

  const handleRowClick = useCallback(() => {
    if (hasChildren && onToggleExpand) {
      onToggleExpand();
    } else {
      onEdit(category);
    }
  }, [hasChildren, onToggleExpand, onEdit, category]);

  return (
    <>
      <AppTableRow className="group cursor-pointer" onClick={handleRowClick}>
        <AppTableCell>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
              {category.thumbnail ? (
                <img src={category.thumbnail} alt={category.name} className="h-full w-full object-cover" />
              ) : category.icon ? (
                <span className="text-2xl">{category.icon}</span>
              ) : (
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {category.parentId && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    فرعي
                  </span>
                )}
                <p className="text-sm font-medium truncate">{category.name}</p>
                {category.featured && (
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{category.slug}</p>
            </div>
          </div>
        </AppTableCell>
        <AppTableCell>
          <span className="text-xs text-muted-foreground">{category.parent?.name ?? "—"}</span>
        </AppTableCell>
        <AppTableCell className="tabular-nums text-sm">
          {formatNumber(category.coursesCount)}
        </AppTableCell>
        <AppTableCell>
          <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive" | "warning" | "default"} className="text-[10px] gap-1">
            <span className={`bg-${statusConfig.color === "success" ? "success" : "muted-foreground"}`} style={{ height: 6, width: 6, borderRadius: "50%", display: "inline-block" }} />
            {statusConfig.label}
          </AppBadge>
        </AppTableCell>
        <AppTableCell>
          <span className="text-xs text-muted-foreground">{category.featured ? "نعم" : "لا"}</span>
        </AppTableCell>
        <AppTableCell className="text-xs text-muted-foreground tabular-nums">
          {category.sortOrder}
        </AppTableCell>
        <AppTableCell className="text-xs text-muted-foreground tabular-nums">
          {category.createdAt ? formatDate(category.createdAt) : "—"}
        </AppTableCell>
        <AppTableCell onClick={(e) => e.stopPropagation()}>
          <CategoryRowActions
            category={category}
            onView={() => onView(category)}
            onEdit={() => onEdit(category)}
            onToggleFeature={() => onToggleFeature(category)}
            onToggleActive={() => onToggleActive(category)}
            onDuplicate={() => onDuplicate(category)}
            onDelete={() => onDelete(category)}
            onRestore={() => onRestore(category)}
            onForceDelete={() => onForceDelete(category)}
          />
        </AppTableCell>
      </AppTableRow>
      {expanded && category.children && category.children.length > 0 && (
        <AppTableRow className="bg-muted/30">
          <AppTableCell colSpan={9} className="p-0">
            <div className="ml-4 border-r-2 border-muted pl-4 space-y-2 py-2">
              {category.children.map((child) => (
                <div key={child.id} className="flex items-center gap-3 py-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <FolderClosed className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{child.name}</p>
                    <p className="text-xs text-muted-foreground">{child.slug} • {formatNumber(child.coursesCount)} دورات</p>
                  </div>
                  <AppBadge variant="outline" className="text-[10px]">
                    {formatNumber(child.coursesCount)} دورات
                  </AppBadge>
                </div>
              ))}
            </div>
          </AppTableCell>
        </AppTableRow>
      )}
    </>
  );
});

function CategoriesTable(props: CategoriesTableProps) {
  const { categories, expandedIds, onToggleExpand, ...actions } = props;
  const [localExpandedIds, setLocalExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((id: string) => {
    if (onToggleExpand) {
      onToggleExpand(id);
    } else {
      setLocalExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  }, [onToggleExpand]);

  const effectiveExpandedIds = expandedIds ?? localExpandedIds;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
      <AppTable>
        <AppTableHeader className="sticky top-0 z-10">
          <AppTableRow>
            <AppTableHead>التصنيف</AppTableHead>
            <AppTableHead>التصنيف الأب</AppTableHead>
            <AppTableHead>الدورات</AppTableHead>
            <AppTableHead>الحالة</AppTableHead>
            <AppTableHead>مميز</AppTableHead>
            <AppTableHead>الترتيب</AppTableHead>
            <AppTableHead>تاريخ الإنشاء</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {categories.map((category) => (
            <CategoriesTableRow
              key={category.id}
              category={category}
              expanded={effectiveExpandedIds.has(category.id)}
              onToggleExpand={() => handleToggleExpand(category.id)}
              {...actions}
            />
          ))}
        </AppTableBody>
      </AppTable>
      </div>
    </div>
  );
}

export { CategoriesTable };