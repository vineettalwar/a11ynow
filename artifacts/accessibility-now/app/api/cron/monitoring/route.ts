import { runDueScans } from "@/server/scheduler";
import { jsonErr, jsonOk } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return jsonErr(401, "unauthorized", "Invalid cron secret.");
  }

  await runDueScans();
  return jsonOk({ ok: true });
}

export async function POST(req: Request) {
  return GET(req);
}
