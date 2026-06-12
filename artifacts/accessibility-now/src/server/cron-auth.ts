export function verifyCronSecret(req: Request): { ok: true } | { ok: false; message: string } {
  const secret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      return { ok: false, message: "CRON_SECRET is not configured." };
    }
    return { ok: true };
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return { ok: false, message: "Invalid cron secret." };
  }

  return { ok: true };
}
