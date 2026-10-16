/** Theme Builder › Header (src/components/Header.tsx). Display condition: entire site. */
import { business, nav } from "../../../../src/content/site.ts";
import { gutterPad } from "../blocks.mjs";
import { box, button, container, icon, iconList, image, link, rawWidget, typo, px } from "../el.mjs";
import { color, LOGO_URL, width } from "../tokens.mjs";

/** WordPress menu the Nav Menu widget shows. README explains how it is created. */
export const MAIN_MENU = { name: "JMT Main Menu", slug: "jmt-main-menu", items: nav };

export default {
  name: "header",
  title: "JMT Header",
  type: "header",
  conditions: [{ type: "include", name: "general", sub_name: "", sub_id: "" }],
  content: () => [
    container(
      {
        tag: "header",
        boxed: width.page,
        pad: gutterPad([0, 0]),
        dir: "row",
        align: "center",
        justify: { d: "space-between", t: "flex-start", m: "flex-start" },
        gap: { d: 16, t: 4, m: 4 },
        minHeight: { d: 72, t: 64, m: 64 },
        bg: "rgba(255,255,255,0.7)",
        cls: "jmt-header",
        sticky: "top",
        raw: { sticky_effects_offset: 8, z_index: 40 },
      },
      [
        image(
          { url: LOGO_URL, alt: `${business.name} home` },
          { width: { d: 95, t: 83, m: 83 }, link: "/", align: "left", cls: "jmt-logo", grow: { d: false, t: true, m: true } },
        ),
        rawWidget(
          "nav-menu",
          {
            menu: MAIN_MENU.slug,
            layout: "horizontal",
            align_items: "center",
            pointer: "underline",
            animation_line: "slide",
            submenu_icon: { value: "fas fa-caret-down", library: "fa-solid" },
            dropdown: "tablet",
            full_width: "stretch",
            text_align: "aside",
            toggle: "burger",
            toggle_icon_normal: { value: "fas fa-bars", library: "fa-solid" },
            toggle_icon_active: { value: "fas fa-times", library: "fa-solid" },
            toggle_align: "right",
            ...typo("menu_typography", { size: 15, weight: 600, lh: 1.5 }),
            color_menu_item: color.slate600,
            color_menu_item_hover: color.brand700,
            color_menu_item_active: color.brand700,
            pointer_color_menu_item_hover: color.accent500,
            pointer_color_menu_item_active: color.accent500,
            pointer_width: px(2),
            padding_horizontal_menu_item: px(14),
            padding_vertical_menu_item: px(8),
            menu_space_between: px(4),
            color_dropdown_item: color.slate800,
            background_color_dropdown_item: color.white,
            color_dropdown_item_hover: color.brand700,
            background_color_dropdown_item_hover: color.brand50,
            color_dropdown_item_active: color.brand700,
            background_color_dropdown_item_active: color.brand50,
            ...typo("dropdown_typography", { size: 18, weight: 600, lh: 1.556 }),
            padding_horizontal_dropdown_item: px(16),
            padding_vertical_dropdown_item: px(12),
            dropdown_top_distance: px(0),
            toggle_color: color.brand900,
            toggle_background_color: "rgba(0,0,0,0)",
            toggle_size: px(24),
            toggle_border_radius: px(9999),
          },
          { cls: "jmt-nav", order: { t: "end" } },
        ),
        container(
          { dir: "row", align: "center", gap: 16, hide: ["tablet", "mobile"], width: { unit: "px", size: "" }, raw: { _flex_size: "none" } },
          [
            iconList([{ text: business.phoneDisplay, icon: "phone-alt", url: business.phoneHref }], {
              size: 15,
              weight: 700,
              textColor: color.brand800,
              textHover: color.brand600,
              iconColor: color.brand600,
              iconSize: 14,
              iconGap: 8,
              cls: "jmt-phone",
              widthAuto: true,
            }),
            button("Request a Quote", "/request-a-quote", {
              size: 15,
              icon: "arrow-right",
              padY: 10,
              padX: 20,
              cls: "jmt-btn--compact",
              widthAuto: true,
            }),
          ],
        ),
        icon("phone-alt", {
          view: "stacked",
          shape: "circle",
          primary: color.brand50,
          secondary: color.brand700,
          size: 18,
          pad: 13,
          link: { ...link(business.phoneHref), custom_attributes: `aria-label|Call ${business.phoneDisplay}` },
          hide: ["desktop"],
          widthAuto: true,
        }),
      ],
    ),
  ],
};
