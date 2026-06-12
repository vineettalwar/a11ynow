import { verifyCronSecret } from "@/server/cron-auth";
import { runDueScans } from "@/server/scheduler";
import { jsonErr, jsonOk } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = verifyCronSecret(req);
  if (!auth.ok) {
    return jsonErr(401, "unauthorized", auth.message);
  }

  await runDueScans();
  return jsonOk({ ok: true });
}

export async function POST(req: Request) {
  return GET(req);
}
