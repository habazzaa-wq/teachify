"use client";

import { useEffect, useState } from "react";
import { networkMonitor } from "../services";
import type { NetworkStatus } from "../types";

/** Subscribes to the upload engine's live network monitor. */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => networkMonitor.getStatus());

  useEffect(() => {
    return networkMonitor.subscribe(setStatus);
  }, []);

  return status;
}
