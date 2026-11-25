"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentProfileService } from "../services";

export const studentProfileKeys = {
  all: ["student-profile"] as const,
  profile: () => [...studentProfileKeys.all, "profile"] as const,
};

export function useStudentProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: studentProfileKeys.profile(),
    queryFn: studentProfileService.getProfile,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled,
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentProfileService.updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(studentProfileKeys.profile(), profile);
      queryClient.invalidateQueries({ queryKey: studentProfileKeys.all });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentProfileService.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentProfileKeys.all });
    },
  });
}
