"use client";

import { useCallback } from "react";
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  usePublishSection,
  useUnpublishSection,
  useArchiveSection,
  useRestoreSection,
  useDuplicateSection,
  useReorderSections,
  useToggleLockSection,
  useMoveSection,
} from "@/features/course-sections/hooks";
import type {
  CreateCourseSectionPayload,
  UpdateCourseSectionPayload,
} from "@/features/course-sections/types";

export function useSectionsList(courseId: string | null) {
  return useSections(courseId);
}

export function useCreateSectionAction() {
  const mutation = useCreateSection();
  return {
    ...mutation,
    create: useCallback(
      async (courseId: string, data: CreateCourseSectionPayload) => {
        return mutation.mutateAsync({ courseId, data });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useUpdateSectionAction() {
  const mutation = useUpdateSection();
  return {
    ...mutation,
    update: useCallback(
      async (courseId: string, id: string, data: UpdateCourseSectionPayload) => {
        return mutation.mutateAsync({ courseId, id, data });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useDeleteSectionAction() {
  const mutation = useDeleteSection();
  return {
    ...mutation,
    remove: useCallback(
      async (courseId: string, id: string) => {
        return mutation.mutateAsync({ courseId, id });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function usePublishSectionAction() {
  const mutation = usePublishSection();
  return {
    ...mutation,
    publish: useCallback(
      async (courseId: string, id: string) => {
        return mutation.mutateAsync({ courseId, id });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useArchiveSectionAction() {
  const mutation = useArchiveSection();
  return {
    ...mutation,
    archive: useCallback(
      async (courseId: string, id: string) => {
        return mutation.mutateAsync({ courseId, id });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useRestoreSectionAction() {
  const mutation = useRestoreSection();
  return {
    ...mutation,
    restore: useCallback(
      async (courseId: string, id: string) => {
        return mutation.mutateAsync({ courseId, id });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useDuplicateSectionAction() {
  const mutation = useDuplicateSection();
  return {
    ...mutation,
    duplicate: useCallback(
      async (courseId: string, id: string) => {
        return mutation.mutateAsync({ courseId, id });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useReorderSectionsAction() {
  const mutation = useReorderSections();
  return {
    ...mutation,
    reorder: useCallback(
      async (courseId: string, sections: Array<{ id: number; sort_order: number }>) => {
        return mutation.mutateAsync({ courseId, sections });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useToggleLockSectionAction() {
  const mutation = useToggleLockSection();
  return {
    ...mutation,
    toggleLock: useCallback(
      async (courseId: string, id: string) => {
        return mutation.mutateAsync({ courseId, id });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useMoveSectionAction() {
  const mutation = useMoveSection();
  return {
    ...mutation,
    move: useCallback(
      async (courseId: string, id: string, courseModuleId: string | null, sortOrder?: number) => {
        return mutation.mutateAsync({ courseId, id, courseModuleId, sortOrder });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useSelectAndScrollSection(
  selectSection: (id: string | null) => void,
) {
  const selectAndScroll = useCallback(
    (sectionId: string) => {
      selectSection(sectionId);
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (el) {
          (el as HTMLElement).focus();
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    },
    [selectSection],
  );

  return { selectAndScroll };
}
