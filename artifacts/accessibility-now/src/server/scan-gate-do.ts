/// <reference types="@cloudflare/workers-types" />
import { DurableObject } from "cloudflare:workers";

type QueueEntry = {
  resolve: () => void;
  reject: (err: Error) => void;
};

export class ScanGateShutdownError extends Error {
  constructor() {
    super("Scan engine is shutting down; new scans are not accepted.");
    this.name = "ScanGateShutdownError";
  }
}

export class ScanGateDO extends DurableObject {
  private active = 0;
  private shuttingDown = false;
  private readonly queue: QueueEntry[] = [];
  private maxConcurrent = 2;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    const raw = env.SCAN_MAX_CONCURRENT;
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n) && n >= 1) this.maxConcurrent = Math.min(n, 4);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.pathname.replace(/^\//, "");

    if (action === "acquire") {
      try {
        await this.acquire();
        return Response.json({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ ok: false, error: message }, { status: 503 });
      }
    }

    if (action === "release") {
      this.release();
      return Response.json({ ok: true });
    }

    if (action === "stats") {
      return Response.json({
        active: this.active,
        queued: this.queue.length,
        maxConcurrent: this.maxConcurrent,
        shuttingDown: this.shuttingDown,
      });
    }

    if (action === "shutdown") {
      this.beginShutdown();
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }

  private async acquire(): Promise<void> {
    if (this.shuttingDown) throw new ScanGateShutdownError();
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    if (this.shuttingDown) return;
    const next = this.queue.shift();
    if (next) {
      this.active++;
      next.resolve();
    }
  }

  private beginShutdown(): void {
    this.shuttingDown = true;
    while (this.queue.length > 0) {
      this.queue.shift()?.reject(new ScanGateShutdownError());
    }
  }
}

interface Env {
  SCAN_MAX_CONCURRENT?: string;
}
