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

/** Process-wide limit on concurrent Playwright scan jobs. */
class ScanGate {
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

  /** Visible for tests and health checks. */
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

const gate = new ScanGate(getScanMaxConcurrent());

/** Run a scan job while holding a concurrency slot (FIFO when at capacity). */
export async function withScanSlot<T>(fn: () => Promise<T>): Promise<T> {
  await gate.acquire();
  try {
    return await fn();
  } finally {
    gate.release();
  }
}

export function getScanGateStats(): {
  active: number;
  queued: number;
  maxConcurrent: number;
  shuttingDown: boolean;
} {
  return {
    active: gate.getActiveCount(),
    queued: gate.getQueueLength(),
    maxConcurrent: getScanMaxConcurrent(),
    shuttingDown: gate.isShuttingDown(),
  };
}

/** Stop accepting new scan slots; queued waiters are rejected. */
export function beginScanGateShutdown(): void {
  gate.beginShutdown();
}

/** Wait for in-flight scans to finish (does not include HTTP handlers outside the gate). */
export async function waitForScanDrain(timeoutMs: number): Promise<boolean> {
  return gate.waitForDrain(timeoutMs);
}

export { ScanGate, gate as scanGateSingleton };
