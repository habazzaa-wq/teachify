"use client";

import { MediaWorkspace } from "@/features/media-library/components/workspace";

function MediaPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full p-2">
      <MediaWorkspace />
    </div>
  );
}

export default MediaPage;
