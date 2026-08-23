/**
 * Direction → layout mapping in one place.
 * Components should use `useI18n()` fields (or these helpers) — never
 * `direction === "rtl" ? …` inline.
 */

export type TextDirection = "ltr" | "rtl";

export type DirectionLayout = {
  dir: TextDirection;
  direction: TextDirection;
  isRtl: boolean;
  isLtr: boolean;
  /** Physical dock side for shadcn `<Sidebar side>`. */
  sidebarSide: "left" | "right";
  /**
   * Logical Radix/Floating UI aligns — document `dir` mirrors them.
   * Use `alignStart` near the sidebar edge; `alignEnd` near the trailing chrome.
   */
  alignStart: "start";
  alignEnd: "end";
};

export function resolveDirectionLayout(dir: TextDirection): DirectionLayout {
  const isRtl = dir === "rtl";
  return {
    dir,
    direction: dir,
    isRtl,
    isLtr: !isRtl,
    sidebarSide: isRtl ? "right" : "left",
    alignStart: "start",
    alignEnd: "end",
  };
}
