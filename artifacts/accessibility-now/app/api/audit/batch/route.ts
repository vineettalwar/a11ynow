import { randomUUID } from "crypto";
import { enqueueJob } from "@/server/artifacts/storage";
import { jsonErr, jsonOk, readJson } from "@/server/http";
import { logger } from "@/server/logger";
import { createBatchJob } from "@/server/jobs/batch-job-store";
import { enforceRateLimit } from "@/server/rate-limit";
import { validateScanUrl } from "@/server/scan";

function parseBatchBody(
  body: unknown,
): { ok: true; urls: string[]; wholeSite?: boolean } | { ok: false; message: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const record = body as Record<string, unknown>;
  const wholeSite = record.wholeSite === true;

  if (wholeSite) {
    if (typeof record.url !== "string" || !record.url.trim()) {
      return {
        ok: false,
        message: "When wholeSite is true, provide a non-empty 'url' to discover pages from.",
      };
    }
    return { ok: true, urls: [record.url.trim()], wholeSite: true };
  }

  const { urls } = record;
  if (!Array.isArray(urls)) {
    return {
      ok: false,
      message: "'urls' must be an array of strings, or set wholeSite: true with a single url.",
    };
  }
  if (urls.length < 1) return { ok: false, message: "'urls' must contain at least 1 URL." };
  if (urls.length > 10) return { ok: false, message: "'urls' must contain at most 10 URLs." };
  for (let i = 0; i < urls.length; i++) {
    if (typeof urls[i] !== "string" || !urls[i].trim()) {
      return { ok: false, message: `URL at index ${i} must be a non-empty string.` };
    }
  }
  return { ok: true, urls: urls as string[] };
}

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, { namespace: "audit-batch", limit: 5 });
  if (limited) return limited;

  const body = await readJson(req);
  const parsed = parseBatchBody(body);
  if (!parsed.ok) {
    return jsonErr(400, "validation_error", parsed.message);
  }

  const rawUrls = parsed.urls;
  const scanProfile =
    body && typeof body === "object" && !Array.isArray(body) && (body as { profile?: string }).profile === "strict"
      ? ("strict" as const)
      : ("default" as const);
  const multiViewport = Boolean(
    body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      (body as { multiViewport?: boolean }).multiViewport,
  );

  const normalised: string[] = [];
  for (const raw of rawUrls) {
    let u = raw.trim();
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    normalised.push(u);
  }

  const validations = await Promise.all(normalised.map((u) => validateScanUrl(u)));
  const invalidIdx = validations.findIndex((v) => !v.ok);
  if (invalidIdx !== -1) {
    const invalid = validations[invalidIdx];
    return jsonErr(
      400,
      "invalid_url",
      `URL #${invalidIdx + 1}: ${(invalid as { ok: false; error: string }).error}`,
    );
  }

  const cleanUrls = (validations as { ok: true; url: string }[]).map((v) => v.url);
  const discoverySource: "sitemap" | "links" | "single" | undefined = parsed.wholeSite ? undefined : "single";
  const batchJobId = randomUUID();

  logger.info({ batchJobId, count: cleanUrls.length }, "Queueing batch accessibility audit job");

  try {
    await createBatchJob({
      batchJobId,
      urls: cleanUrls,
      scanProfile,
      multiViewport,
      discoverySource,
    });
  } catch (err) {
    logger.error({ err, batchJobId }, "Failed to create batch job");
    return jsonErr(500, "audit_failed", "The batch audit could not be started. Please try again.");
  }

  await enqueueJob({ type: "batch", batchJobId });

  return jsonOk(
    {
      batchJobId,
      status: "pending",
      ...(discoverySource ? { discoverySource } : {}),
      urlCount: cleanUrls.length,
      urls: cleanUrls,
    },
    202,
  );
}
