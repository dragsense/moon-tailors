export {
  SidebarRail as LayoutSidebarRail,
  SidebarPanel,
  type SidebarLink,
  type SidebarNavGroup,
  type SidebarRailProps,
  type SidebarPanelProps,
} from "./sidebar";

/** Lightweight panel/rail sidebars (non-shadcn). */
export { SidebarPanel as LegacySidebar } from "./sidebar";

/** Collapsible shadcn sidebar wired to nav config. */
export { AppSidebar, type AppSidebarProps } from "./app-sidebar";
