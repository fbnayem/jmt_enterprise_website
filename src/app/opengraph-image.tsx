import { ImageResponse } from "next/og";
import { business } from "@/content/site";

export const alt = `${business.name}: pickup and delivery for individuals and businesses`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Text-only share image. Replace with an approved photo once JMT supplies one. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #070e24 0%, #16285f 60%, #213f9c 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, color: "#ffcf7a", letterSpacing: 2 }}>{business.shortName.toUpperCase()}</div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>Pickup and delivery for everyday and oversized items</div>
        <div style={{ fontSize: 32, marginTop: 32, color: "#dbe7ff" }}>{`Request a quote · ${business.phoneDisplay}`}</div>
      </div>
    ),
    size,
  );
}
