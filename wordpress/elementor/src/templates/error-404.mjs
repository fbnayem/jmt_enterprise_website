/** Theme Builder › Single › 404 page (src/app/not-found.tsx). */
import { section } from "../blocks.mjs";
import { button, container, heading, text } from "../el.mjs";
import { color, width } from "../tokens.mjs";

export default {
  name: "error-404",
  title: "JMT 404",
  type: "error-404",
  conditions: [{ type: "include", name: "singular", sub_name: "not_found404", sub_id: "" }],
  content: () => [
    section({ y: [96, 96], inner: width.xl }, [
      heading("Page not found", { tag: "h1", size: "3xl", weight: 800, color: color.brand900, align: "center" }),
      text("<p>The page you are looking for does not exist or has moved.</p>", {
        color: color.muted,
        align: "center",
        margin: [16, 0, 0, 0],
      }),
      container(
        {
          dir: { d: "row", t: "row", m: "column" },
          justify: "center",
          align: { d: "center", t: "center", m: "stretch" },
          gap: 12,
          margin: [32, 0, 0, 0],
          width: { unit: "%", size: 100 },
        },
        [
          button("Home", "/", { variant: "secondary", full: { m: "justify" }, raw: { _element_width: "auto", _element_width_mobile: "inherit" } }),
          button("Request a Quote", "/request-a-quote", { variant: "primary", full: { m: "justify" }, raw: { _element_width: "auto", _element_width_mobile: "inherit" } }),
        ],
      ),
    ]),
  ],
};
