import type { Metadata } from "next";
import { SEO_CONTENT } from "@/data/seo-resources";

type SeoKey = keyof typeof SEO_CONTENT;

export function buildSeoMetadata(key: SeoKey): Metadata {
  const content = SEO_CONTENT[key];
  return {
    title: `${content.title} ${content.titleAccent} | accessibility.now`,
    description: content.intro,
  };
}
