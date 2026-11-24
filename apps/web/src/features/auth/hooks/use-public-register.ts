import { useMutation } from "@tanstack/react-query";
import { publicRegisterService, type PublicRegisterPayload, type PublicRegisterResponse, type PublicRegisterResult } from "../services/public-register.service";

export { type PublicRegisterPayload, type PublicRegisterResponse, type PublicRegisterResult };

export function usePublicRegister() {
  return useMutation({
    mutationFn: (payload: PublicRegisterPayload) =>
      publicRegisterService.register(payload),
  });
}
