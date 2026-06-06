/**
 * Cloudflare Pages Function: proxy /api/* to the Node API host.
 *
 * Set `API_ORIGIN` in the Cloudflare Pages dashboard (e.g. https://api.accessibility.now).
 * When unset, returns 503 with a JSON hint so static-only deploys fail clearly.
 */
interface Env {
  API_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const origin = context.env.API_ORIGIN?.replace(/\/$/, "");
  if (!origin) {
    return new Response(
      JSON.stringify({
        error: "api_not_configured",
        message:
          "Set API_ORIGIN on Cloudflare Pages to your Express API host (e.g. https://api.accessibility.now).",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const incoming = new URL(context.request.url);
  const target = new URL(incoming.pathname + incoming.search, origin);

  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  const upstream = await fetch(target.toString(), init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};
