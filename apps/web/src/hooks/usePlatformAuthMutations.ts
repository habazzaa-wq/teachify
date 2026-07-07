"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePlatformAuth } from "@/providers/PlatformAuthProvider";
import { routes } from "@/constants/routes";
import type { PlatformLoginRequest } from "@/types/platform-auth.types";
import type { ApiError } from "@/types/common.types";

export function usePlatformLogin() {
  const { login } = usePlatformAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: PlatformLoginRequest) => login(credentials),
    onSuccess: () => {
      router.replace(routes.superadminDashboard);
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}

export function usePlatformLogout() {
  const { logout } = usePlatformAuth();

  return useMutation({
    mutationFn: () => logout(),
  });
}
