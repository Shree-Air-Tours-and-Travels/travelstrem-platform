import type { MetadataRoute } from "next";
import { articles } from "@/lib/shree-air";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/leads", "/contact", "/blog", ...articles.map(article => `/blog/${article.slug}`)].map(path => ({ url: new URL(path, siteUrl()).href }));
}
