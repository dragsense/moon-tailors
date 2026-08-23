import type { CSSProperties, ReactNode } from "react";
import { Outlet } from "react-router";
import {
  ENV_BANNER_HEIGHT_PX,
  ENV_BANNER_OFFSET_CLASS,
  EnvironmentBanner,
} from "~/components/layout-ui/environment-banner";
import {
  getAppEnvironment,
  isNonProductionEnvironment,
} from "~/lib/app-environment";
import { cn } from "~/lib/utils";

export type BlankShellProps = {
  children: ReactNode;
  className?: string;
};

/** Outermost shell — mounts fixed env chrome and offsets content under it. */
export function BlankShell({ children, className }: BlankShellProps) {
  const showEnv = isNonProductionEnvironment(getAppEnvironment());

  return (
    <div
      className={cn("relative flex h-dvh flex-col overflow-hidden", className)}
      style={
        showEnv
          ? ({
              "--env-banner-height": `${ENV_BANNER_HEIGHT_PX}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <EnvironmentBanner />
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden",
          showEnv && ENV_BANNER_OFFSET_CLASS,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default function BlankShellLayout() {
  return (
    <BlankShell>
      <Outlet />
    </BlankShell>
  );
}
