"use client";

import { useCallback } from "react";
import {
  useModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  usePublishModule,
  useArchiveModule,
  useRestoreModule,
  useDuplicateModule,
  useReorderModules,
} from "@/features/course-modules/hooks";
import type {
  CreateCourseModulePayload,
  UpdateCourseModulePayload,
  ModuleFilterParams,
} from "@/features/course-modules/types";

export function useLectures(courseId: string | null, params?: ModuleFilterParams) {
  return useModules(courseId, params);
}

export function useCreateLecture() {
  const mutation = useCreateModule();
  return {
    ...mutation,
    create: useCallback(
      async (courseId: string, data: CreateCourseModulePayload) => {
        return mutation.mutateAsync({ courseId, data });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useUpdateLecture() {
  const mutation = useUpdateModule();
  return {
    ...mutation,
    update: useCallback(
      async (courseId: string, id: string, data: UpdateCourseModulePayload) => {
        return mutation.mutateAsync({ courseId, id, data });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useDeleteLecture() {
  const mutation = useDeleteModule();
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

export function usePublishLecture() {
  const mutation = usePublishModule();
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

export function useArchiveLecture() {
  const mutation = useArchiveModule();
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

export function useRestoreLecture() {
  const mutation = useRestoreModule();
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

export function useDuplicateLecture() {
  const mutation = useDuplicateModule();
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

export function useReorderLectures() {
  const mutation = useReorderModules();
  return {
    ...mutation,
    reorder: useCallback(
      async (courseId: string, modules: Array<{ id: number; order: number }>) => {
        return mutation.mutateAsync({ courseId, modules });
      },
      [mutation.mutateAsync],
    ),
  };
}

export function useSelectAndScroll(
  selectLecture: (id: string | null) => void,
) {
  const selectAndScroll = useCallback(
    (lectureId: string) => {
      selectLecture(lectureId);
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-lecture-id="${lectureId}"]`);
        if (el) {
          (el as HTMLElement).focus();
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    },
    [selectLecture],
  );

  return { selectAndScroll };
}
