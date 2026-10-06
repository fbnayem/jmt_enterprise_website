import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { business } from "@/content/site";

export const alt = `${business.name}: pickup and delivery for individuals and businesses`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image with the client's logo. Add an approved job photo here once JMT supplies one. */
export default async function OpengraphImage() {
  const logo = await fs.readFile(path.join(process.cwd(), "public/brand/jmt-logo-email.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
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
          background: "linear-gradient(135deg, #071733 0%, #0c2650 55%, #1f4892 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignSelf: "flex-start", background: "white", borderRadius: 28, padding: 18, borderBottom: "8px solid #c8161a" }}>
          <img src={logoSrc} width={300} height={202} alt="" />
        </div>
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, marginTop: 36 }}>Pickup and delivery for everyday and oversized items</div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#dbe5f6" }}>{`Request a quote · ${business.phoneDisplay}`}</div>
      </div>
    ),
    size,
  );
}
