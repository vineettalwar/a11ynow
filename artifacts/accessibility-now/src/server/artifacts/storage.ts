import { createHash } from "crypto";
import { getBindings, type CloudflareBindings } from "../cloudflare";
import type { AuditViolationStored } from "@workspace/db";
import type { QueueMessage } from "../jobs/types";
import { scheduleBackgroundWork } from "../schedule-background-work";
import { processQueueMessage } from "../jobs/process-queue-message";

export const R2_ARTIFACT_PREFIX = "r2:";

export function isR2ArtifactRef(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(R2_ARTIFACT_PREFIX);
}

export type ViolationsArtifactScope =
  | { kind: "audit"; id: string }
  | { kind: "monitor"; id: string };

export function violationsArtifactKey(scope: ViolationsArtifactScope): string {
  return scope.kind === "audit"
    ? `audits/${scope.id}/violations.json`
    : `monitor-scans/${scope.id}/violations.json`;
}

function elementScreenshotKey(scope: ViolationsArtifactScope, selectorHash: string): string {
  return scope.kind === "audit"
    ? r2ArtifactKey(scope.id, "element", selectorHash)
    : `monitor-scans/${scope.id}/elements/${selectorHash}.jpg`;
}

function selectorArtifactHash(selector: string, index: number): string {
  return createHash("sha256").update(`${selector}\0${index}`).digest("hex").slice(0, 16);
}

export interface PersistedViolations {
  violations: AuditViolationStored[];
  violationsRef: string | null;
}

export function r2ArtifactKey(auditId: string, kind: "page" | "element", selectorHash?: string): string {
  if (kind === "page") return `audits/${auditId}/page.jpg`;
  return `audits/${auditId}/elements/${selectorHash ?? "unknown"}.jpg`;
}

export interface ArtifactStorage {
  put(key: string, data: ArrayBuffer | Uint8Array | string, contentType: string): Promise<void>;
  get(key: string): Promise<ArrayBuffer | null>;
}

class InlineArtifactStorage implements ArtifactStorage {
  private readonly cache = new Map<string, string>();

  async put(key: string, data: ArrayBuffer | Uint8Array | string, contentType: string): Promise<void> {
    if (typeof data === "string") {
      this.cache.set(key, data);
      return;
    }
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const base64 = Buffer.from(bytes).toString("base64");
    this.cache.set(key, `data:${contentType};base64,${base64}`);
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (hit.startsWith("data:")) {
      const comma = hit.indexOf(",");
      if (comma === -1) return null;
      const b = Buffer.from(hit.slice(comma + 1), "base64");
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    }
    const b = Buffer.from(hit, "utf8");
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  }
}

class R2ArtifactStorage implements ArtifactStorage {
  constructor(private readonly bucket: R2Bucket) {}

  async put(key: string, data: ArrayBuffer | Uint8Array | string, contentType: string): Promise<void> {
    await this.bucket.put(key, data, { httpMetadata: { contentType } });
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return obj.arrayBuffer();
  }
}

let inlineStorage: InlineArtifactStorage | undefined;

export function getArtifactStorage(bindings: CloudflareBindings = getBindings()): ArtifactStorage {
  if (bindings.ARTIFACTS) {
    return new R2ArtifactStorage(bindings.ARTIFACTS);
  }
  inlineStorage ??= new InlineArtifactStorage();
  return inlineStorage;
}

/** Store a JPEG screenshot; returns an R2 ref or inline data URL. */
export async function storePageScreenshot(
  auditId: string,
  base64OrDataUrl: string,
): Promise<string> {
  const bindings = getBindings();
  const storage = getArtifactStorage(bindings);

  const raw = base64OrDataUrl.startsWith("data:")
    ? base64OrDataUrl.slice(base64OrDataUrl.indexOf(",") + 1)
    : base64OrDataUrl;
  const bytes = Buffer.from(raw, "base64");

  if (bindings.ARTIFACTS) {
    const key = r2ArtifactKey(auditId, "page");
    await storage.put(key, bytes, "image/jpeg");
    return `${R2_ARTIFACT_PREFIX}${key}`;
  }

  return base64OrDataUrl.startsWith("data:")
    ? base64OrDataUrl
    : `data:image/jpeg;base64,${base64OrDataUrl}`;
}

