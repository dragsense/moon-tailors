import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
import { APP_ROUTES, COMMON_ROUTES } from "./config/routes.config";

const path = (value: string) => value.replace(/^\//, "");

export default [
  layout("layouts/global/blank-shell.tsx", [
    layout("routes/guards/guest-guard.tsx", [
      layout("layouts/global/auth-shell.tsx", [
        index("pages/public/auth/login.tsx"),
      ]),
    ]),
    layout("routes/guards/auth-guard.tsx", [
      layout("routes/guards/access-guard.tsx", [
        layout("layouts/global/app-shell.tsx", [
          route(path(APP_ROUTES.DASHBOARD), "pages/protected/dashboard.tsx"),
          route(path(APP_ROUTES.CUSTOMERS), "pages/protected/customers/list.tsx"),
          route(
            path(APP_ROUTES.CUSTOMER_NEW_ORDER),
            "pages/protected/customers/new-order.tsx",
          ),
          route(path(APP_ROUTES.CUSTOMER), "pages/protected/customers/detail.tsx"),
          route(path(APP_ROUTES.ORDERS), "pages/protected/orders/list.tsx"),
          route(path(APP_ROUTES.ORDER), "pages/protected/orders/detail.tsx"),
          route(path(APP_ROUTES.PROFILE), "pages/protected/profile.tsx"),
          route(
            path(APP_ROUTES.RESET_PASSWORD),
            "pages/protected/reset-password.tsx",
          ),
          route(path(APP_ROUTES.SETTINGS), "pages/protected/settings.tsx"),
          route(
            path(COMMON_ROUTES.UNAUTHORIZED),
            "pages/protected/unauthorized.tsx",
          ),
        ]),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
