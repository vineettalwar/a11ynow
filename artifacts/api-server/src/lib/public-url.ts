import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { scanAllowsPrivateTargets } from "./scan";

const dnsLookupAsync = promisify(dnsLookup);
const PRIVATE_IP_RE =
  /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

export function normalizeHttpUrl(raw: string): string {
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function validatePublicUrl(
  raw: string,
  allowPrivateTargets: boolean = scanAllowsPrivateTargets(),
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(normalizeHttpUrl(raw));
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!allowPrivateTargets && PRIVATE_IP_RE.test(hostname)) {
    return { ok: false, error: "Internal addresses are not allowed." };
  }
  if (!allowPrivateTargets) {
    try {
      const { address } = await dnsLookupAsync(hostname);
      if (PRIVATE_IP_RE.test(address)) {
        return { ok: false, error: "Internal addresses are not allowed." };
      }
    } catch {
      return { ok: false, error: "Could not resolve hostname." };
    }
  }
  return { ok: true, url: parsed.href };
}

export { PRIVATE_IP_RE };
