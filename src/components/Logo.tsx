import Image from "next/image";
import { business } from "@/content/site";
import logoBlue from "../../public/brand/jmt-logo.png";
import logoWhite from "../../public/brand/jmt-logo-white.png";

/**
 * The client's logo (royal blue, with a white version for dark backgrounds).
 * Assets are generated from brand-source/ by `node scripts/brand-assets.mjs`.
 */
export function Logo({ onDark = false, alt = business.name, className = "h-11 w-auto lg:h-[52px]" }: { onDark?: boolean; alt?: string; className?: string }) {
  return <Image src={onDark ? logoWhite : logoBlue} alt={alt} className={className} priority={!onDark} sizes="160px" />;
}
