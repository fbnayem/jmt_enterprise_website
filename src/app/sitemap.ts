import type { MetadataRoute } from "next";
import { business, pendingContent } from "@/content/site";
import { siteUrl } from "@/lib/site-env";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "/",
    "/services",
    "/about",
    "/faqs",
    "/request-a-quote",
    "/contact",
    // Draft pages join the sitemap once their content is approved.
    ...(business.serviceArea ? ["/service-areas"] : []),
    ...(pendingContent.privacyPolicy ? [] : ["/privacy-policy"]),
    ...(pendingContent.serviceTerms ? [] : ["/service-terms"]),
  ];
  return pages.map((p) => ({ url: `${siteUrl}${p === "/" ? "" : p}`, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
