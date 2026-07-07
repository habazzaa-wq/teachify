"use client";

/**
 * AssetSelector — Inline asset selector component for Course Builder.
 *
 * Renders a simplified grid/toolbar for selecting pre-existing media assets.
 * Unlike MediaPicker (which is a dialog), AssetSelector is an inline component
 * that can be embedded directly into Course Builder lesson/content forms.
 *
 * Usage (future):
 *   <AssetSelector
 *     allowedTypes={["video", "image"]}
 *     onSelect={(asset) => setSelectedAsset(asset)}
 *     selectedId={currentAssetId}
 *   />
 */

import { useState, useCallback } from "react";
import { useMediaAssets } from "../hooks";
import { MediaGrid } from "./MediaGrid";
import { MediaEmptyState } from "./MediaEmptyState";
import { MediaLoadingState } from "./MediaLoadingState";
import type { MediaAsset, MediaType } from "../types";

interface AssetSelectorProps {
  allowedTypes?: MediaType[];
  onSelect: (asset: MediaAsset) => void;
  selectedId?: number | null;
  maxHeight?: string;
}

function AssetSelector({
  allowedTypes,
  onSelect,
  selectedId,
  maxHeight = "300px",
}: AssetSelectorProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useMediaAssets({
    search: search || undefined,
    types: allowedTypes,
    per_page: 20,
  });

  const assets = data?.data ?? [];

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث في الوسائط..."
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
      />

      <div className="overflow-y-auto" style={{ maxHeight }}>
        {isLoading ? (
          <MediaLoadingState />
        ) : assets.length === 0 ? (
          <MediaEmptyState />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                className={`relative overflow-hidden rounded-lg border text-start transition-all hover:shadow-md ${
                  selectedId === asset.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => onSelect(asset)}
              >
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.title ?? ""}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted">
                    <span className="text-sm text-muted-foreground">
                      {asset.type}
                    </span>
                  </div>
                )}
                <div className="p-1.5">
                  <p className="truncate text-xs font-medium">
                    {asset.title ?? asset.originalName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {asset.extension?.toUpperCase()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { AssetSelector };
