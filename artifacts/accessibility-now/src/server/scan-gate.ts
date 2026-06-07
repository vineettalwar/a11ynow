import { getBindings } from "./cloudflare";

/** Thrown when the process is shutting down and new scans are rejected. */
export class ScanGateShutdownError extends Error {
  constructor() {
    super("Scan engine is shutting down; new scans are not accepted.");
    this.name = "ScanGateShutdownError";
  }
}

type QueueEntry = {
  resolve: () => void;
  reject: (err: Error) => void;
};

/** Process-wide limit on concurrent Playwright scan jobs (local dev fallback). */
class LocalScanGate {
  private active = 0;
  private shuttingDown = false;
  private readonly queue: QueueEntry[] = [];

  constructor(private readonly maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.shuttingDown) {
      throw new ScanGateShutdownError();
    }
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  release(): void {
    this.active = Math.max(0, this.active - 1);
    if (this.shuttingDown) return;
    const next = this.queue.shift();
    if (next) {
      this.active++;
      next.resolve();
    }
  }

  beginShutdown(): void {
    this.shuttingDown = true;
    while (this.queue.length > 0) {
      this.queue.shift()?.reject(new ScanGateShutdownError());
    }
  }

  isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  getActiveCount(): number {
    return this.active;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async waitForDrain(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (this.active > 0) {
      if (Date.now() >= deadline) return false;
      await new Promise<void>((r) => setTimeout(r, 200));
    }
    return true;
  }
}

export function getScanMaxConcurrent(): number {
  const raw = process.env.SCAN_MAX_CONCURRENT;
  if (raw !== undefined && raw !== "") {
    const n = Number.parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 1) return Math.min(n, 4);
  }
  return 2;
}

const localGate = new LocalScanGate(getScanMaxConcurrent());

async function doFetch(
  stub: DurableObjectStub,
  action: string,
  init?: RequestInit,
): Promise<Response> {
  return stub.fetch(`https://scan-gate/${action}`, init);
}

async function acquireRemote(stub: DurableObjectStub): Promise<void> {
  const res = await doFetch(stub, "acquire", { method: "POST" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (body.error?.includes("shutting down")) {
      throw new ScanGateShutdownError();
    }
    throw new Error(body.error ?? "Failed to acquire scan slot");
  }
}

function getScanGateStub(): DurableObjectStub | null {
  const ns = getBindings().SCAN_GATE;
  if (!ns) return null;
  return ns.get(ns.idFromName("global"));
}

/** Run a scan job while holding a concurrency slot (FIFO when at capacity). */
export async function withScanSlot<T>(fn: () => Promise<T>): Promise<T> {
  const stub = getScanGateStub();
  if (stub) {
    await acquireRemote(stub);
    try {
      return await fn();
    } finally {
      await doFetch(stub, "release", { method: "POST" });
    }
  }

  await localGate.acquire();
  try {
    return await fn();
  } finally {
    localGate.release();
  }
}

export function getScanGateStats(): {
  active: number;
  queued: number;
  maxConcurrent: number;
  shuttingDown: boolean;
} {
  return {
    active: localGate.getActiveCount(),
    queued: localGate.getQueueLength(),
    maxConcurrent: getScanMaxConcurrent(),
    shuttingDown: localGate.isShuttingDown(),
  };
}

export async function getScanGateStatsAsync(): Promise<{
  active: number;
  queued: number;
  maxConcurrent: number;
  shuttingDown: boolean;
}> {
  const stub = getScanGateStub();
  if (stub) {
    const res = await doFetch(stub, "stats");
    if (res.ok) {
      return (await res.json()) as {
        active: number;
        queued: number;
        maxConcurrent: number;
        shuttingDown: boolean;
      };
    }
  }
  return getScanGateStats();
}

export function beginScanGateShutdown(): void {
  localGate.beginShutdown();
  const stub = getScanGateStub();
  if (stub) {
    void doFetch(stub, "shutdown", { method: "POST" });
  }
}

export async function waitForScanDrain(timeoutMs: number): Promise<boolean> {
  return localGate.waitForDrain(timeoutMs);
}

export { LocalScanGate as ScanGate, localGate as scanGateSingleton };
