import type { MetadataRoute } from "next";
import { isProductionSite, siteUrl } from "@/lib/site-env";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/request-received"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
