import { HealthCheckResponse } from "@workspace/api-zod";
import { isChromiumReady } from "@/server/playwright-chromium";
import { getScanGateStatsAsync } from "@/server/scan-gate";
import { jsonOk, prepareRequestDb } from "@/server/http";

export async function GET() {
  prepareRequestDb();
  const gate = await getScanGateStatsAsync();
  const data = HealthCheckResponse.parse({
    status: gate.shuttingDown ? "draining" : "ok",
    scanEngineReady: isChromiumReady(),
    scansInFlight: gate.active,
    scansQueued: gate.queued,
  });
  return jsonOk(data);
}
