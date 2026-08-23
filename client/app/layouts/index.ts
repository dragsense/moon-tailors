/**
 * App layouts — global shells, inner page layouts.
 *
 * ```txt
 * layouts/
 *   global/   AppShell, AuthShell, … + header/footer variants
 *   page/
 *     page-stack.tsx  Page / PageStack   — simple vertical
 *     page-split.tsx  PageSplit          — sidebar + main
 *     page-tabs.tsx   PageTabs           — header + tabs + body
 *     header/         StackHeader (PageHeader)
 *     footer/         StackFooter (PageFooter)
 * ```
 *
 * Pick one layout per page — each has its own props/styles.
 * Do not mix sidebar/columns into PageStack.
 *
 *   import { Page, PageSplit, PageTabs } from "~/layouts"
 */

export {
  AppShell,
  AuthShell,
  FocusShell,
  BlankShell,
  GlobalShell,
  NotificationBell,
  AppHeader,
  GlobalHeader,
  AppFooter,
  GlobalFooter,
  type AppShellProps,
  type AuthShellProps,
  type FocusShellProps,
  type BlankShellProps,
  type AppHeaderProps,
  type GlobalHeaderProps,
  type AppFooterProps,
  type GlobalFooterProps,
} from "./global";

export {
  Page,
  PageStack,
  PageSplit,
  PageTabs,
  StackHeader,
  PageHeader,
  StackFooter,
  PageFooter,
  type PageStackProps,
  type PageSplitProps,
  type PageTabsProps,
  type StackHeaderProps,
  type PageHeaderProps,
  type StackFooterProps,
  type PageFooterProps,
} from "./page";
