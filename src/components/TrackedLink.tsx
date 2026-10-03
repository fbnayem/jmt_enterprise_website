"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

type Props = ComponentProps<"a"> & { kind: "phone" | "email" | "quote"; location: string };

/** Phone, email and quote links that record a non-personal analytics event. */
export function TrackedLink({ kind, location, href = "", onClick, ...rest }: Props) {
  const handle: Props["onClick"] = (e) => {
    track(kind === "phone" ? "phone_click" : kind === "email" ? "email_click" : "quote_cta_click", { location });
    onClick?.(e);
  };
  if (kind === "quote") return <Link href={href} onClick={handle} {...rest} />;
  return <a href={href} onClick={handle} {...rest} />;
}
