"use client";

import { MediaWorkspace } from "@/features/media-library/components/workspace";

export default function InstructorMediaPage() {
  return (
    <div className="-mx-4 -my-6 h-[calc(100dvh-6rem)] w-full p-2 md:-mx-6 md:-my-6 lg:-mx-8 sm:p-3">
      <MediaWorkspace />
    </div>
  );
}
