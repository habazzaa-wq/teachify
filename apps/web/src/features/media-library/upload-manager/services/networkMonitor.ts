import { CHUNK_PARALLEL_BY_QUALITY, CHUNK_PARALLEL_DEFAULT } from "../constants";
import type { ConnectionQuality, NetworkStatus } from "../types";

/**
 * Shape of the (non-standard) Network Information API we read defensively.
 */
interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
};

type Listener = (status: NetworkStatus) => void;

function getConnection(): NetworkInformationLike | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as NavigatorWithConnection;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

/** Map effectiveType + measured throughput to a coarse quality bucket. */
function deriveQuality(
  online: boolean,
  effectiveType: string | null,
  sampledSpeed: number | null,
): ConnectionQuality {
  if (!online) return "offline";

  // Prefer measured upload throughput when we have a recent sample.
  if (sampledSpeed !== null) {
    if (sampledSpeed >= 2_000_000) return "excellent";
    if (sampledSpeed >= 750_000) return "good";
    if (sampledSpeed >= 150_000) return "moderate";
    return "poor";
  }

  switch (effectiveType) {
    case "4g":
      return "good";
    case "3g":
      return "moderate";
    case "2g":
    case "slow-2g":
      return "poor";
    default:
      return "unknown";
  }
}

function concurrencyFor(quality: ConnectionQuality): number {
  return CHUNK_PARALLEL_BY_QUALITY[quality] ?? CHUNK_PARALLEL_DEFAULT;
}

class NetworkMonitor {
  private listeners = new Set<Listener>();
  private status: NetworkStatus = {
    online: true,
    quality: "unknown",
    effectiveType: null,
    downlink: null,
    rtt: null,
    sampledSpeed: null,
    concurrency: CHUNK_PARALLEL_DEFAULT,
  };
  private started = false;
  private connection: NetworkInformationLike | null = null;
  private sampledSpeed: number | null = null;

  private onlineHandler = () => this.recompute();
  private offlineHandler = () => this.recompute();
  private changeHandler = () => this.recompute();

  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;

    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);

    this.connection = getConnection();
    this.connection?.addEventListener?.("change", this.changeHandler);

    this.recompute();
  }

  stop(): void {
    if (!this.started || typeof window === "undefined") return;
    this.started = false;
    window.removeEventListener("online", this.onlineHandler);
    window.removeEventListener("offline", this.offlineHandler);
    this.connection?.removeEventListener?.("change", this.changeHandler);
    this.connection = null;
  }

  getStatus(): NetworkStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status.online;
  }

  getConcurrency(): number {
    return this.status.concurrency;
  }

  subscribe(listener: Listener): () => void {
    this.start();
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Feed a measured upload throughput sample (bytes/sec) from the engine. */
  reportSpeed(bytesPerSecond: number): void {
    if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return;
    const prev = this.sampledSpeed;
    this.sampledSpeed = prev === null ? bytesPerSecond : prev * 0.7 + bytesPerSecond * 0.3;
    this.recompute();
  }

  private recompute(): void {
    const online = typeof navigator === "undefined" ? true : navigator.onLine;
    const conn = this.connection ?? getConnection();
    const effectiveType = conn?.effectiveType ?? null;
    const downlink = conn?.downlink ?? null;
    const rtt = conn?.rtt ?? null;
    const sampledSpeed = online ? this.sampledSpeed : null;
    const quality = deriveQuality(online, effectiveType, sampledSpeed);
    const concurrency = concurrencyFor(quality);

    const next: NetworkStatus = {
      online,
      quality,
      effectiveType,
      downlink,
      rtt,
      sampledSpeed,
      concurrency,
    };

    const changed =
      next.online !== this.status.online ||
      next.quality !== this.status.quality ||
      next.effectiveType !== this.status.effectiveType ||
      next.concurrency !== this.status.concurrency ||
      next.sampledSpeed !== this.status.sampledSpeed;

    this.status = next;
    if (changed) this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.status);
      } catch {
        // ignore listener errors
      }
    }
  }
}

export const networkMonitor = new NetworkMonitor();
