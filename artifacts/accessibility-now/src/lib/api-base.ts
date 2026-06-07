type ViteLikeEnv = {
  BASE_URL?: string;
  VITE_API_BASE_URL?: string;
};

function getViteEnv(): ViteLikeEnv | undefined {
  return (import.meta as ImportMeta & { env?: ViteLikeEnv }).env;
}

export function getAppBasePath(): string {
  const viteBase = getViteEnv()?.BASE_URL;
  if (typeof viteBase === "string" && viteBase.trim()) {
    return viteBase.replace(/\/$/, "");
  }

  const nextBase = process.env.NEXT_PUBLIC_BASE_PATH;
  if (typeof nextBase === "string" && nextBase.trim()) {
    return nextBase.replace(/\/$/, "");
  }

  return "";
}

/** Relative `/api` works in dev (Vite proxy) and on Cloudflare Pages (Functions proxy). */
export function getApiBase(): string {
  const fromEnv = getViteEnv()?.VITE_API_BASE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  return getAppBasePath();
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
