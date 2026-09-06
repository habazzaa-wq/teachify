"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentProfileService } from "../services";

export const studentProfileKeys = {
  all: ["student-profile"] as const,
  profile: () => [...studentProfileKeys.all, "profile"] as const,
};

export function useStudentProfile() {
  return useQuery({
    queryKey: studentProfileKeys.profile(),
    queryFn: studentProfileService.getProfile,
    staleTime: 5 * 60 * 1000,
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
