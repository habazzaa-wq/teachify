"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { authKeys } from "@/services/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiError } from "@/types/common.types";
import type { LoginRequest } from "@/types/auth.types";

export function useTenantLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      router.replace("/teacher/dashboard");
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}
