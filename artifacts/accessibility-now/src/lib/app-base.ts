/** App base path without trailing slash (matches former Vite BASE_URL). */
export function appBasePath(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_PATH ??
    process.env.BASE_PATH ??
    "";
  return raw.replace(/\/$/, "");
}

/** Prefix an app path with the configured base path. */
export function withBasePath(path: string): string {
  const base = appBasePath();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
