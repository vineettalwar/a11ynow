"use client";

import { SeoArticle } from "@/components/seo-article";
import { SEO_CONTENT } from "@/data/seo-resources";

export default function TechWordpress() {
  return <SeoArticle content={SEO_CONTENT["tech-wordpress"]} />;
}
