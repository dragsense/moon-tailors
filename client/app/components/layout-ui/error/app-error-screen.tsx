import { isRouteErrorResponse } from "react-router";
import {
  AlertTriangle,
  LogIn,
  RefreshCw,
  ShieldAlert,
  FileQuestion,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { withAppBasename } from "~/lib/app-base";
import { cn } from "~/lib/utils";

export type AppErrorScreenProps = {
  error: unknown;
  className?: string;
};

type ResolvedError = {
  status?: number;
  title: string;
  message: string;
  hint: string;
  details?: string;
};

function resolveError(error: unknown): ResolvedError {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        status: 404,
        title: "Page not found",
        message:
          typeof error.data === "string" && error.data
            ? error.data
            : "This page doesn’t exist or was moved.",
        hint: "Check the URL, or go back home and try again from there.",
      };
    }
    if (error.status === 401 || error.status === 403) {
      return {
        status: error.status,
        title: error.status === 401 ? "Sign in required" : "Access denied",
        message:
          typeof error.data === "string" && error.data
            ? error.data
            : error.status === 401
              ? "Your session expired or you aren’t signed in."
              : "You don’t have permission to view this page.",
        hint:
          error.status === 401
            ? "Sign in again to continue."
            : "Ask an admin if you think you should have access.",
      };
    }
    return {
      status: error.status,
      title: `Error ${error.status}`,
      message:
        typeof error.data === "string" && error.data
          ? error.data
          : error.statusText || "The server returned an unexpected response.",
      hint: "Try refreshing the page. If it keeps happening, contact support.",
    };
  }

  if (error instanceof Error) {
    return {
      title: "Something went wrong",
      message: error.message || "An unexpected application error occurred.",
      hint: "Try refreshing. If the problem continues, copy the details below and share them with your team.",
      details:
        import.meta.env.DEV && error.stack ? error.stack : undefined,
    };
  }

  return {
    title: "Something went wrong",
    message: "An unexpected application error occurred.",
    hint: "Try refreshing the page or returning home.",
  };
}

function ErrorIcon({ status }: { status?: number }) {
  if (status === 404) return <FileQuestion className="size-7" />;
  if (status === 401 || status === 403) return <ShieldAlert className="size-7" />;
  return <AlertTriangle className="size-7" />;
}

/**
 * Centered full-viewport error UI for the root ErrorBoundary.
 * No i18n hooks — safe when providers are unmounted after a crash.
 */
export function AppErrorScreen({ error, className }: AppErrorScreenProps) {
  const resolved = resolveError(error);

  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.55_0.2_25_/_0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,oklch(0.51_0.09_180_/_0.1),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.3] [background-image:linear-gradient(to_right,oklch(0.5_0.02_250_/_0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0.02_250_/_0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]"
      />

      <div className="relative w-full max-w-lg rounded-2xl border bg-card/90 p-6 shadow-lg backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <ErrorIcon status={resolved.status} />
          </div>

          {resolved.status ? (
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              HTTP {resolved.status}
            </p>
          ) : null}

          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {resolved.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{resolved.message}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/90">
            {resolved.hint}
          </p>
        </div>

        {resolved.details ? (
          <details className="mt-5 rounded-lg border bg-muted/40 text-start">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
              Technical details
            </summary>
            <pre className="max-h-48 overflow-auto border-t px-3 py-2 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {resolved.details}
            </pre>
          </details>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" asChild className="gap-2">
            <a href={withAppBasename("/")}>
              <LogIn className="size-4" />
              Sign in
            </a>
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
