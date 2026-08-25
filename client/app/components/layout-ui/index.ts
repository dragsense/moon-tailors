/**
 * App-wide layout UI (not feature/domain UI).
 *
 * Structure — one folder per surface, named **variants** (not sidebar1/2):
 *
 * ```txt
 * layout-ui/
 *   modal/     ModalDialog (default), ModalSheet, ModalSurface
 *   confirm/   ConfirmCard (default), ConfirmInline
 *   alert/     AlertCallout (default), AlertBanner
 *   card/      CardPanel (default SurfaceCard), CardRow
 *   table/     TableSimple (default), TableData
 *   list/      ListStack (default), ListDivided
 *   pagination/ PaginationBar (default), ListPagination
 *   breadcrumb/ BreadcrumbTrail (default), BreadcrumbCompact
 *   sidebar/   SidebarPanel, LayoutSidebarRail
 *   nav/       NavTopbar (default), NavTabs
 * ```
 *
 * Shell / page chrome (headers, footers) lives in `~/layouts`:
 *   layouts/global/header  ·  layouts/page/header
 *
 * Import defaults:
 *   import { Modal, Confirm, Alert, List, SurfaceCard, CardRow } from "~/components/layout-ui"
 *
 * Import a specific version:
 *   import { ModalSheet } from "~/components/layout-ui/modal"
 *   import { ConfirmInline } from "~/components/layout-ui/confirm"
 *   import { CardPanel } from "~/components/layout-ui/card"
 *
 * All components are prop-driven (labels, rows, items, actions from caller).
 */

export {
  Modal,
  ModalDialog,
  ModalSheet,
  ModalSurface,
  type ModalDialogProps,
  type ModalSheetProps,
  type ModalSurfaceProps,
} from "./modal";

export {
  Confirm,
  ConfirmCard,
  ConfirmInline,
  type ConfirmCardProps,
  type ConfirmInlineProps,
  type ConfirmTone,
} from "./confirm";

export {
  Alert,
  AlertCallout,
  AlertBanner,
  type AlertCalloutProps,
  type AlertBannerProps,
  type AlertTone,
} from "./alert";

export {
  SurfaceCard,
  CardPanel,
  CardRow,
  type CardPanelProps,
  type CardRowProps,
} from "./card";

export {
  TableSimple,
  TableData,
  type TableColumn,
  type TableSimpleProps,
  type TableDataProps,
} from "./table";

export {
  List,
  ListStack,
  ListDivided,
  type ListItemMeta,
  type ListStackProps,
  type ListDividedProps,
} from "./list";

export {
  LegacySidebar,
  SidebarPanel,
  LayoutSidebarRail,
  type SidebarLink,
  type SidebarNavGroup,
  type SidebarRailProps,
  type SidebarPanelProps,
} from "./sidebar";

export {
  Nav,
  NavTopbar,
  NavTabs,
  type NavItem,
  type NavTopbarProps,
  type NavTabsProps,
} from "./nav";

export { ThemeToggle } from "./theme-toggle";

export { LanguageToggle } from "./language-toggle";

export {
  Pagination,
  PaginationBar,
  ListPagination,
  type PaginationBarProps,
  type ListPaginationMode,
  type ListPaginationProps,
} from "./pagination";

export {
  BreadcrumbTrail,
  BreadcrumbCompact,
  type BreadcrumbTrailProps,
  type BreadcrumbCompactProps,
  type BreadcrumbVariant,
} from "./breadcrumb";

export { AppLoader, type AppLoaderProps } from "./loader";

export { AppErrorScreen, type AppErrorScreenProps } from "./error";

export {
  EnvironmentBanner,
  ENV_BANNER_OFFSET_CLASS,
  ENV_BANNER_HEIGHT_PX,
} from "./environment-banner";
