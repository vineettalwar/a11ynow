import { batchJobToProgress, getBatchJob } from "@/server/jobs/batch-job-store";
import { resolvePageScreenshot } from "@/server/artifacts/storage";
import { jsonErr, jsonOk } from "@/server/http";
import type { BatchJobUrlState } from "@/server/jobs/types";

async function resolveBatchResultScreenshots(
  result: Record<string, unknown> | null | undefined,
): Promise<Record<string, unknown> | undefined> {
  if (!result || !Array.isArray(result.pages)) return result ?? undefined;

  const pages = await Promise.all(
    (result.pages as Array<Record<string, unknown>>).map(async (page) => {
      if (typeof page.pageScreenshot !== "string") return page;
      const resolved = await resolvePageScreenshot(page.pageScreenshot);
      if (!resolved) {
        const { pageScreenshot: _drop, ...rest } = page;
        return rest;
      }
      return { ...page, pageScreenshot: resolved };
    }),
  );

  return { ...result, pages };
}

async function resolveProgressScreenshots(
  urlStates: BatchJobUrlState[],
): Promise<BatchJobUrlState[]> {
  return Promise.all(
    urlStates.map(async (state) => {
      if (typeof state.pageScreenshot !== "string") return state;
      const resolved = await resolvePageScreenshot(state.pageScreenshot);
      if (!resolved) {
        const { pageScreenshot: _drop, ...rest } = state;
        return rest;
      }
      return { ...state, pageScreenshot: resolved };
    }),
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ batchJobId: string }> },
) {
  const { batchJobId } = await params;
  if (!batchJobId?.trim()) {
    return jsonErr(400, "validation_error", "batchJobId is required.");
  }

  const job = await getBatchJob(batchJobId);
  if (!job) {
    return jsonErr(404, "not_found", "Batch audit job not found.");
  }

  const progress = batchJobToProgress(job);
  const urlStates = await resolveProgressScreenshots(progress.urlStates);
  const result = await resolveBatchResultScreenshots(
    (job.resultJson as Record<string, unknown> | null) ?? undefined,
  );

  return jsonOk({
    batchJobId: job.batchJobId,
    status: job.status,
    error: job.errorMessage ?? undefined,
    progress: {
      discoverySource: progress.discoverySource,
      discovering: progress.discovering,
      urlStates,
    },
    result,
  });
}
