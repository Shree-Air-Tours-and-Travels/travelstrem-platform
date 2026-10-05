import type { Metadata } from "next";

export const agencyName = "Shree Air Tours & Travels";
export const agencyDescription = "Shree Air Tours & Travels is a travel agency in Jaipur helping with domestic and international flights, hotels, holiday packages, tours and group trips.";

export function siteUrl() {
  const value = process.env.SHREE_AIR_SITE_URL;
  if (!value && process.env.NODE_ENV !== "development") throw new Error("Configure SHREE_AIR_SITE_URL for this deployment.");
  return new URL(value || "http://localhost:3031");
}

export function pageMetadata(title: string, description: string, path: string, article = false): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${agencyName}`, description, url: path, siteName: agencyName, locale: "en_IN", type: article ? "article" : "website" },
    twitter: { card: "summary", title: `${title} | ${agencyName}`, description },
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
