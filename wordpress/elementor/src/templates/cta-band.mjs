/** Reusable CTA band as its own library block (also placed on each page). */
import { ctaBand } from "../blocks.mjs";

export default {
  name: "cta-band",
  title: "JMT CTA Band",
  type: "container",
  content: () => [ctaBand()],
};
