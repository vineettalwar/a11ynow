import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { isChromiumReady } from "../lib/playwright-chromium";
import { getScanGateStats } from "../lib/scan-gate";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const gate = getScanGateStats();
  const data = HealthCheckResponse.parse({
    status: gate.shuttingDown ? "draining" : "ok",
    scanEngineReady: isChromiumReady(),
    scansInFlight: gate.active,
    scansQueued: gate.queued,
  });
  res.json(data);
});

export default router;
