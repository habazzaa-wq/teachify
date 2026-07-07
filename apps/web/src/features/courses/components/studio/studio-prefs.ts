"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Local studio preferences (client-side, per device).
 *
 * Pinning is a UI preference until a backend pinning endpoint exists.
 * Extension point: when the API ships, replace `togglePinned` with the
 * corresponding React Query mutation and hydrate `pinnedCourseIds` from
 * the server — consumers only depend on this interface.
 */
interface StudioPrefsState {
  pinnedCourseIds: string[];
  togglePinned: (courseId: string) => void;
}

export const useStudioPrefs = create<StudioPrefsState>()(
  persist(
    (set) => ({
      pinnedCourseIds: [],
      togglePinned: (courseId) =>
        set((s) => ({
          pinnedCourseIds: s.pinnedCourseIds.includes(courseId)
            ? s.pinnedCourseIds.filter((id) => id !== courseId)
            : [courseId, ...s.pinnedCourseIds],
        })),
    }),
    {
      name: "course-studio-prefs",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
