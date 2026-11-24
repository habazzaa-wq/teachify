import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { env, resolveApiUrl } from "@/config/env";
import { isInstructorWorkspace } from "@/features/instructors/workspace";
import { useInstructorAuthStore } from "@/features/instructors/store";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";

type CommunityEcho = Echo<"pusher">;

declare global {
  interface Window {
    Echo?: CommunityEcho;
    Pusher?: typeof Pusher;
  }
}

let echoInstance: CommunityEcho | null = null;
let echoAuthKey: string | null = null;

/**
 * Names for the Reverb channels the backend broadcasts on.
 * (See apps/api/routes/channels.php.)
 */
export const communityChannelName = (tenantId: string, channelId: string) =>
  `community.tenant.${tenantId}.channel.${channelId}`;

export const communityThreadChannelName = (tenantId: string, threadId: string) =>
  `community.tenant.${tenantId}.thread.${threadId}`;

export const communityTenantChannelName = (tenantId: string) =>
  `community.tenant.${tenantId}`;

export const communityPresenceChannelName = (tenantId: string) =>
  `presence-community.tenant.${tenantId}`;

/** Per-member private inbox channel (see apps/api/routes/channels.php). */
export const notificationChannelName = (tenantId: string, membershipId: string) =>
  `notifications.tenant.${tenantId}.user.${membershipId}`;

export function echoAvailable(): boolean {
  return typeof window !== "undefined";
}

/** Lazily build the shared Echo (Reverb over Pusher protocol) client. */
export function getCommunityEcho(): CommunityEcho | null {
  if (typeof window === "undefined") return null;

  const instructor = isInstructorWorkspace();
  const instructorAuth = useInstructorAuthStore.getState();
  const accessToken = instructor
    ? instructorAuth.accessToken
    : useAuthStore.getState().accessToken;
  const tenantId = instructor
    ? instructorAuth.membership?.tenant_id?.toString() ?? null
    : useTenantStore.getState().activeTenant?.id?.toString() ?? null;
  const tenantDomain = instructor ? null : useTenantStore.getState().domain ?? null;
  const authKey = `${instructor ? "instructor" : "tenant"}:${accessToken ?? ""}:${tenantId ?? ""}`;

  if (echoInstance && echoAuthKey === authKey) return echoInstance;
  if (echoInstance && echoAuthKey !== authKey) {
    try {
      echoInstance.disconnect();
    } catch {
      // ignore
    }
    echoInstance = null;
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (tenantId) headers["X-Tenant-ID"] = tenantId;
  else if (tenantDomain) headers["X-Tenant-Domain"] = tenantDomain;

  const instance = new Echo({
    broadcaster: "pusher",
    key: env.reverbAppKey,
    cluster: env.reverbCluster,
    wsHost: env.reverbHost,
    wsPort: env.reverbPort,
    wssPort: env.reverbPort,
    wsPath: "",
    forceTLS: env.reverbScheme === "https",
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${resolveApiUrl()}/broadcasting/auth`,
    auth: {
      headers,
    },
  });

  // Expose for debugging (Reverb behaves like Pusher).
  window.Echo = instance;
  window.Pusher = Pusher;

  echoInstance = instance;
  echoAuthKey = authKey;
  return instance;
}

/** Drop the shared client (used on logout / tenant switch). */
export function destroyCommunityEcho(): void {
  try {
    echoInstance?.disconnect();
  } catch {
    // ignore
  }
  echoInstance = null;
  echoAuthKey = null;
  if (typeof window !== "undefined") {
    window.Echo = undefined;
  }
}
