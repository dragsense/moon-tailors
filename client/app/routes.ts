import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
import { APP_ROUTES, COMMON_ROUTES, PUBLIC_ROUTES } from "./config/routes.config";

/** Config stores absolute paths for links; route() wants them relative. */
const path = (value: string) => value.replace(/^\//, "");

/**
 * Route tree only — page modules live under `pages/`.
 *
 * ```txt
 * blank-shell.tsx (all routes)
 *   guest-guard → auth-shell     / (login), signup, verify-otp, …
 *   auth-guard → access-guard → app-shell   dashboard, tasks, …
 * ```
 */
export default [
  layout("layouts/global/blank-shell.tsx", [
    layout("routes/guards/guest-guard.tsx", [
      layout("layouts/global/auth-shell.tsx", [
        index("pages/public/auth/login.tsx"),
        /** Legacy bookmark; canonical login is `/`. */
        route("login", "pages/public/auth/login-redirect.tsx"),
        route(path(PUBLIC_ROUTES.SIGNUP), "pages/public/auth/signup.tsx"),
        route(path(PUBLIC_ROUTES.VERIFY_OTP), "pages/public/auth/verify-otp.tsx"),
        route(
          path(PUBLIC_ROUTES.FORGOT_PASSWORD),
          "pages/public/auth/forgot-password.tsx",
        ),
        route(
          path(PUBLIC_ROUTES.RESET_PASSWORD),
          "pages/public/auth/reset-password.tsx",
        ),
        route(
          path(PUBLIC_ROUTES.EMAIL_LOGIN),
          "pages/public/auth/email-login.tsx",
        ),
      ]),
    ]),
    layout("routes/guards/auth-guard.tsx", [
      layout("routes/guards/access-guard.tsx", [
        layout("layouts/global/app-shell.tsx", [
          route(path(APP_ROUTES.DASHBOARD), "pages/protected/dashboard.tsx"),
          route(path(APP_ROUTES.TASKS), "pages/protected/tasks/list.tsx"),
          route(path(APP_ROUTES.TASK_CREATE), "pages/protected/tasks/new.tsx"),
          route(path(APP_ROUTES.USERS), "pages/protected/users/list.tsx"),
          route(path(APP_ROUTES.CHAT), "pages/protected/chat/list.tsx"),
          route(path(APP_ROUTES.SMS), "pages/protected/sms.tsx"),
          route(path(APP_ROUTES.EMAIL), "pages/protected/email.tsx"),
          route(
            path(APP_ROUTES.AVAILABILITY),
            "pages/protected/availability.tsx",
          ),
          route(path(APP_ROUTES.BILLINGS), "pages/protected/billings/list.tsx"),
          route(path(APP_ROUTES.PAYMENTS), "pages/protected/payments.tsx"),
          route(path(APP_ROUTES.AI), "pages/protected/ai.tsx"),
          route(path(APP_ROUTES.API_KEYS), "pages/protected/api-keys.tsx"),
          route(path(APP_ROUTES.FILES), "pages/protected/files/list.tsx"),
          route(path(APP_ROUTES.CAMERAS), "pages/protected/cameras/list.tsx"),
          route(path(APP_ROUTES.SETTINGS), "pages/protected/settings.tsx"),
          route(path(APP_ROUTES.CUSTOMIZE), "pages/protected/customize.tsx"),
          route(
            path(COMMON_ROUTES.UNAUTHORIZED),
            "pages/protected/unauthorized.tsx",
          ),
        ]),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