/** Resolve stored screenshot ref to a client-renderable data URL. */
export async function resolvePageScreenshot(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null;
  if (!isR2ArtifactRef(ref)) return ref;

  const key = ref.slice(R2_ARTIFACT_PREFIX.length);
  const storage = getArtifactStorage();
  const buf = await storage.get(key);
  if (!buf) return null;
  return `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;
}

async function storeJpegArtifact(
  key: string,
  base64OrDataUrl: string,
  bindings: CloudflareBindings,
): Promise<string> {
  const storage = getArtifactStorage(bindings);
  const raw = base64OrDataUrl.startsWith("data:")
    ? base64OrDataUrl.slice(base64OrDataUrl.indexOf(",") + 1)
    : base64OrDataUrl;
  const bytes = Buffer.from(raw, "base64");

  if (bindings.ARTIFACTS) {
    await storage.put(key, bytes, "image/jpeg");
    return `${R2_ARTIFACT_PREFIX}${key}`;
  }

  return base64OrDataUrl.startsWith("data:")
    ? base64OrDataUrl
    : `data:image/jpeg;base64,${base64OrDataUrl}`;
}

async function offloadElementScreenshots(
  scope: ViolationsArtifactScope,
  violations: AuditViolationStored[],
  bindings: CloudflareBindings,
): Promise<AuditViolationStored[]> {
  if (!bindings.ARTIFACTS) return violations;

  const out = JSON.parse(JSON.stringify(violations)) as AuditViolationStored[];
  for (const violation of out) {
    const details = violation.instanceDetails;
    if (!details?.length) continue;
    for (let i = 0; i < details.length; i++) {
      const inst = details[i]!;
      const shot = inst.elementScreenshot?.trim();
      if (!shot || isR2ArtifactRef(shot)) continue;
      const hash = selectorArtifactHash(inst.selector, i);
      inst.elementScreenshot = await storeJpegArtifact(
        elementScreenshotKey(scope, hash),
        shot,
        bindings,
      );
    }
  }
  return out;
}

/** Persist violations: inline in DB locally, JSON (+ element JPEG refs) in R2 on Cloudflare. */
export async function persistViolationsArtifact(
  scope: ViolationsArtifactScope,
  violations: AuditViolationStored[],
): Promise<PersistedViolations> {
  const bindings = getBindings();
  if (!bindings.ARTIFACTS) {
    return { violations, violationsRef: null };
  }

  const prepared = await offloadElementScreenshots(scope, violations, bindings);
  const key = violationsArtifactKey(scope);
  await getArtifactStorage(bindings).put(key, JSON.stringify(prepared), "application/json");
  return { violations: [], violationsRef: `${R2_ARTIFACT_PREFIX}${key}` };
}

async function resolveViolationsElementScreenshots(
  violations: AuditViolationStored[],
): Promise<AuditViolationStored[]> {
  return Promise.all(
    violations.map(async (violation) => {
      const details = violation.instanceDetails;
      if (!details?.length) return violation;
      const instanceDetails = await Promise.all(
        details.map(async (inst) => {
          const shot = inst.elementScreenshot?.trim();
          if (!shot || !isR2ArtifactRef(shot)) return inst;
          const resolved = await resolvePageScreenshot(shot);
          return resolved ? { ...inst, elementScreenshot: resolved } : inst;
        }),
      );
      return { ...violation, instanceDetails };
    }),
  );
}

/** Load violations from inline DB JSON and/or an R2 artifact ref. */
export async function resolveStoredViolations(
  inline: AuditViolationStored[],
  ref: string | null | undefined,
): Promise<AuditViolationStored[]> {
  let loaded: AuditViolationStored[];
  if (ref && isR2ArtifactRef(ref)) {
    const key = ref.slice(R2_ARTIFACT_PREFIX.length);
    const buf = await getArtifactStorage().get(key);
    if (!buf) {
      loaded = inline;
    } else {
      loaded = JSON.parse(Buffer.from(buf).toString("utf8")) as AuditViolationStored[];
    }
  } else {
    loaded = inline;
  }
  return resolveViolationsElementScreenshots(loaded);
}

export async function enqueueJob(message: QueueMessage): Promise<void> {
  const bindings = getBindings();
  if (bindings.SCAN_QUEUE) {
    await bindings.SCAN_QUEUE.send(message);
    return;
  }

  scheduleBackgroundWork(() => processQueueMessage(message));
}
