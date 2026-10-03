/** "production" only on the approved live deployment; everything else is a staging preview. */
export const isProductionSite = process.env.NEXT_PUBLIC_SITE_ENV === "production";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jmtenterprise.net";
