import Script from "next/script";
import { pendingContent } from "@/content/site";

export const ANALYTICS_OPT_OUT_KEY = "jmt-analytics-opt-out";

const ga4 = process.env.NEXT_PUBLIC_GA4_ID;

/**
 * GA4 with Consent Mode v2. It stays off until a measurement id is set AND the
 * client-approved privacy policy (which describes analytics and the opt-out)
 * is in place. Advertising signals are always denied; analytics storage is
 * denied for visitors who opted out on the privacy page.
 */
export function Analytics() {
  if (!ga4 || !/^G-[A-Z0-9]{4,20}$/.test(ga4) || pendingContent.privacyPolicy) return null;
  const init = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
var optedOut=false;try{optedOut=localStorage.getItem('${ANALYTICS_OPT_OUT_KEY}')==='1'}catch(e){}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:optedOut?'denied':'granted'});
gtag('js',new Date());gtag('config','${ga4}');`;
  return (
    <>
      <Script id="ga4-consent" strategy="afterInteractive">
        {init}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
    </>
  );
}
