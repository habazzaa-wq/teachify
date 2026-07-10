"use client";

import { useState, useRef, useCallback, memo } from "react";
import { AnimatePresence } from "framer-motion";
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
  onPin?: (asset: MediaAsset) => void;
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
  onPin,
  onDelete,
  selectable = true,
}: MediaGridProps) {
  const [internalSelected, setInternalSelected] = useState<Set<number>>(new Set());
  const selectedIds = externalSelectedIds ?? internalSelected;
  const lastIndexRef = useRef<number | null>(null);

  const commit = useCallback(
    (next: Set<number>) => {
      if (onSelectionChange) onSelectionChange(next);
      else setInternalSelected(next);
    },
    [onSelectionChange],
  );

  const handleSelect = useCallback(
    (id: number, index: number, modifiers: { shift: boolean; ctrl: boolean }) => {
      const current = new Set(selectedIds);

      if (modifiers.shift && lastIndexRef.current !== null) {
        const anchor = lastIndexRef.current;
        const lo = Math.min(anchor, index);
        const hi = Math.max(anchor, index);
        for (let i = lo; i <= hi; i++) {
          const asset = assets[i];
          if (asset) current.add(asset.id);
        }
      } else if (modifiers.ctrl) {
        if (current.has(id)) current.delete(id);
        else current.add(id);
      } else {
        if (current.has(id) && current.size === 1) current.delete(id);
        else {
          current.clear();
          current.add(id);
        }
      }

      lastIndexRef.current = index;
      commit(current);
    },
    [assets, selectedIds, commit],
  );

  const handleAssetClick = useCallback(
    (asset: MediaAsset) => onAssetClick?.(asset),
    [onAssetClick],
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      <AnimatePresence mode="popLayout">
        {assets.map((asset, index) => (
          <MediaCard
            key={asset.id}
            asset={asset}
            selected={selectedIds.has(asset.id)}
            onSelect={
              selectable
                ? (id, _selected, e) =>
                    handleSelect(
                      id,
                      index,
                      { shift: !!e?.shiftKey, ctrl: !!e?.ctrlKey || !!e?.metaKey },
                    )
                : undefined
            }
            onClick={handleAssetClick}
            onFavorite={onFavorite}
            onRename={onRename}
            onMove={onMove}
            onDuplicate={onDuplicate}
            onDownload={onDownload}
            onArchive={onArchive}
            onPin={onPin}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export const MediaGridComponent = memo(MediaGrid);
export { MediaGrid };
export default MediaGridComponent;
