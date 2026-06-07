"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { resolveSeoMeta, SITE } from "@/lib/seo-config";

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function SeoHead() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const location = query ? `${pathname}?${query}` : pathname;
  const meta = resolveSeoMeta(location);
  const canonical = `${SITE.url}${meta.path === "/" ? "" : meta.path}`;

  useEffect(() => {
    document.title = meta.title;
    upsertMeta("description", meta.description);
    upsertMeta("robots", meta.noindex ? "noindex, follow" : "index, follow");

    upsertMeta("og:title", meta.title, "property");
    upsertMeta("og:description", meta.description, "property");
    upsertMeta("og:type", meta.type ?? "website", "property");
    upsertMeta("og:url", canonical, "property");
    upsertMeta("og:site_name", SITE.name, "property");
    upsertMeta("og:image", SITE.ogImage, "property");

    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", meta.title);
    upsertMeta("twitter:description", meta.description);
    upsertMeta("twitter:image", SITE.ogImage);

    upsertLink("canonical", canonical);

    upsertJsonLd("seo-org-jsonld", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/favicon.svg`,
      parentOrganization: {
        "@type": "Organization",
        name: SITE.parentBrand,
        url: SITE.parentBrandUrl,
      },
      sameAs: [SITE.parentBrandUrl],
      description: SITE.defaultDescription,
    });

    if (meta.type === "article") {
      upsertJsonLd("seo-article-jsonld", {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: meta.title,
        description: meta.description,
        url: canonical,
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
        },
      });
    } else {
      document.getElementById("seo-article-jsonld")?.remove();
    }
  }, [meta.title, meta.description, meta.path, meta.type, meta.noindex, canonical]);

  return null;
}
