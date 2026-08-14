"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { authKeys } from "@/services/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hasStaffAccess } from "@/lib/tenant-access";
import { useTenantStore } from "@/stores/tenant.store";
import { routes } from "@/constants/routes";
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
      const roles = useTenantStore.getState().roles;
      // Only staff (owner/admin/instructor) may enter the teacher control
      // panel. A student who signs in here lands on their own dashboard.
      router.replace(hasStaffAccess(roles) ? routes.dashboard : routes.studentDashboard);
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
}
