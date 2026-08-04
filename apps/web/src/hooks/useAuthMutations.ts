"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { authKeys } from "@/services/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { ApiError } from "@/types/common.types";
import type { LoginRequest } from "@/types/auth.types";
import { routes } from "@/constants/routes";
import { useTenantStore } from "@/stores/tenant.store";

/**
 * Login mutation. Wires CSRF → /auth/login → /me resolution via the AuthProvider.
 * On success it redirects to the dashboard and invalidates the session cache.
 * Students land on their own dashboard; every other role keeps the teacher panel.
 */
export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      const roles = useTenantStore.getState().roles;
      const isStudent = roles.some((role) => role.slug === "student");
      router.replace(isStudent ? routes.studentDashboard : routes.dashboard);
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}

/**
 * Logout mutation. Tears down the session and redirects to /login.
 */
export function useLogout() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: () => logout(),
  });
}
