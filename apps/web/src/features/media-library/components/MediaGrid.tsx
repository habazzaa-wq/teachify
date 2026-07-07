"use client";

import { useState, useCallback } from "react";
import { MediaCard } from "./MediaCard";
import type { MediaAsset } from "../types";

interface MediaGridProps {
  assets: MediaAsset[];
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
  onAssetClick?: (asset: MediaAsset) => void;
  onFavorite?: (asset: MediaAsset) => void;
  onRename?: (asset: MediaAsset) => void;
  onMove?: (asset: MediaAsset) => void;
  onDuplicate?: (asset: MediaAsset) => void;
  onDownload?: (asset: MediaAsset) => void;
  onArchive?: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
  selectable?: boolean;
}

function MediaGrid({
  assets,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  onAssetClick,
  onFavorite,
  onRename,
  onMove,
  onDuplicate,
  onDownload,
  onArchive,
  onDelete,
  selectable = true,
}: MediaGridProps) {
  const [internalSelected, setInternalSelected] = useState<Set<number>>(new Set());
  const selectedIds = externalSelectedIds ?? internalSelected;

  const handleSelect = useCallback(
    (id: number, selected: boolean) => {
      const next = new Set(selectedIds);
      if (selected) next.add(id);
      else next.delete(id);

      if (onSelectionChange) {
        onSelectionChange(next);
      } else {
        setInternalSelected(next);
      }
    },
    [selectedIds, onSelectionChange],
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {assets.map((asset) => (
        <MediaCard
          key={asset.id}
          asset={asset}
          selected={selectedIds.has(asset.id)}
          onSelect={selectable ? handleSelect : undefined}
          onClick={onAssetClick}
          onFavorite={onFavorite}
          onRename={onRename}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onDownload={onDownload}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export { MediaGrid };
