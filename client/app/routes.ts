import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
import { APP_ROUTES, COMMON_ROUTES, PUBLIC_ROUTES } from "./config/routes.config";

const path = (value: string) => value.replace(/^\//, "");

export default [
  layout("layouts/global/blank-shell.tsx", [
    layout("routes/guards/guest-guard.tsx", [
      layout("layouts/global/auth-shell.tsx", [
        index("pages/public/auth/login.tsx"),
        route("login", "pages/public/auth/login-redirect.tsx"),
        route(path(PUBLIC_ROUTES.VERIFY_OTP), "pages/public/auth/verify-otp.tsx"),
        route(
          path(PUBLIC_ROUTES.FORGOT_PASSWORD),
          "pages/public/auth/forgot-password.tsx",
        ),
        route(
          path(PUBLIC_ROUTES.RESET_PASSWORD),
          "pages/public/auth/reset-password.tsx",
        ),
      ]),
    ]),
    layout("routes/guards/auth-guard.tsx", [
      layout("routes/guards/access-guard.tsx", [
        layout("layouts/global/app-shell.tsx", [
          route(path(APP_ROUTES.DASHBOARD), "pages/protected/dashboard.tsx"),
          route(path(APP_ROUTES.CUSTOMERS), "pages/protected/customers/list.tsx"),
          route(
            "customers/:id/orders/new",
            "pages/protected/customers/new-order.tsx",
          ),
          route("customers/:id", "pages/protected/customers/detail.tsx"),
          route(path(APP_ROUTES.ORDERS), "pages/protected/orders/list.tsx"),
          route("orders/:id", "pages/protected/orders/detail.tsx"),
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
