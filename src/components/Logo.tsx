import Image from "next/image";
import { business } from "@/content/site";
import logo from "../../public/brand/jmt-logo.png";

/**
 * JMT's own full-colour logo (navy, red and white). It needs a light
 * background, so on dark sections it sits on a white card.
 */
export function Logo({ onDark = false, alt = business.name, className = "h-14 w-auto lg:h-16" }: { onDark?: boolean; alt?: string; className?: string }) {
  const img = <Image src={logo} alt={alt} className={className} priority={!onDark} sizes="(min-width: 1024px) 200px, 160px" />;
  if (!onDark) return img;
  return <span className="inline-block rounded-2xl bg-white p-3 shadow-lg shadow-black/20">{img}</span>;
}
